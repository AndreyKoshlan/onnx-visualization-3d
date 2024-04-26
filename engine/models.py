import os
import onnx
import numpy as np
from PIL import Image
from onnx import numpy_helper
import onnxruntime as ort
import tensorflow as tf
import tf2onnx
import uuid
import io

class Model:
    def get_image_input(self, file_name):
        image = Image.open(file_name).convert('L')

        image = image.resize((28, 28))

        image_np = np.array(image).astype(np.float32)
        image_np = image_np / 255.0
        image_np = np.expand_dims(image_np, axis=0)

        return image_np

    def extend_graph_outputs(self):
        # https://github.com/microsoft/onnxruntime/issues/1455

        org_outputs = [x.name for x in self.session.get_outputs()]
        for node in self.onnx_model.graph.node:
            for output in node.output:
                if output not in org_outputs:
                    self.onnx_model.graph.output.extend([onnx.ValueInfoProto(name=output)])

        stream = io.BytesIO()
        onnx.save_model(self.onnx_model, stream)
        stream.seek(0)

        self.session = ort.InferenceSession(stream.read())

    def load_onnx(self, path):
        self.onnx_model = onnx.load(path)
        self.session = ort.InferenceSession(path)

        self.extend_graph_outputs()

    def load_onnx_from_tf(self, path):
        tf_model = tf.keras.models.load_model(path)
        self.onnx_model, _ = tf2onnx.convert.from_keras(tf_model)

        model_stream = io.BytesIO()
        onnx.save_model(self.onnx_model, model_stream)
        model_stream.seek(0)

        self.session = ort.InferenceSession(model_stream.read())

        self.extend_graph_outputs()

    def __init__(self, path):
        self.session = None
        self.onnx_model = None
        self.uuid = uuid.uuid4().hex
        self.path = path
        self.ext = os.path.splitext(path)[-1]
        match self.ext:
            case ".h5":
                self.load_onnx_from_tf(self.path)
            case ".onnx":
                self.load_onnx(self.path)
            case _:
                raise Exception("Unknown extension")


class ModelList:
    def __init__(self, path):
        self.path = path
        self.loaded_list = []
        self.model_paths = []
        self.refresh()

    def load(self, path):
        model = Model(path)
        self.loaded_list.append(model)

    def refresh(self):
        self.model_paths = []

        if not os.path.exists(self.path):
            return

        for root, _, files in os.walk(self.path):
            for file in files:
                self.model_paths.append(os.path.join(root, file))

    def get_by_uuid(self, searched_uuid):
        for model in self.loaded_list:
            if model.uuid == searched_uuid:
                return model

    def get_model_paths(self):
        self.refresh()
        return self.model_paths[:]

    def get_loaded_model_paths(self):
        return [model.path for model in self.loaded_list]

    def get_loaded_model_paths_and_uuid(self):
        return [f"{model.path} | {model.uuid}" for model in self.loaded_list]

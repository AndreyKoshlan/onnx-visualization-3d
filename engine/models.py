import json
import os
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import tensorflow as tf
import tf2onnx
import uuid
import io

import onnxruntime.training.artifacts as ort_artifacts
import onnxruntime.training.api as ort_train

from engine.artifacts import Artifacts
from engine.onnx_encoder import ONNXEncoder
from engine.scripted_dataset import DatasetContainer
from engine.temp_folder_controller import TempFolderController

artifacts_folder_controller = TempFolderController("training/artifacts")

class Model:
    def load_session(self, onnx_model):
        # https://github.com/microsoft/onnxruntime/issues/1455

        copied_model = onnx.ModelProto()
        copied_model.CopyFrom(onnx_model)

        org_outputs = [x.name for x in copied_model.graph.output]
        for node in copied_model.graph.node:
            for output in node.output:
                if output not in org_outputs:
                    copied_model.graph.output.extend([onnx.ValueInfoProto(name=output)])

        stream = io.BytesIO()
        onnx.save_model(copied_model, stream)
        stream.seek(0)

        self.session = ort.InferenceSession(stream.read(), providers=ort.get_available_providers())

    def load_onnx_model_from_onnx_file(self, path):
        self.onnx_model = onnx.load_model(path)

    def load_onnx_model_from_tf(self, path):
        tf_model = tf.keras.models.load_model(path)
        self.onnx_model, _ = tf2onnx.convert.from_keras(tf_model)

    def load_onnx_model(self):
        match self.ext:
            case ".h5":
                self.load_onnx_model_from_tf(self.path)
            case ".onnx":
                self.load_onnx_model_from_onnx_file(self.path)
            case _:
                raise Exception("Unknown extension")

    def get_trainable_parameter_names(self):
        return [param.name for param in self.onnx_model.graph.initializer if param.data_type == 1]

    def generate_artifacts(self, requires_grad, frozen_params, loss, optimizer):
        if len(requires_grad) == 0:
            requires_grad = self.get_trainable_parameter_names()

        self.artifact_directory = artifacts_folder_controller.create_temp_folder()

        ort_artifacts.generate_artifacts(
            self.onnx_model,
            requires_grad=requires_grad,
            frozen_params=frozen_params,
            loss=loss,
            optimizer=optimizer,
            artifact_directory=self.artifact_directory
        )

        self.artifacts = Artifacts.from_directory(self.artifact_directory)

    def test(self, example):
        inputs = dict()

        input_names = [x.name for x in self.session.get_inputs()]
        inputs[input_names[0]] = example[0].numpy()

        node_names = [x.name for x in self.session.get_outputs()]
        outputs = self.session.run(node_names, inputs)

        payload = ONNXEncoder.get_payload(self, inputs, dict(zip(node_names, outputs)), {})

        return payload

    def train(self, num_epochs):
        train_loader = self.dataset.train_loader
        train_model = self.artifacts.model
        optimizer = self.artifacts.optimizer
        saved_model_path = self.artifact_directory / "saved_model.onnx"
        graph_output_names = [x.name for x in self.onnx_model.graph.output]

        print(f"Training started for {num_epochs} epochs.")
        print(f"Path: {self.path}")
        print(f"Artifact directory (ONNX): {self.artifact_directory}")
        print(f"Device: {self.artifacts.device}")

        for epoch in range(num_epochs):
            self.epoch_index = epoch

            train_model.export_model_for_inferencing(saved_model_path, graph_output_names)
            self.load_onnx_model_from_onnx_file(saved_model_path)
            self.load_session(self.onnx_model)
            self.test_graph = self.test(self.dataset.example)

            train_model.train()
            total_loss = 0

            for user_inputs in train_loader:
                user_inputs = [tensor.numpy() for tensor in user_inputs]
                total_loss += train_model(*user_inputs)
                optimizer.step()
                train_model.lazy_reset_grad()

                if self.training_stopped:
                    break

            print(f"[{self.path}] Epoch {epoch + 1} Loss {np.sum(total_loss) / len(train_loader)}")

            if self.training_stopped:
                print(f"[{self.path}] Stopped")
                break

    def get_shape(self, input_name):
        inputs = self.session.get_inputs()
        for input_arg in inputs:
            if input_arg.name == input_name:
                return input_arg.shape
        return None

    def __init__(self, path: Path):
        self.session = None
        self.onnx_model = None
        self.epoch_index = 0
        self.training_stopped = True
        self.artifacts: Artifacts | None = None
        self.artifact_directory: Path | None = None
        self.dataset: DatasetContainer | None = None
        self.test_graph: str | None = None
        self.path: Path = path
        self.ext = os.path.splitext(path)[-1]
        self.uuid = uuid.uuid4().hex

class ModelList:
    def __init__(self, path):
        self.path = Path(path)
        self.loaded_list = []
        self.train_list = []
        self.model_paths = []
        self.refresh()

    def load(self, path, for_training: bool):
        model = Model(Path(path))
        model.load_onnx_model()
        if for_training:
            self.train_list.append(model)
        else:
            model.load_session(model.onnx_model)
            self.loaded_list.append(model)
        return model

    def refresh(self):
        self.model_paths = []

        if not os.path.exists(self.path):
            return

        for root, _, files in os.walk(self.path):
            for file in files:
                self.model_paths.append(os.path.join(root, file))

    def get_by_uuid(self, searched_uuid, for_training=False):
        model_list = self.train_list if for_training else self.loaded_list
        for model in model_list:
            if model.uuid == searched_uuid:
                return model

    def delete_by_uuid(self, searched_uuid, for_training=False):
        model_list = self.train_list if for_training else self.loaded_list
        for model in model_list:
            if model.uuid == searched_uuid:
                model_list.remove(model)
                return

    def get_model_paths(self):
        self.refresh()
        return self.model_paths[:]

    def get_loaded_model_paths_and_uuid(self):
        return [f"{model.path} | {model.uuid}" for model in self.loaded_list]

    def get_training_model_paths_and_uuid(self):
        return [f"{model.path} | {model.uuid}" for model in self.train_list]

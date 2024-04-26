import onnxruntime
from google.protobuf.internal.containers import BaseContainer
from onnx import numpy_helper
import onnx
import numpy as np
import json

from engine.models import Model


class ONNXEncoder(json.JSONEncoder):
    """ Custom JSON encoder for ONNX and numpy types """

    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, onnx.GraphProto):
            return self.encode_onnx_graph(obj)
        elif isinstance(obj, BaseContainer):
            return list(obj)

        # input and output
        elif isinstance(obj, onnx.ValueInfoProto):
            return self.encode_value_info(obj)
        elif isinstance(obj, onnx.TypeProto):
            return self.encode_type_info(obj)
        elif isinstance(obj, onnx.TensorShapeProto):
            return self.encode_tensor_shape(obj)

        # input and output onnxruntime
        elif isinstance(obj, onnxruntime.NodeArg):
            return self.encode_node_arg(obj)

        return json.JSONEncoder.default(self, obj)

    @staticmethod
    def get_payload(model: Model, inputs: dict, outputs: dict):
        return {
            "graph": model.onnx_model.graph,
            "args": {
                "inputs": {inp.name: inp for inp in model.session.get_inputs()},
                "outputs": {out.name: out for out in model.session.get_outputs()}
            },
            "inputs": inputs,
            "outputs": outputs
        }

    def encode_node_arg(self, arg: onnxruntime.NodeArg):
        arg_data = {
            "name": arg.name,
            "shape": arg.shape,
            "type": arg.type
        }
        return arg_data

    def encode_tensor_shape(self, shape: onnx.TensorShapeProto):
        shape_data = {
            "dim": [
                {
                    "denotation": dim.denotation,
                    "dim_param": dim.dim_param,
                    "dim_value": dim.dim_value
                } for dim in shape.dim
            ]
        }
        return shape_data

    def encode_type_info(self, value: onnx.TypeProto):
        type_data = {
            "denotation": value.denotation
        }
        return type_data

    def encode_value_info(self, value: onnx.ValueInfoProto):
        value_data = {
            "name": value.name,
            "type": {
                "map_type": {
                    "key_type": value.type.map_type.key_type,  # int
                    "value_type": value.type.map_type.value_type  # TypeProto
                },
                "opaque_type": {
                    "domain": value.type.opaque_type.domain,  # str
                    "name": value.type.opaque_type.name  # str
                },
                "optional_type": {
                    "elem_type": value.type.optional_type.elem_type  # TypeProto
                },
                "sequence_type": {
                    "elem_type": value.type.sequence_type.elem_type  # TypeProto
                },
                "sparse_tensor_type": {
                    "elem_type": value.type.sparse_tensor_type.elem_type,  # int
                    "shape": value.type.sparse_tensor_type.shape
                },
                "tensor_type": {
                    "elem_type": value.type.tensor_type.elem_type,  # int
                    "shape": value.type.tensor_type.shape
                }
            }
        }
        return value_data

    def encode_onnx_graph(self, graph: onnx.GraphProto):
        graph_data = {
            "input": {inp.name: inp for inp in graph.input},
            "output": {out.name: out for out in graph.output},
            "initializers": {
                initializer.name: {
                    "dimensions": initializer.dims,
                    "data_type": initializer.data_type,
                    "array": numpy_helper.to_array(initializer).tolist()
                } for initializer in graph.initializer
            },
            "nodes": {
                node.name: {
                    "inputs": node.input,
                    "outputs": node.output,
                    "operation_type": node.op_type
                } for node in graph.node
            }
        }
        return graph_data

import onnxruntime as ort
import onnxruntime.training.api as ort_train
import pathlib

class Artifacts:
    def __init__(
        self,
        model: ort_train.Module,
        checkpoint_state: ort_train.CheckpointState,
        optimizer: ort_train.optimizer,
        device: str = ""
    ):
        self.model = model
        self.checkpoint_state = checkpoint_state
        self.optimizer = optimizer
        self.device = device

    @staticmethod
    def from_directory(path: pathlib.Path):
        checkpoint_state = ort_train.CheckpointState.load_checkpoint(
            path / "checkpoint"
        )

        device = "cuda" if ort.get_available_providers()[0] == "CUDAExecutionProvider" else "cpu"

        model = ort_train.Module(
            path / "training_model.onnx",
            checkpoint_state,
            path / "eval_model.onnx",
            device=device
        )

        optimizer = ort_train.Optimizer(
            path / "optimizer_model.onnx",
            model
        )
        return Artifacts(model, checkpoint_state, optimizer, device)

import json

import gradio as gr
import time

from engine.artifacts import Artifacts
from engine.onnx_encoder import ONNXEncoder
from ui import shared, symbols, ui_model
from ui.canvas_component import CanvasComponent
from ui.ui_visual_settings import VisualSettings


class TrainTab:
    @staticmethod
    def get_dropdown_for_python_files():
        return gr.Dropdown(shared.scripted_dataset_list.get_paths())

    @staticmethod
    def connect(uuid, settings):
        def create_components(payload=None):
            connect_button = gr.Button(visible=False)
            disconnect_button = gr.Button(visible=True)

            if payload is not None:
                payload["settings"] = settings
                payload = json.dumps(payload, cls=ONNXEncoder)

            canvas_config = {"value": payload} if payload is not None else {}
            canvas = CanvasComponent(**canvas_config)

            return [connect_button, disconnect_button, canvas]

        model = shared.model_list.get_by_uuid(uuid, for_training=True)
        last_epoch = -1

        while True:
            if last_epoch != model.epoch_index:
                last_epoch = model.epoch_index
                yield create_components(model.test_graph)
            time.sleep(1)

    @staticmethod
    def disconnect():
        connect_button = gr.Button(visible=True)
        disconnect_button = gr.Button(visible=False)
        return [
            connect_button,
            disconnect_button
        ]

    @staticmethod
    def train(uuid, script_path, epochs, learning_rate):
        model = shared.model_list.get_by_uuid(uuid, for_training=True)
        model.training_stopped = False
        model.dataset = shared.scripted_dataset_list.load(script_path)

        model.artifacts.optimizer.set_learning_rate(learning_rate)
        model.train(epochs)
        return uuid

    @staticmethod
    def stop(uuid):
        model = shared.model_list.get_by_uuid(uuid, for_training=True)
        model.training_stopped = True

    @staticmethod
    def unload_training_model(uuid):
        shared.model_list.delete_by_uuid(uuid, for_training=True)
        return ui_model.ModelTab.get_dropdown_for_training_models()

    @staticmethod
    def select_train_model(model_path):
        uuid = model_path.split("| ")[-1]
        return uuid

    def init_components(self):
        with gr.Row(elem_classes=["menu-element"]):
            self.dropdown_training_models = gr.Dropdown(
                [],
                elem_classes=["menu-element"],
                label="Select the model",
                interactive=True
            )
            self.refresh_training_models_button = gr.Button(symbols.refresh_symbol, elem_classes=["small-menu-button"])
            self.unload_button = gr.Button("Unload", elem_classes=["medium-menu-button"])

        with gr.Row(elem_classes=["menu-element"]):
            self.dropdown_python_files = gr.Dropdown(
                [],
                elem_classes=["menu-element"],
                label="Dataset file",
                interactive=True
            )
            self.refresh_python_files_button = gr.Button(symbols.refresh_symbol, elem_classes=["small-menu-button"])

        self.number_epochs = gr.Number(
            value=5,
            label="Training epochs",
            elem_classes=["menu-element"],
            minimum=1,
            maximum=100,
            step=1,
            interactive=True
        )

        self.number_learning_rate = gr.Number(
            value=0.01,
            label="Learning rate",
            elem_classes=["menu-element"],
            minimum=0,
            maximum=1,
            step=0.001,
            interactive=True
        )

        self.visual_settings = VisualSettings(self.main)

        with gr.Row(elem_classes=["activate-row"]):
            self.stop_button = gr.Button("Stop")
            self.connect_button = gr.Button("Connect", elem_classes=["medium-menu-button"])
            self.disconnect_button = gr.Button("Disconnect", visible=False, elem_classes=["medium-menu-button"])
            self.train_button = gr.Button("Train", variant="primary")

    def __init__(self, main):
        self.main = main
        self.dropdown_training_models: gr.Dropdown | None = None
        self.dropdown_python_files: gr.Dropdown | None = None
        self.connect_button: gr.Button | None = None
        self.disconnect_button: gr.Button | None = None
        self.unload_button: gr.Button | None = None
        self.refresh_training_models_button: gr.Button | None = None
        self.refresh_python_files_button: gr.Button | None = None
        self.number_epochs: gr.Number | None = None
        self.number_learning_rate: gr.Number | None = None
        self.visual_settings: VisualSettings | None = None
        self.train_button: gr.Button | None = None
        self.stop_button: gr.Button | None = None

        with gr.Row():
            with gr.Column(elem_classes=["menu"]):
                self.init_components()

            with gr.Column():
                self.canvas = CanvasComponent(label="3D Model", info="Visualization of a neural network model")

        self.dropdown_training_models.change(
            self.select_train_model,
            self.dropdown_training_models,
            self.main.selected_train_model
        )

        self.refresh_python_files_button.click(self.get_dropdown_for_python_files, None, self.dropdown_python_files)
        self.refresh_training_models_button.click(
            ui_model.ModelTab.get_dropdown_for_training_models,
            None,
            self.dropdown_training_models
        )

        self.unload_button.click(
            self.unload_training_model,
            self.main.selected_train_model,
            self.dropdown_training_models
        )

        self.train_button.click(
            self.train,
            [
                self.main.selected_train_model,
                self.dropdown_python_files,
                self.number_epochs,
                self.number_learning_rate
            ],
            None
        )

        self.stop_button.click(
            self.stop,
            self.main.selected_train_model,
            None
        )

        connect_event = self.connect_button.click(
            self.connect,
            [
                self.main.selected_train_model,
                self.visual_settings.state
            ],
            [
                self.connect_button,
                self.disconnect_button,
                self.canvas
            ],
            concurrency_limit=None
        )

        self.disconnect_button.click(
            self.disconnect,
            None,
            [
                self.connect_button,
                self.disconnect_button
            ],
            cancels=[connect_event]
        )

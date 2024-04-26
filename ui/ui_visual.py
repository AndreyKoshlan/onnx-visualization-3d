import json
import gradio as gr
import numpy as np
from PIL import Image

from engine.onnx_encoder import ONNXEncoder
from ui import symbols, shared
from ui.canvas_component import CanvasComponent
from ui.ui_dropdown_menu import DropdownMenu


class VisualTab:
    @staticmethod
    def activate(path, state):
        uuid = path.split("| ")[-1]
        model = shared.model_list.get_by_uuid(uuid)

        inputs = {}
        for input_name in state:
            if DropdownMenu.get_preset(state, input_name) == "From image file":
                inputs[input_name] = model.get_image_input(
                    state[input_name]["files"][0]
                )

        node_names = [x.name for x in model.session.get_outputs()]
        outputs = model.session.run(node_names, inputs)

        payload = ONNXEncoder.get_payload(model, inputs, dict(zip(node_names, outputs)))

        return CanvasComponent(value=json.dumps(payload, cls=ONNXEncoder))

    def __init__(self, main):
        self.main = main
        self.settings = gr.State()

        with gr.Row():
            with gr.Column():
                self.dropdown_menu = DropdownMenu(main)
                with gr.Row(elem_classes=["activate-row"]):
                    self.previous_button = gr.Button(symbols.previous_symbol, elem_classes=["small-button"])
                    self.next_button = gr.Button(symbols.next_symbol, elem_classes=["small-button"])
                    self.activate_button = gr.Button("Activate", variant="primary")

            with gr.Column():
                self.canvas = CanvasComponent(label="3D Model", info="Visualization of a neural network model")

        self.activate_button.click(self.activate, [self.main.selected_model, self.dropdown_menu.state], self.canvas)
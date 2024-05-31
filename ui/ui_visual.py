import json
import gradio as gr

from engine.inputs import get_visual_tab_input_by_state
from engine.onnx_encoder import ONNXEncoder
from ui import shared
from ui.canvas_component import CanvasComponent
from ui.ui_visual_menu import VisualMenu
from ui.ui_visual_settings import VisualSettings


class VisualTab:
    @staticmethod
    def activate(path, state, settings):
        uuid = path.split("| ")[-1]
        model = shared.model_list.get_by_uuid(uuid)

        inputs = {}
        for input_name in state:
            inputs[input_name] = get_visual_tab_input_by_state(
                input_name,
                model.get_shape(input_name),
                state
            )

        node_names = [x.name for x in model.session.get_outputs()]
        outputs = model.session.run(node_names, inputs)

        payload = ONNXEncoder.get_payload(model, inputs, dict(zip(node_names, outputs)), settings)

        return CanvasComponent(value=json.dumps(payload, cls=ONNXEncoder))

    def __init__(self, main):
        self.main = main

        with gr.Row():
            with gr.Column(elem_classes=["menu"]):
                self.dropdown_menu = VisualMenu(main)
                self.visual_settings = VisualSettings(self.main)
                with gr.Row(elem_classes=["activate-row"]):
                    self.activate_button = gr.Button("Activate", variant="primary")

            with gr.Column():
                self.canvas = CanvasComponent(label="3D Model", info="Visualization of a neural network model")

        self.activate_button.click(
            self.activate,
            [self.main.selected_model, self.dropdown_menu.state, self.visual_settings.state],
            self.canvas
        )

import json
from time import sleep

import gradio as gr

from engine.onnx_encoder import ONNXEncoder
from ui import shared
from ui.canvas_component import CanvasComponent

import numpy as np


class ToolBar:
    def __init__(self, main):
        self.main = main
        with gr.Row(elem_id="toolbar"):
            self.dropdown_models = gr.Dropdown(
                shared.model_list.get_loaded_model_paths_and_uuid(),
                label="Select the model",
                elem_classes=["toolbar-dropdown"],
                interactive=True
            )

            self.unload_button = gr.Button("Unload", elem_classes=["toolbar-button"])

import gradio as gr

from engine.inputs import ImageMode
from ui.dropdown_menu.preset_dropdown_menu import PresetDropdownMenu

class DropdownComponents:
    def __init__(self):
        self.dropdown_image_type = gr.Dropdown(choices=[mode.value for mode in ImageMode],
                                               label="Select image mode", interactive=True)
        self.files = gr.File(file_count="multiple", interactive=True)
        self.textbox_csv = gr.Textbox(label="CSV", interactive=True)

class DropdownMenu(PresetDropdownMenu):
    def __init__(self, main):
        self.main = main

        presets = {
            "From image file": ["files", "dropdown_image_type"],
            "From CSV": ["textbox_csv"]
        }

        super().__init__(presets)

        self.components = DropdownComponents()
        self.components_dict = {
            **self.components_dict,
            **vars(self.components).copy()
        }

        super().init_components()

from dataclasses import asdict
import gradio as gr

from ui.data_classes.component_keys import component_keys
from ui.data_classes.image_mode import image_mode
from ui.data_classes.preset_keys import preset_keys
from ui.dropdown_menu.preset_dropdown_menu import PresetDropdownMenu

class DropdownMenu(PresetDropdownMenu):
    @staticmethod
    def create_components():
        return {
            component_keys.DROPDOWN_IMAGE_TYPE: gr.Dropdown(choices=list(asdict(image_mode).values()),
                                                            label="Select image mode", interactive=True),
            component_keys.FILES: gr.File(file_count="multiple", interactive=True),
            component_keys.TEXTBOX_CSV: gr.Textbox(label="CSV", interactive=True)
        }

    def __init__(self, main):
        self.main = main

        presets = {
            preset_keys.FROM_IMAGE_FILE: [component_keys.FILES, component_keys.DROPDOWN_IMAGE_TYPE],
            preset_keys.FROM_CSV: [component_keys.TEXTBOX_CSV]
        }

        super().__init__(presets)

        self.components = self.create_components()
        self.components_dict = {
            **self.components_dict,
            **self.components
        }

        super().init_components()

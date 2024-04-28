import gradio as gr

from ui.dropdown_menu.base_dropdown_menu import BaseDropdownMenu

class PresetDropdownMenu(BaseDropdownMenu):
    DROPDOWN_PRESET_NAME = "dropdown_preset"

    def is_component_visible(self, component_name, preset):
        if component_name == self.DROPDOWN_PRESET_NAME:
            return True
        if not (preset in self.presets):
            return False
        return component_name in self.presets[preset]

    def change_preset(self, preset):
        results = []
        for component_name in self.components_dict:
            constructor = self.components_dict[component_name].__class__
            params = {
                'visible': self.is_component_visible(component_name, preset)
            }
            component = constructor(**params)
            results.append(component)
        return results

    def init_components(self):
        super().init_components()

        for key in self.components_dict:
            if key != self.DROPDOWN_PRESET_NAME:
                self.components_dict[key].visible = False

        self.dropdown_preset.change(
            self.change_preset,
            self.dropdown_preset,
            list(self.components_dict.values())
        )

    def __init__(self, presets: dict):
        super().__init__()

        self.presets = presets

        self.dropdown_preset = gr.Dropdown(
            choices=list(presets.keys()),
            label="Select the type of data you wish to upload",
            interactive=True
        )

        self.components_dict = {
            self.DROPDOWN_PRESET_NAME: self.dropdown_preset,
            **self.components_dict
        }

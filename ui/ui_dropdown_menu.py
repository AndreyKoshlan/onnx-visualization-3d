import gradio as gr

from ui import shared


class DropdownMenu:
    @staticmethod
    def get_preset(state, input_name):
        return state[input_name]["dropdown_preset"]

    def is_component_visible(self, key, input_name, preset):
        if key == "dropdown_preset":
            return not (input_name is None)
        if not (preset in self.presets):
            return False
        return key in self.presets[preset]

    def get_value_from_state(self, key, state, input_name):
        if not (input_name in state):
            return None
        if not (key in state[input_name]):
            return None
        return state[input_name][key]

    def update_component(self, key, state, input_name, preset, use_value=True):
        constructor = self.components[key].__class__
        params = {'visible': self.is_component_visible(key, input_name, preset)}
        if use_value:
            params['value'] = self.get_value_from_state(key, state, input_name)
        return constructor(**params)

    def change_preset(self, state, input_name, preset):
        return [self.update_component(key, state, input_name, preset, key != "dropdown_preset")
                for key in self.components]

    def change_input(self, state, input_name):
        preset = self.get_value_from_state("dropdown_preset", state, input_name)
        return [self.update_component(key, state, input_name, preset)
                for key in self.components]

    def save_change(self, state, input_name, *values):
        if input_name is None:
            return state

        state[input_name] = {}
        key_list = list(self.components.keys())
        for index, value in enumerate(values):
            key = key_list[index]
            state[input_name][key] = value

        return state

    def __init__(self, main):
        self.main = main

        self.dropdown_input = gr.Dropdown(
            None,
            label="Select neural network input",
            elem_classes=["ui-dropdown"],
            interactive=True
        )

        self.presets = {
            "From image file": ["files"],
            "From CSV": ["textbox_csv"]
        }

        self.components = {
            "dropdown_preset": gr.Dropdown(choices=list(self.presets.keys()),
                                           label="Select the type of data you wish to upload", interactive=True),
            "files": gr.File(file_count="multiple", interactive=True),
            "textbox_csv": gr.Textbox(label="CSV", interactive=True),
        }

        self.state = gr.State({})

        for key in self.components:
            self.components[key].visible = False
            if isinstance(self.components[key], gr.Dropdown):
                self.components[key].elem_classes = ["ui-dropdown"]

        self.dropdown_input.change(
            self.change_input,
            [self.state, self.dropdown_input],
            list(self.components.values())
        )

        self.components["dropdown_preset"].change(
            self.change_preset,
            [self.state, self.dropdown_input, self.components["dropdown_preset"]],
            list(self.components.values())
        )

        for key in self.components:
            self.components[key].change(
                self.save_change,
                [self.state, self.dropdown_input] + list(self.components.values()),
                self.state
            )

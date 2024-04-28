import gradio as gr

class BaseDropdownMenu:
    @staticmethod
    def get_value_from_state(state, input_name, component_name):
        if not (input_name in state):
            return None
        if not (component_name in state[input_name]):
            return None
        return state[input_name][component_name]

    def change_input(self, state, input_name):
        results = []
        for component_name in self.components_dict:
            constructor = self.components_dict[component_name].__class__
            params = {
                'value': self.get_value_from_state(state, input_name, component_name)
            }
            component = constructor(**params)
            results.append(component)
        return results

    def save_change(self, state, input_name, *values):
        if input_name is None:
            return state

        state[input_name] = {}
        key_list = list(self.components_dict.keys())
        for index, value in enumerate(values):
            key = key_list[index]
            state[input_name][key] = value

        return state

    def init_components(self):
        self.dropdown_input.change(
            self.change_input,
            [self.state, self.dropdown_input],
            list(self.components_dict.values())
        )

        for key in self.components_dict:
            self.components_dict[key].change(
                self.save_change,
                [self.state, self.dropdown_input] + list(self.components_dict.values()),
                self.state
            )
            if isinstance(self.components_dict[key], gr.Dropdown):
                self.components_dict[key].elem_classes = ["ui-dropdown"]

    def __init__(self):
        self.components_dict = {}

        self.dropdown_input = gr.Dropdown(
            None,
            label="Select neural network input",
            elem_classes=["ui-dropdown"],
            interactive=True
        )

        self.state = gr.State({})

import gradio as gr

from ui.data_classes.visual_settings_component_keys import visual_settings_component_keys


class VisualSettings:
    @staticmethod
    def create_components():
        return {
            visual_settings_component_keys.MIN_WEIGHT_THRESHOLD: gr.Slider(
                value=0.4,
                label="Minimum connection threshold",
                elem_classes=["menu-element"],
                minimum=-1,
                maximum=1,
                step=0.01,
                interactive=True
            ),
            visual_settings_component_keys.NORMALIZATION_WEIGHT_MIN: gr.Slider(
                value=0,
                label="Minimum weight normalization",
                elem_classes=["menu-element"],
                minimum=-1,
                maximum=1,
                step=0.01,
                interactive=True
            ),
            visual_settings_component_keys.NORMALIZATION_WEIGHT_MAX: gr.Slider(
                value=1,
                label="Maximum weight normalization",
                elem_classes=["menu-element"],
                minimum=-1,
                maximum=1,
                step=0.01,
                interactive=True
            ),
            visual_settings_component_keys.NORMALIZATION_VALUE_MIN: gr.Slider(
                value=0,
                label="Minimum neuron value",
                elem_classes=["menu-element"],
                minimum=-1,
                maximum=1,
                step=0.01,
                interactive=True
            ),
            visual_settings_component_keys.NORMALIZATION_VALUE_MAX: gr.Slider(
                value=1,
                label="Maximum neuron value",
                elem_classes=["menu-element"],
                minimum=-1,
                maximum=1,
                step=0.01,
                interactive=True
            ),
            visual_settings_component_keys.SPACING_BETWEEN_LAYERS: gr.Slider(
                value=15,
                label="Spacing between layers",
                elem_classes=["menu-element"],
                minimum=2,
                maximum=40,
                step=1,
                interactive=True
            )
        }

    def set_state(self, *values):
        state = {}

        key_list = list(self.components_dict.keys())
        for index, value in enumerate(values):
            key = key_list[index]
            state[key] = value

        return state

    def __init__(self, main):
        self.main = main

        self.state = gr.State({})
        self.components_dict = self.create_components()

        self.main.demo.load(
            self.set_state,
            list(self.components_dict.values()),
            self.state
        )

        for key in self.components_dict:
            self.components_dict[key].change(
                self.set_state,
                list(self.components_dict.values()),
                self.state
            )

import gradio as gr
from ui import shared, ui_model, symbols


class ToolBar:
    @staticmethod
    def select_model(path):
        uuid = path.split("| ")[-1]
        model = shared.model_list.get_by_uuid(uuid)
        input_names = [x.name for x in model.session.get_inputs()]

        return [
            gr.Dropdown(value=input_names[0], choices=input_names),
            {},
            uuid
        ]

    @staticmethod
    def unload_model(path):
        uuid = path.split("| ")[-1]
        shared.model_list.delete_by_uuid(uuid)
        return ui_model.ModelTab.get_dropdown_for_loaded_models()

    def create_events(self):
        self.dropdown_models.change(
            ToolBar.select_model,
            self.dropdown_models,
            [
                self.main.vis_tab.dropdown_menu.dropdown_input,
                self.main.vis_tab.dropdown_menu.state,
                self.main.selected_model
            ]
        )

        self.unload_button.click(
            ToolBar.unload_model,
            self.dropdown_models,
            self.dropdown_models
        )

        self.refresh_button.click(
            ui_model.ModelTab.get_dropdown_for_loaded_models,
            None,
            self.dropdown_models
        )

    def __init__(self, main):
        self.main = main
        with gr.Row(elem_id="toolbar"):
            self.dropdown_models = gr.Dropdown(
                shared.model_list.get_loaded_model_paths_and_uuid(),
                label="Select the model",
                elem_classes=["toolbar-dropdown"],
                interactive=True
            )

            self.refresh_button = gr.Button(symbols.refresh_symbol, elem_classes=["toolbar-small-button"])
            self.unload_button = gr.Button("Unload", elem_classes=["toolbar-button"])

import gradio as gr
from pathlib import Path
from ui import ui_toolbar, ui_model, ui_visual, shared


class Main:
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
    def get_dropdown_for_loaded_models():
        return gr.Dropdown(shared.model_list.get_loaded_model_paths_and_uuid())

    def __init__(self):
        with open(Path(__file__).resolve().parent / "../css/main.css", "r") as f:
            css = f.read()

        with gr.Blocks(css=css) as self.demo:
            self.selected_model = gr.State()

            self.toolbar = ui_toolbar.ToolBar(self)

            with gr.Tab("Model"):
                self.model_tab = ui_model.ModelTab(self)

            with gr.Tab("Training"):
                pass

            with gr.Tab("Visualization"):
                self.vis_tab = ui_visual.VisualTab(self)

            # Load the list of loaded models
            self.demo.load(self.get_dropdown_for_loaded_models, None, self.toolbar.dropdown_models)

            # Load data into the canvas for neural network visualization
            # and store the selected model for the current session
            # This code is moved here from the toolbar since the vis tab is initialized after the toolbar
            self.toolbar.dropdown_models.change(
                self.select_model,
                self.toolbar.dropdown_models,
                [self.vis_tab.dropdown_menu.dropdown_input, self.vis_tab.dropdown_menu.state, self.selected_model]
            )

        self.demo.launch()

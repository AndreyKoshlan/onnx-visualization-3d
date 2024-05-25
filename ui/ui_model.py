import gradio as gr
from ui import shared, symbols

class ModelTab:
    @staticmethod
    def get_dropdown_for_model_paths():
        return gr.Dropdown(shared.model_list.get_model_paths())

    @staticmethod
    def get_dropdown_for_training_models():
        return gr.Dropdown(shared.model_list.get_training_model_paths_and_uuid())

    @staticmethod
    def get_dropdown_for_loaded_models():
        return gr.Dropdown(shared.model_list.get_loaded_model_paths_and_uuid())

    @staticmethod
    def load_model(path):
        shared.model_list.load(path, for_training=False)
        return ModelTab.get_dropdown_for_loaded_models()

    @staticmethod
    def add_to_training_models(path):
        shared.model_list.load(path, for_training=True)
        return ModelTab.get_dropdown_for_training_models()

    def create_events(self):
        self.refresh_button.click(self.get_dropdown_for_model_paths, None, self.dropdown_paths)

        self.load_button.click(self.load_model, self.dropdown_paths, self.main.toolbar.dropdown_models)

        self.add_to_training_button.click(
            self.add_to_training_models,
            self.main.model_tab.dropdown_paths,
            self.main.train_tab.dropdown_training_models
        )

    def __init__(self, main):
        self.main = main
        with gr.Column():
            gr.Markdown(symbols.start_message)

            with gr.Row():
                self.dropdown_paths = gr.Dropdown(
                    shared.model_list.get_model_paths(),
                    label="Select the model",
                    elem_classes=["slim-dropdown"],
                    interactive=True
                )

                self.refresh_button = gr.Button(symbols.refresh_symbol, elem_classes=["small-button"])

                self.add_to_training_button = gr.Button("Train", elem_classes=["small-button"])

                self.load_button = gr.Button("Load", elem_classes=["small-button"])

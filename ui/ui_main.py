import gradio as gr
from pathlib import Path
from ui import ui_toolbar, ui_model, ui_visual, ui_train

class Main:
    def __init__(self):
        with open(Path(__file__).resolve().parent / "../css/main.css", "r") as f:
            css = f.read()

        with gr.Blocks(css=css) as self.demo:
            self.selected_model = gr.State()
            self.selected_train_model = gr.State()

            self.toolbar = ui_toolbar.ToolBar(self)

            with gr.Tab("Model"):
                self.model_tab = ui_model.ModelTab(self)

            with gr.Tab("Training"):
                self.train_tab = ui_train.TrainTab(self)

            with gr.Tab("Visualization"):
                self.vis_tab = ui_visual.VisualTab(self)

            # Load the list of loaded models
            self.demo.load(ui_model.ModelTab.get_dropdown_for_loaded_models, None, self.toolbar.dropdown_models)
            self.demo.load(ui_model.ModelTab.get_dropdown_for_model_paths, None, self.model_tab.dropdown_paths)
            self.demo.load(ui_model.ModelTab.get_dropdown_for_training_models, None, self.train_tab.dropdown_training_models)
            self.demo.load(ui_train.TrainTab.get_dropdown_for_python_files, None, self.train_tab.dropdown_python_files)

            self.toolbar.create_events()
            self.model_tab.create_events()

        self.demo.launch()

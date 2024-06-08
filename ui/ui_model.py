import gradio as gr

from engine.models import Model
from ui import shared, symbols
from ui.constants.training_constants import loss_dict, optim_dict


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
    def add_to_training_models(path, requires_grad, frozen_params, loss, optimizer):
        def parse(line: str):
            line = line.replace(" ", "")
            if len(line) == 0:
                return []
            return line.split(",")

        requires_grad: list = parse(requires_grad)
        frozen_params: list = parse(frozen_params)
        loss = loss_dict[loss]
        optimizer = optim_dict[optimizer]

        model = shared.model_list.load(path, for_training=True)
        model.generate_artifacts(requires_grad, frozen_params, loss, optimizer)

        return ModelTab.get_dropdown_for_training_models()

    @staticmethod
    def extract_parameter_names(path):
        temp_model = Model(path)
        temp_model.load_onnx_model()
        return gr.Textbox(", ".join(temp_model.get_trainable_parameter_names()))

    def create_events(self):
        self.refresh_button.click(self.get_dropdown_for_model_paths, None, self.dropdown_paths)

        self.load_button.click(self.load_model, self.dropdown_paths, self.main.toolbar.dropdown_models)

        self.add_to_training_button.click(
            self.add_to_training_models,
            [
                self.dropdown_paths,
                self.textbox_requires_grad,
                self.textbox_frozen_params,
                self.dropdown_loss,
                self.dropdown_optimizer
            ],
            self.main.train_tab.dropdown_training_models
        )

        self.button_extract_parameter_names.click(
            self.extract_parameter_names,
            self.dropdown_paths,
            self.textbox_requires_grad
        )

    def __init__(self, main):
        self.main = main

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

        with gr.Accordion("Training artifact parameters", elem_classes=["menu-accordion"]):
            with gr.Row():
                self.textbox_requires_grad = gr.Textbox(
                    label="Requires gradient",
                    elem_classes=["menu-element"],
                    max_lines=1,
                    interactive=True
                )

                self.button_extract_parameter_names = gr.Button("Extract parameter names", elem_classes=["medium-button"])

            self.textbox_frozen_params = gr.Textbox(
                label="Frozen parameters",
                elem_classes=["menu-element"],
                max_lines=1,
                interactive=True
            )

            self.dropdown_loss = gr.Dropdown(
                list(loss_dict.keys()),
                value=list(loss_dict.keys())[0],
                label="Loss function",
                elem_classes=["menu-element"],
                interactive=True
            )

            self.dropdown_optimizer = gr.Dropdown(
                list(optim_dict.keys()),
                value=list(optim_dict.keys())[0],
                label="Optimizer",
                elem_classes=["menu-element"],
                interactive=True
            )
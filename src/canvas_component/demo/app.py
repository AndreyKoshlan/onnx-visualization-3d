import gradio as gr
from gradio_canvas_component import CanvasComponent


with gr.Blocks() as demo:
    CanvasComponent(label="Canvas", info="Canvas Info")


if __name__ == "__main__":
    demo.launch()

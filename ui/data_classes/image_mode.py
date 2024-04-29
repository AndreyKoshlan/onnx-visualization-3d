from dataclasses import dataclass

@dataclass
class ImageMode:
    LOAD_AS_RGB: str = "Load as RGB"
    LOAD_AS_RGBA: str = "Load as RGBA"
    LOAD_AS_GRAYSCALE: str = "Load as Grayscale"
    LOAD_GRAYSCALE_AS_SINGLE_CHANNEL: str = "Load Grayscale as Single-Channel"


image_mode = ImageMode()

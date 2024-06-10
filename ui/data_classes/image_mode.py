from dataclasses import dataclass

@dataclass
class ImageMode:
    LOAD_AS_RGB: str = "Load as RGB"
    LOAD_AS_RGBA: str = "Load as RGBA"
    LOAD_AS_GRAYSCALE: str = "Load as Grayscale"
    LOAD_GRAYSCALE_AS_3D_ARRAY: str = "Load Grayscale as 3D Array"
    LOAD_GRAYSCALE_AS_FLAT_ARRAY: str = "Load Grayscale as Flat Array"


image_mode = ImageMode()

import numpy as np
import io
from PIL import Image
from enum import Enum

class ImageMode(Enum):
    LOAD_AS_RGB = "Load as RGB"
    LOAD_AS_RGBA = "Load as RGBA"
    LOAD_AS_GRAYSCALE = "Load as Grayscale"
    LOAD_GRAYSCALE_AS_SINGLE_CHANNEL = "Load Grayscale as Single-Channel"

def get_image_input(file_name, mode: ImageMode):
    image = Image.open(file_name)

    if mode == ImageMode.LOAD_AS_RGB:
        image = image.convert('RGB')
    elif mode == ImageMode.LOAD_AS_RGBA:
        image = image.convert('RGBA')
    elif mode == ImageMode.LOAD_AS_GRAYSCALE:
        image = image.convert('L')
    elif mode == ImageMode.LOAD_GRAYSCALE_AS_SINGLE_CHANNEL:
        image = image.convert('L')

    image = image.resize((28, 28))

    image_np = np.array(image).astype(np.float32)
    image_np = image_np / 255.0
    image_np = np.expand_dims(image_np, axis=0)

    if mode == ImageMode.LOAD_GRAYSCALE_AS_SINGLE_CHANNEL:
        image_np = np.expand_dims(image_np, axis=-1)

    return image_np

def get_csv_input(csv_string):
    csv_file = io.StringIO(csv_string)

    csv_np = np.genfromtxt(csv_file, delimiter=',', dtype='float32')

    csv_np = np.expand_dims(csv_np, axis=0)

    return csv_np

def get_input_by_state(input_name, state):
    def get_image_type():
        value = state[input_name]["dropdown_image_type"]
        for mode in ImageMode:
            if mode.value == value:
                return mode
        return None

    preset = state[input_name]["dropdown_preset"]
    match preset:
        case "From image file":
            return get_image_input(state[input_name]["files"][0], get_image_type())
        case 'From CSV':
            return get_csv_input(state[input_name]["textbox_csv"])

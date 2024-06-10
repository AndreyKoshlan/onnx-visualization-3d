import numpy as np
import io
from PIL import Image

from ui.data_classes.visual_component_keys import visual_component_keys
from ui.data_classes.image_mode import image_mode
from ui.data_classes.visual_preset_keys import visual_preset_keys
from ui.dropdown_menu.preset_dropdown_menu import PresetDropdownMenu

def get_image_input(file_names, shape, mode):
    images_np = []

    for file_name in file_names:
        image = Image.open(file_name)

        if mode == image_mode.LOAD_AS_RGB:
            image = image.convert('RGB')
        elif mode == image_mode.LOAD_AS_RGBA:
            image = image.convert('RGBA')
        elif mode == image_mode.LOAD_AS_GRAYSCALE:
            image = image.convert('L')
        elif mode == image_mode.LOAD_GRAYSCALE_AS_3D_ARRAY:
            image = image.convert('L')
        elif mode == image_mode.LOAD_GRAYSCALE_AS_FLAT_ARRAY:
            image = image.convert('L')

        if len(shape) == 2:
            width, height = image.size
            new_width = int(np.sqrt(shape[1] * width / height))
            new_height = shape[1] // new_width
            image = image.resize((new_width, new_height))
        elif len(shape) == 3:
            image = image.resize((shape[1], shape[2]))

        image_np = np.array(image).astype(np.float32)
        image_np = image_np / 255.0

        if mode == image_mode.LOAD_GRAYSCALE_AS_3D_ARRAY:
            image_np = np.expand_dims(image_np, axis=-1)
        elif mode == image_mode.LOAD_GRAYSCALE_AS_FLAT_ARRAY:
            image_np = image_np.flatten()

        images_np.append(image_np)

    return np.stack(images_np)


def get_csv_input(csv_string):
    csv_file = io.StringIO(csv_string)

    csv_np = np.genfromtxt(csv_file, delimiter=',', dtype='float32')

    csv_np = np.expand_dims(csv_np, axis=0)

    return csv_np


def get_visual_tab_input_by_state(input_name, shape, state):
    input_state = state[input_name]

    def get_image_type():
        return input_state[visual_component_keys.DROPDOWN_IMAGE_TYPE]

    def get_image_shape():
        line = input_state[visual_component_keys.TEXTBOX_IMAGE_SHAPE].replace(" ", "")
        if len(line) == 0:
            return shape
        return [1] + list(map(int, line.split(",")))

    preset = input_state[PresetDropdownMenu.DROPDOWN_PRESET_NAME]
    match preset:
        case visual_preset_keys.FROM_IMAGE_FILE:
            return get_image_input(input_state[visual_component_keys.FILES], get_image_shape(), get_image_type())
        case visual_preset_keys.FROM_CSV:
            return get_csv_input(input_state[visual_component_keys.TEXTBOX_CSV])

import numpy as np
import io
from PIL import Image

def get_image_input(file_name):
    image = Image.open(file_name).convert('L')

    image = image.resize((28, 28))

    image_np = np.array(image).astype(np.float32)
    image_np = image_np / 255.0
    image_np = np.expand_dims(image_np, axis=0)

    return image_np

def get_csv_input(csv_string):
    csv_file = io.StringIO(csv_string)

    csv_np = np.genfromtxt(csv_file, delimiter=',', dtype='float32')

    csv_np = np.expand_dims(csv_np, axis=0)

    return csv_np

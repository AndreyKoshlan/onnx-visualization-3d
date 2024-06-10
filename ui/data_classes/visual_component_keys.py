from dataclasses import dataclass

@dataclass
class VisualComponentKeys:
    DROPDOWN_IMAGE_TYPE: str = "dropdown_image_type"
    TEXTBOX_IMAGE_SHAPE: str = "textbox_image_shape"
    FILES: str = "files"
    TEXTBOX_CSV: str = "textbox_csv"


visual_component_keys = VisualComponentKeys()

from dataclasses import dataclass

@dataclass
class VisualComponentKeys:
    DROPDOWN_IMAGE_TYPE: str = "dropdown_image_type"
    FILES: str = "files"
    TEXTBOX_CSV: str = "textbox_csv"


visual_component_keys = VisualComponentKeys()

from dataclasses import dataclass

@dataclass
class ComponentKeys:
    DROPDOWN_IMAGE_TYPE: str = "dropdown_image_type"
    FILES: str = "files"
    TEXTBOX_CSV: str = "textbox_csv"


component_keys = ComponentKeys()

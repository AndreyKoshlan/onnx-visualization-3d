from dataclasses import dataclass

@dataclass
class VisualPresetKeys:
    FROM_IMAGE_FILE: str = "From image file"
    FROM_CSV: str = "From CSV"


visual_preset_keys = VisualPresetKeys()

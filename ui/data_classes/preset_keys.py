from dataclasses import dataclass

@dataclass
class PresetKeys:
    FROM_IMAGE_FILE: str = "From image file"
    FROM_CSV: str = "From CSV"


preset_keys = PresetKeys()

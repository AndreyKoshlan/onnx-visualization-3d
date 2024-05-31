from dataclasses import dataclass

@dataclass
class VisualSettingsComponentKeys:
    MIN_WEIGHT_THRESHOLD: str = "min_weight_threshold"
    NORMALIZATION_WEIGHT_MIN: str = "normalization_weight_min"
    NORMALIZATION_WEIGHT_MAX: str = "normalization_weight_max"
    NORMALIZATION_VALUE_MIN: str = "normalization_value_min"
    NORMALIZATION_VALUE_MAX: str = "normalization_value_max"
    SPACING_BETWEEN_LAYERS: str = "spacing_between_layers"


visual_settings_component_keys = VisualSettingsComponentKeys()

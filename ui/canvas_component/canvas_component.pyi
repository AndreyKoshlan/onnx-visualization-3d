from __future__ import annotations
from typing import Any, Callable, Literal
from gradio.components.base import Component

from gradio.events import Dependency

class CanvasComponent(Component):
    EVENTS = []

    def __init__(
        self,
        *,
        value: Any = None,
        label: str | None = None,
        info: str | None = None,
        show_label: bool | None = None,
        container: bool = True,
        scale: int | None = None,
        min_width: int | None = None,
        interactive: bool = True,
        visible: bool = True,
        elem_id: str | None = None,
        elem_classes: list[str] | str | None = None,
        render: bool = True,
        every: float | None = None,
    ):
        super().__init__(
            value=value,
            label=label,
            info=info,
            show_label=show_label,
            container=container,
            scale=scale,
            min_width=min_width,
            interactive=interactive,
            visible=visible,
            elem_id=elem_id,
            elem_classes=elem_classes,
            render=render,
            every=every,
        )

    def preprocess(self, payload):
        return payload

    def postprocess(self, value):
        return value

    def example_inputs(self):
        return None

    def api_info(self):
        return {}
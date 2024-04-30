call build.bat

set PYTHONUNBUFFERED=1
set SOURCE_DIR=.\src\canvas_component\backend\gradio_canvas_component
set DEST_DIR=.\ui\canvas_component

xcopy /E /I /Y %SOURCE_DIR% %DEST_DIR%
launch.py
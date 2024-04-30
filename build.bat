set SERVER_PATH=%CD%
set VENV_PATH=%SERVER_PATH%\venv
set GRADIO_PATH=%VENV_PATH%\Lib\site-packages\gradio

set NODE_PATH=%GRADIO_PATH%\node\dev\files\index.js
set COMPONENT_DIR=%SERVER_PATH%\src\canvas_component
set ROOT_DIR=%GRADIO_PATH%\templates\frontend
set PYTHON_PATH=%VENV_PATH%\Scripts\python.exe

set PYTHONPATH=%COMPONENT_DIR%;%COMPONENT_DIR%\backend

node %NODE_PATH% --component-directory %COMPONENT_DIR% --root %ROOT_DIR% --mode build --python-path %PYTHON_PATH%
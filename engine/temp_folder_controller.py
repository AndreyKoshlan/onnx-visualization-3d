import os
import uuid

from pathlib import Path

class TempFolderController:
    def __init__(self, path):
        self.path = Path(path)
        self.folders = set()

    def _generate_unique_folder_name(self):
        while True:
            folder_name = str(uuid.uuid4())
            folder_path = self.path / folder_name
            if folder_path.exists():
                continue
            return folder_name

    def create_temp_folder(self) -> Path:
        folder_name = self._generate_unique_folder_name()
        folder_path = self.path / folder_name
        os.makedirs(folder_path)
        self.folders.add(folder_path)
        return folder_path

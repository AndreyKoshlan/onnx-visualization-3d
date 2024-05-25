import os
import importlib.util

from torch.utils.data import DataLoader

class DatasetContainer:
    def __init__(self, example, train_loader: DataLoader, test_loader: DataLoader):
        self.example = example
        self.train_loader = train_loader
        self.test_loader = test_loader

class ScriptedDataset:
    def __init__(self, path):
        self.path = path
        self.dataset_paths = []

    @staticmethod
    def load(path):
        base_name = os.path.basename(path)
        module_name, _ = os.path.splitext(base_name)
        module_name = "dataset_" + module_name

        spec = importlib.util.spec_from_file_location(module_name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        example = module.get_example()
        train_loader, test_loader = module.get_dataloaders()

        return DatasetContainer(example, train_loader, test_loader)

    def get_paths(self):
        self.refresh()
        return self.dataset_paths[:]

    def refresh(self):
        self.dataset_paths = []

        if not os.path.exists(self.path):
            return

        for root, _, files in os.walk(self.path):
            for file in files:
                if file.endswith('.py'):
                    full_path = os.path.join(root, file)
                    normalized_path = os.path.normpath(full_path)
                    self.dataset_paths.append(normalized_path)

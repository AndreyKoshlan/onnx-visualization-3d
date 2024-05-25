import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

transform = transforms.Compose([
    transforms.ToTensor(),
    lambda x: x.squeeze(0)
])

train_data = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
test_data = datasets.MNIST(root='./data', train=False, download=True, transform=transform)

def get_dataloaders(batch_size=24, shuffle_train=True, shuffle_test=False):
    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=shuffle_train)
    test_loader = DataLoader(test_data, batch_size=batch_size, shuffle=shuffle_test)
    return train_loader, test_loader

def get_example():
    example, label = test_data[0]
    example = example.unsqueeze(0)
    label = torch.tensor([label])
    return example, label

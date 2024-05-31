from onnxruntime.training.artifacts import LossType, OptimType

loss_dict = {
    "Mean Squared Error": LossType.MSELoss,
    "Cross Entropy Loss": LossType.CrossEntropyLoss,
    "Binary Cross Entropy with Logits": LossType.BCEWithLogitsLoss,
    "L1 Loss": LossType.L1Loss
}

optim_dict = {
    "AdamW": OptimType.AdamW
}

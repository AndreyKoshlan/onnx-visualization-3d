import {ConnectionType} from "../types/connection/connection-type";

export const connectionTypeMap: Record<string, ConnectionType> = {
    "MatMul": ConnectionType.FullyConnected,
    "Gemm": ConnectionType.FullyConnectedGemm,
    "Reshape": ConnectionType.OneToOne,
    "Softmax": ConnectionType.OneToOne,
    "Relu": ConnectionType.OneToOne,
    "Add": ConnectionType.OneToOne,
    "Concat": ConnectionType.Concat
};
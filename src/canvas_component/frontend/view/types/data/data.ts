import {Settings} from "./settings";

export interface Dim {
    denotation: string;
    dim_param: string;
    dim_value: number;
}

export interface TensorType {
    elem_type: number;
    shape: {
        dim: Dim[];
    };
}

export interface TypeDescriptor {
    map_type?: any;
    opaque_type?: any;
    optional_type?: any;
    sequence_type?: any;
    sparse_tensor_type?: any;
    tensor_type: TensorType;
}

export interface InputOutputDescriptor {
    name: string;
    type: TypeDescriptor;
}

export interface NodeType {
  inputs: string[];
  outputs: string[];
  operation_type: string;
}

export interface NodesType {
  [key: string]: NodeType;
}


export interface Graph {
    input: { [key: string]: InputOutputDescriptor };
    output: { [key: string]: InputOutputDescriptor };
    initializers: any;
    nodes: NodesType;
}

export interface Args {
    inputs: { [key: string]: InputOutputDescriptor };
    outputs: { [key: string]: InputOutputDescriptor };
}

export interface Data {
    graph: Graph;
    args: Args;
    inputs: { [key: string]: any[] };
    outputs: { [key: string]: any[] };
    settings: Settings;
}
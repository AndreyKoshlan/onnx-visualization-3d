import {Data, NodesType, NodeType} from "../types/data/data";
import {MappingType} from "../types/mapping-type";

export function createNodeMapping(nodes: NodesType, mappingType: MappingType): Record<string, string[]> {
    const nodeMapping: Record<string, string[]> = {};

    for (const nodeName in nodes) {
        if (nodes.hasOwnProperty(nodeName)) {
            const nodeDetails = nodes[nodeName];
            nodeDetails[mappingType].forEach(connection => {
                if (!nodeMapping[connection]) {
                    nodeMapping[connection] = [];
                }
                nodeMapping[connection].push(nodeName);
            });
        }
    }

    return nodeMapping;
}

export function* iterateNodeLayers(node: NodeType, layers?: { [key: string]: any }) {
    const filteredInputs = layers ? node.inputs.filter(inputName => inputName in layers) : node.inputs;
    const filteredOutputs = layers ? node.outputs.filter(outputName => outputName in layers) : node.outputs;

    if (filteredInputs.length > 0 && filteredOutputs.length > 0) {
        yield { inputs: filteredInputs, outputs: filteredOutputs };
    }
}

export function* iterateAllNodesLayers(data: Data, layers?: { [key: string]: any }) {
    for (const nodeName of Object.keys(data.graph.nodes)) {
        const node = data.graph.nodes[nodeName];
        for (const layerInfo of iterateNodeLayers(node, layers)) {
            yield { ...layerInfo, nodeName };
        }
    }
}

export function* iterateNodeIO(node: NodeType, layers?: { [key: string]: any} ) {
    for (const inputName of node.inputs) {
        if (layers && !(inputName in layers)) continue;

        for (const outputName of node.outputs) {
            if (layers && !(outputName in layers)) continue;
            yield { inputName, outputName };
        }
    }
}

export function* iterateAllNodesIO(data: Data, layers?: { [key: string]: any}) {
    for (const nodeName of Object.keys(data.graph.nodes)) {
        const node = data.graph.nodes[nodeName];
        for (const connection of iterateNodeIO(node, layers)) {
            yield { ...connection, nodeName };
        }
    }
}

export function* iterateNodeBFS(data: Data) {
    const inputMapping = createNodeMapping(data.graph.nodes, MappingType.Inputs);
    const outputMapping = createNodeMapping(data.graph.nodes, MappingType.Outputs);

    const queue: string[] = [];
    queue.push(...Object.keys(data.inputs));

    let index = 0;
    while (index < queue.length) {
        const layerName = queue[index];
        const currentNodes = outputMapping[layerName];
        const nextNodes = inputMapping[layerName];

        if (nextNodes !== undefined) {
            for (const nodeName of nextNodes) {
                const outputs = data.graph.nodes[nodeName].outputs;
                queue.push(...outputs);
            }
        }

        if (currentNodes !== undefined) {
            for (const nodeName of currentNodes) {
                yield { index, nodeName, layerName };
            }
        }

        index++;
    }
}

export function getInitializerValues(data: Data, node: NodeType): any[] {
    const inputs = node.inputs;
    const initializerNames = inputs.filter(input => data.graph.initializers.hasOwnProperty(input));
    return initializerNames.map(name => data.graph.initializers[name].array);
}
import {Layer} from "./layer";
import {Data} from "./types";

type NestedArray = any[];

export function getArrayShape(arr: any[]): number[] {
    if (!Array.isArray(arr)) {
        throw new Error('Provided argument is not an array');
    }

    let shape: number[] = [];

    let currentLevel = arr;
    while (Array.isArray(currentLevel) && currentLevel.length > 0) {
        shape.push(currentLevel.length);
        currentLevel = currentLevel[0];
    }

    return shape;
}

export function getDepth(arr: any[]): number {
    return getArrayShape(arr).length;
}

export function getValueCount(arr: any[]): number {
    return getArrayShape(arr).reduce((acc, val) => acc * val, 1);
}

export function getLayer3D(data: NestedArray, batch: number): number[][][] {
    const depthWithBatch = getDepth(data);
    let dataBatch = data;

    if (depthWithBatch > 1) {
        dataBatch = (data as NestedArray[])[batch];
    }

    const depth = depthWithBatch - 1;

    if (depth === 1) {
        const width = Math.floor(Math.sqrt(dataBatch.length));
        const height = Math.ceil(dataBatch.length / width);
        const result: number[][][] = [[]];
        for (let i = 0; i < height; i++) {
            result[0].push((dataBatch as number[]).slice(i * width, (i + 1) * width));
        }
        return result;
    } else if (depth === 2) {
        return [dataBatch as number[][]];
    } else if (depth >= 3) {
        return dataBatch as number[][][];
    }

    return [[]];
}

export function getLayerCenterY(layerName: string, inputs: string[], layers: Record<string, Layer>, layersY: Record<string, number>): number {
    const currentLayer = layers[layerName]
    if (currentLayer === undefined || inputs.length === 0) {
        return 0;
    }

    let totalY = 0;
    let count = 0;

    inputs.forEach((inputName) => {
        const inputLayer = layers[inputName];
        if (inputLayer && inputName in layersY) {
            totalY += layersY[inputName] + (inputLayer.getSize()[1] / 2);
            count++;
        }
    });

    if (count < 1) {
        return 0;
    }

    totalY /= count;

    return totalY - (currentLayer.getSize()[1] / 2);
}

export function getLayersY(
    data: Data,
    inputMapping: Record<string, string[]>,
    outputMapping: Record<string, string[]>,
    layers: Record<string, Layer>): Record<string, number>
{
    const layersY: Record<string, number> = {};
    const queue: string[] = [];

    queue.push(...Object.keys(data.inputs));

    let index = 0;
    while (index < queue.length) {
        const layerName = queue[index];
        const currentNodes = outputMapping[layerName];
        const nextNodes = inputMapping[layerName];

        if (nextNodes !== undefined) {
            nextNodes.forEach((nodeName) => {
                const outputs = data.graph.nodes[nodeName].outputs;
                queue.push(...outputs);
            });
        }

        const inputLayers: string[] = [];

        if (currentNodes !== undefined) {
            currentNodes.forEach((nodeName) => {
                inputLayers.push(...data.graph.nodes[nodeName].inputs);
            });
        }

        layersY[layerName] = getLayerCenterY(layerName, inputLayers, layers, layersY);

        index++;
    }

    return layersY;
}
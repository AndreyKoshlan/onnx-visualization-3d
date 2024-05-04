import {Layer} from "./layer";
import {Data} from "./types";

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

export function getTotalValuesCount(arr: any[]): number {
    return arr.reduce((total, current) => {
        if (Array.isArray(current)) {
            return total + getTotalValuesCount(current);
        } else {
            return total + 1;
        }
    }, 0);
}

export function reshape1DTo3D(data: any[]): number[][][] {
    const shape = getArrayShape(data);
    const width = Math.ceil(Math.sqrt(shape[0]));
    let x = 0;
    let yArray: number[][] = [];
    let xArray: number[] = [];
    data.forEach(value => {
        xArray.push(value);
        if (x >= width - 1) {
            yArray.push(xArray);
            xArray = [];
            x = 0;
        } else {
            x++;
        }
    });
    if (xArray.length > 0)
        yArray.push(xArray);
    return [yArray];
}

export function reshapeMDTo3D(data :any[], xIndex: number, yIndex: number): number[][][] {
    const shape = getArrayShape(data);
    const shapeIndex = new Array(shape.length).fill(0);

    const sliceCount = shape.filter((_, idx) => idx !== xIndex && idx !== yIndex).reduce((acc, val) => acc * val, 1);
    const result = Array.from({ length: sliceCount }, () =>
        Array.from({ length: shape[yIndex] }, () => Array(shape[xIndex]).fill(0)));


    function createIndexOrder(xIndex: number, yIndex: number, length: number): number[] {
        const order = [];

        for (let i = length - 1; i >= 0; i--) {
            if (i !== xIndex && i !== yIndex) {
                order.push(i);
            }
        }

        order.unshift(xIndex, yIndex);
        return order;
    }

    function getElementByIndex(data: any[], indices: number[]): any {
        return indices.reduce((acc, index) => acc[index], data);
    }

    const indexOrder = createIndexOrder(xIndex, yIndex, shape.length);

    let sliceIndex = 0;

    while (true) {
        const value = getElementByIndex(data, shapeIndex);
        result[sliceIndex][shapeIndex[yIndex]][shapeIndex[xIndex]] = value;

        let i = 0;
        while (i < shape.length) {
            const currentIndex = indexOrder[i];
            shapeIndex[currentIndex]++;
            if (shapeIndex[currentIndex] < shape[currentIndex]) {
                if (currentIndex !== xIndex && currentIndex !== yIndex) {
                    sliceIndex++;
                }
                break;
            }
            shapeIndex[currentIndex] = 0;
            i++;
        }
        if (i === shape.length) {
            break;
        }
    }

    return result;
}

export function reshapeTo3D(data: any[], xIndex: number, yIndex: number): number[][][] {
    const depth = getDepth(data);

    if (depth === 1) {
        return reshape1DTo3D(data);
    } else if (depth >= 2) {
        return reshapeMDTo3D(data, xIndex, yIndex);
    }

    return [[[]]];
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
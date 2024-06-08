import {iterateNodeBFS} from "../graph/graph";
import {Data} from "../types/data/data";
import {Layer} from "../layer";

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
            totalY += layersY[inputName] - (inputLayer.getSize()[1] / 2);
            count++;
        }
    });

    if (count < 1) {
        return 0;
    }

    totalY /= count;

    return totalY + (currentLayer.getSize()[1] / 2);
}

export function getLayersY(
    data: Data,
    layers: Record<string, Layer>): Record<string, number>
{
    const layersY: Record<string, number> = {};

    for (const element of iterateNodeBFS(data)) {
        const { nodeName, layerName } = element;
        const inputLayers = data.graph.nodes[nodeName].inputs;

        layersY[layerName] = getLayerCenterY(layerName, inputLayers, layers, layersY);
    }

    return layersY;
}
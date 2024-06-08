import {Layer} from "../../layer";
import {ConnectionStrategy} from "./connection-strategy";
import {ConnectionGeneratorItem} from "../../types/connection/connection-generator-item";

export class ConcatStrategy extends ConnectionStrategy {
    inputLayers: Layer[];
    outputLayer: Layer;

    *iterator(): IterableIterator<ConnectionGeneratorItem> {
        let index = 0;
        for (let inputIndex = 0; inputIndex < this.inputLayers.length; inputIndex++) {
            const inputLayer = this.inputLayers[inputIndex];
            const inputIterator = inputLayer.iterate();
            let inputElement = inputIterator.next();

            while (!inputElement.done) {
                const outputIterator = this.outputLayer.iterate();
                let outputElement = outputIterator.next();

                while (!outputElement.done) {
                    if (index === outputElement.value.index) {
                        yield {
                            value: inputElement.value.value,
                            input: inputElement.value,
                            output: outputElement.value,
                            index
                        };
                        index++;
                        break;
                    }
                    outputElement = outputIterator.next();
                }

                inputElement = inputIterator.next();
            }
        }
    }

    getConnectionCount(): number {
        return this.outputLayer.getValuesCount();
    }

    constructor(inputLayers: Layer[], outputLayer: Layer) {
        super();
        this.inputLayers = inputLayers;
        this.outputLayer = outputLayer;

        const totalInputDim = this.inputLayers.reduce((acc, layer) => acc + layer.getValuesCountInBatch(), 0);
        const outputDim = this.outputLayer.getValuesCountInBatch();
        if (totalInputDim !== outputDim) {
            throw new Error("The total number of neurons in all input layers must match the number of neurons in the output layer for concat connection strategy.");
        }
    }
}
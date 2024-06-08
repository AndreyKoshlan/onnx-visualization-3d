import {Layer} from "../../layer";
import {ConnectionStrategy} from "./connection-strategy";
import {ConnectionGeneratorItem} from "../../types/connection/connection-generator-item";

export class OneToOneStrategy extends ConnectionStrategy {
    inputLayer: Layer;
    outputLayer: Layer;

    *iterator(): IterableIterator<ConnectionGeneratorItem> {
        let index = 0;
        const inputIterator = this.inputLayer.iterate();
        const outputIterator = this.outputLayer.iterate();
        let inputElement = inputIterator.next();
        let outputElement = outputIterator.next();

        while (!inputElement.done && !outputElement.done) {
            const value = Math.abs(outputElement.value.value - inputElement.value.value);
            yield {
                value: value,
                input: inputElement.value,
                output: outputElement.value,
                index: index
            };
            index++;
            inputElement = inputIterator.next();
            outputElement = outputIterator.next();
        }
    }

    getConnectionCount(): number {
        return this.inputLayer.getValuesCount();
    }

    constructor(inputLayer: Layer, outputLayer: Layer) {
        super();
        this.inputLayer = inputLayer;
        this.outputLayer = outputLayer;

        const inputDim = this.inputLayer.getValuesCountInBatch();
        const outputDim = this.outputLayer.getValuesCountInBatch();
        if (inputDim !== outputDim) {
            throw new Error("Input and output layers must have the same number of neurons for one-to-one connection strategy.");
        }
    }
}
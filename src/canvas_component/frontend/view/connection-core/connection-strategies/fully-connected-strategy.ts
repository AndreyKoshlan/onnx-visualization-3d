import {Layer} from "../../layer";
import {ConnectionStrategy} from "./connection-strategy";
import {ConnectionGeneratorItem} from "../../types/connection/connection-generator-item";

export class FullyConnectedStrategy extends ConnectionStrategy {
    inputLayer: Layer;
    outputLayer: Layer;
    matrix: any[];

    *iterator(): IterableIterator<ConnectionGeneratorItem> {
        let index = 0;
        for (const inputElement of this.inputLayer.iterate()) {
            for (const outputElement of this.outputLayer.iterate()) {
                if (inputElement.indices[0] !== outputElement.indices[0]) {
                    continue;
                }
                const value = this.matrix[inputElement.indices[1] * inputElement.indices[2]][outputElement.indices[1] * outputElement.indices[2]];
                yield {
                    value: value,
                    input: inputElement,
                    output: outputElement,
                    index: index
                };
                index++;
            }
        }
    }

    getConnectionCount(): number {
        return this.inputLayer.getValuesCountInBatch() *
            this.outputLayer.getValuesCountInBatch() *
            this.inputLayer.getBatchCount();
    }

    constructor(inputLayer: Layer, outputLayer: Layer, matrix: any[], inputFirst: boolean = true) {
        super();

        if (!inputFirst) {
            [inputLayer, outputLayer] = [outputLayer, inputLayer];
        }

        this.inputLayer = inputLayer;
        this.outputLayer = outputLayer;
        this.matrix = matrix;

        const inputDim = this.inputLayer.getValuesCountInBatch();
        const outputDim = this.outputLayer.getValuesCountInBatch();
        if (!this.matrix[0] || this.matrix.length !== inputDim || this.matrix[0].length !== outputDim) {
            throw new Error("Matrix shape does not match the dimensions of the input and output layers.");
        }
    }
}
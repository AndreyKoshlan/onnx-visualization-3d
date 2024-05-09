import {Layer} from "./layer";
import BABYLON from "babylonjs";

export enum ConnectionType {
    FullyConnected = "FULLY_CONNECTED",
    OneToOne = "ONE_TO_ONE",
    None = "NONE"
}

export class Connection {
    CUBE_SIZE = 1;
    CUBE_SCALE = 0.07;

    scene: BABYLON.Scene;
    cube: BABYLON.Mesh;
    type: ConnectionType;

    inputLayer: Layer;
    outputLayer: Layer;

    array: any[];

    *iterateFullyConnected() {
        const inputDim = this.inputLayer.getValuesCountInBatch();
        const outputDim = this.outputLayer.getValuesCountInBatch()
        console.log(inputDim, outputDim, this.array.length, this.array[0].length);
        const isShapeMatch = (this.array[0] !== undefined) && (this.array.length == inputDim) && (this.array[0].length == outputDim)

        let index = 0;
        for (const inputElement of this.inputLayer.iterate()) {
            for (const outputElement of this.outputLayer.iterate()) {
                yield {
                    value: isShapeMatch ?
                        this.array[inputElement.indices[1] * inputElement.indices[2]][outputElement.indices[1]*outputElement.indices[2]]
                        : 0.5,
                    input: inputElement,
                    output: outputElement,
                    index: index
                }
                index++;
            }
        }
    }

    *iterateOneToOne() {
        let index = 0;
        const outputIterator = this.outputLayer.iterate();
        for (const inputElement of this.inputLayer.iterate()) {
            const outputElement = outputIterator.next().value;
            yield {
                value: 1,
                input: inputElement,
                output: outputElement!!,
                index: index
            }
            index++;
        }
    }

    getIterator(type: ConnectionType) {
        switch (type) {
            case ConnectionType.FullyConnected:
                return this.iterateFullyConnected.bind(this);
            case ConnectionType.OneToOne:
                return this.iterateOneToOne.bind(this);
            case ConnectionType.None:
                return undefined;
            default:
                return undefined;
        }
    }

    getConnectionCount(type: ConnectionType): number {
        switch (type) {
            case ConnectionType.FullyConnected:
                return this.inputLayer.getValuesCount() * this.outputLayer.getValuesCount();
            case ConnectionType.OneToOne:
                if (this.inputLayer.getValuesCount() !== this.outputLayer.getValuesCount())
                    throw new Error("The shape of input and output layers must match for one-to-one connections");
                return this.inputLayer.getValuesCount();
            case ConnectionType.None:
                return 0;
            default:
                throw new Error("Invalid connection type");
        }
    }

    getMatrix(pos1: BABYLON.Vector3, pos2: BABYLON.Vector3): BABYLON.Matrix {
        const distance = BABYLON.Vector3.Distance(pos1, pos2);
        const direction = pos2.subtract(pos1).normalize();
        const axis = BABYLON.Vector3.Right().cross(direction).normalize();
        const angle = Math.acos(BABYLON.Vector3.Right().normalize().dot(direction));

        const scale = new BABYLON.Vector3(distance, this.CUBE_SCALE, this.CUBE_SCALE);
        const translation = pos1.add(pos2).scale(0.5);
        const rotation = BABYLON.Quaternion.RotationAxis(axis, angle);

        return BABYLON.Matrix.Compose(scale, rotation, translation);
    }

    visualize() {
        const iterator = this.getIterator(this.type);
        if (iterator === undefined)
            return;

        // TODO: Implement a dynamic array mechanism
        // The actual number of displayed instances may be less due to the intensity filter
        let numInstances = this.getConnectionCount(this.type);
        const matricesBuffer = new Float32Array(16 * numInstances);
        const colorBuffer = new Float32Array(4 * numInstances);

        let bufferIndex = 0;
        for (const element of iterator()) {
            const {input, output, value} = element;

            const pos1 = new BABYLON.Vector3(...input.position);
            const pos2 = new BABYLON.Vector3(...output.position);

            const matrix = this.getMatrix(pos1, pos2);

            let intensity = value;
            intensity = Math.max(0, Math.min(1, intensity));

            if (intensity >= 0.1) {
                matrix.copyToArray(matricesBuffer, bufferIndex * 16);
                colorBuffer.set([intensity, intensity, intensity, 1], bufferIndex * 4);
                bufferIndex++;
            }
        }

        this.cube.thinInstanceSetBuffer("matrix", matricesBuffer, 16);
        this.cube.thinInstanceSetBuffer("color", colorBuffer, 4);
        this.cube.thinInstanceCount = bufferIndex;
    }

    static getType(name: string) {
        const fullyConnected = ["MatMul", "Softmax"];
        const oneToOne = ["Reshape", "Relu", "Add"];
        if (fullyConnected.includes(name)) {
            return ConnectionType.FullyConnected;
        }
        if (oneToOne.includes(name)) {
            return ConnectionType.OneToOne;
        }
        return ConnectionType.None;
    }


    constructor(scene: BABYLON.Scene, array: any[], inputLayer: Layer, outputLayer: Layer, type: ConnectionType) {
        this.scene = scene;
        this.cube = BABYLON.MeshBuilder.CreateBox("connection", { size: this.CUBE_SIZE }, scene);

        this.array = array;
        this.inputLayer = inputLayer;
        this.outputLayer = outputLayer;
        this.type = type;
    }
}
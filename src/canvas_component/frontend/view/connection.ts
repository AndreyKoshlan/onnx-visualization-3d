import BABYLON from "babylonjs";

import {Layer} from "./layer";
import {normalize} from "./utils";
import {getStrategy} from "./connection-core/strategy-factory";
import {ConnectionStrategy} from "./connection-core/connection-strategies/connection-strategy";
import {Settings} from "./types/data/settings";
import {ConnectionType} from "./types/connection/connection-type";

export class Connection {
    CUBE_SIZE = 1;
    CUBE_SCALE = 0.07;
    MIN_COLOR_VALUE = 0.5;

    scene: BABYLON.Scene;
    cube: BABYLON.Mesh;
    type: ConnectionType;
    strategy?: ConnectionStrategy;
    settings: Settings;

    inputLayers: Layer[];
    outputLayers: Layer[];

    initializers: any[];

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
        if (this.strategy === undefined)
            return;

        // TODO: Implement a dynamic array mechanism
        // The actual number of displayed instances may be less due to the intensity filter
        let numInstances = this.strategy.getConnectionCount();
        const matricesBuffer = new Float32Array(16 * numInstances);
        const colorBuffer = new Float32Array(4 * numInstances);

        let bufferIndex = 0;
        for (const element of this.strategy.iterator()) {
            const {input, output, value} = element;

            const pos1 = new BABYLON.Vector3(...input.position);
            const pos2 = new BABYLON.Vector3(...output.position);

            const matrix = this.getMatrix(pos1, pos2);

            const intensity = normalize(
                value,
                this.settings.normalization_value_min,
                this.settings.normalization_value_max,
                this.MIN_COLOR_VALUE
            )

            if (this.type !== ConnectionType.FullyConnected || value >= this.settings.min_weight_threshold) {
                matrix.copyToArray(matricesBuffer, bufferIndex * 16);
                colorBuffer.set([intensity, intensity, intensity, 1], bufferIndex * 4);
                bufferIndex++;
            }
        }

        this.cube.thinInstanceSetBuffer("matrix", matricesBuffer, 16);
        this.cube.thinInstanceSetBuffer("color", colorBuffer, 4);
        this.cube.thinInstanceCount = bufferIndex;
    }

    constructor(scene: BABYLON.Scene, inputLayers: Layer[], outputLayers: Layer[], initializers: any[], type: ConnectionType, settings: Settings) {
        this.scene = scene;
        this.settings = settings
        this.cube = BABYLON.MeshBuilder.CreateBox("connection", { size: this.CUBE_SIZE }, scene);

        this.initializers = initializers;
        this.inputLayers = inputLayers;
        this.outputLayers = outputLayers;
        this.type = type;

        this.strategy = getStrategy(this.type, this.inputLayers, this.outputLayers, this.initializers);
    }
}
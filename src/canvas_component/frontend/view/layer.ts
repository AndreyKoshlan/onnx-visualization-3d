import * as BABYLON from 'babylonjs';
import {getArrayShape, getLayer3D, getValueCount} from "./layer-utils";

export class Layer {
    scene: BABYLON.Scene;
    cube: BABYLON.Mesh;
    position: BABYLON.Vector3;
    processed_array: number[][][];
    shape: number[];

    getPosition(offset: BABYLON.Vector3, x: number, y: number, z: number): [number, number, number] {
        return [
            offset.x + (x * 2),
            offset.y - (y * 2),
            offset.z + (z * 2)
        ];
    }

    getSize(): [number, number, number] {
        return this.getPosition(
            new BABYLON.Vector3(0, 0, 0),
            this.shape[2],
            this.shape[1],
            this.shape[0]
        );
    }

    visualize() {
        const shape = this.shape;

        let numInstances = getValueCount(this.processed_array);
        const matricesBuffer = new Float32Array(16 * numInstances);
        const colorBuffer = new Float32Array(4 * numInstances);

        let index = 0;
        for (let extra = 0; extra < shape[0]; extra++) {
            for (let y = 0; y < shape[1]; y++) {
                for (let x = 0; x < shape[2]; x++) {
                    const [x_pos, y_pos, z_pos] = this.getPosition(this.position, x, y, extra);

                    const matrix = BABYLON.Matrix.Translation(x_pos, y_pos, z_pos);
                    matrix.copyToArray(matricesBuffer, index * 16);

                    let intensity = this.processed_array[extra][y][x];
                    intensity = Math.max(0, Math.min(1, intensity));
                    colorBuffer.set([intensity, intensity, intensity, 1], index * 4);

                    index += 1
                }
            }
        }

        this.cube.thinInstanceSetBuffer("matrix", matricesBuffer, 16);
        this.cube.thinInstanceSetBuffer("color", colorBuffer, 4);
        this.cube.thinInstanceCount = numInstances;
    }

    constructor(scene: BABYLON.Scene, array: any[], batch: number = 0) {
        this.scene = scene;
        this.position = new BABYLON.Vector3(0, 0, 0);
        this.cube = BABYLON.MeshBuilder.CreateBox("value", { size: 1 }, scene);

        this.processed_array = getLayer3D(array, batch);
        this.shape = getArrayShape(this.processed_array);
    }
}
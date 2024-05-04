import * as BABYLON from 'babylonjs';
import {getArrayShape, getDepth, getTotalValuesCount, reshapeTo3D} from "./layer-utils";

export class Layer {
    CUBE_SIZE = 1;
    CUBE_OFFSET = 2;
    SLICE_OFFSET = 4;

    scene: BABYLON.Scene;
    cube: BABYLON.Mesh;
    position: BABYLON.Vector3;

    reshapedArray: number[][][];
    shape: number[];

    getPosition(offset: BABYLON.Vector3, sliceIndex: number, y: number, x: number): [number, number, number] {
        let sliceWidth = this.shape[2] * this.CUBE_OFFSET + this.SLICE_OFFSET;
        let sliceHeight = this.shape[1] * this.CUBE_OFFSET + this.SLICE_OFFSET;
        let totalSlices = this.shape[0];

        let slicesPerRow = Math.ceil(Math.sqrt(totalSlices));

        let row = Math.floor(sliceIndex / slicesPerRow);
        let column = sliceIndex % slicesPerRow;

        let xOffset = offset.x + (x * this.CUBE_OFFSET) + (column * sliceWidth);
        let yOffset = offset.y - (y * this.CUBE_OFFSET) - (row * sliceHeight);

        return [
            xOffset,
            yOffset,
            offset.z
        ];
    }

    getSize(): [number, number, number] {
        return this.getPosition(
            new BABYLON.Vector3(0, 0, 0),
            this.shape[0] - 1,
            this.shape[1] - 1,
            this.shape[2] - 1
        );
    }

    visualize() {
        const reshapedArray = this.reshapedArray;

        let numInstances = getTotalValuesCount(this.reshapedArray);
        const matricesBuffer = new Float32Array(16 * numInstances);
        const colorBuffer = new Float32Array(4 * numInstances);

        let index = 0;
        for (let sliceIndex = 0; sliceIndex < reshapedArray.length; sliceIndex++) {
            for (let y = 0; y < reshapedArray[sliceIndex].length; y++) {
                for (let x = 0; x < reshapedArray[sliceIndex][y].length; x++) {
                    const [x_pos, y_pos, z_pos] = this.getPosition(this.position, sliceIndex, y, x);

                    const matrix = BABYLON.Matrix.Translation(x_pos, y_pos, z_pos);
                    matrix.copyToArray(matricesBuffer, index * 16);

                    let intensity = this.reshapedArray[sliceIndex][y][x];
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

    private getReshapedArray(array: any[]): number[][][] {
        let result: number[][][] = [];

        const depthBatch = getDepth(array) - 1;
        for (let batchIndex = 0; batchIndex < array.length; batchIndex++) {
            let reshapedBatch: number[][][] = [[[]]];
            if (depthBatch <= 2) {
                reshapedBatch = reshapeTo3D(array[batchIndex], 1, 0);
            } else {
                reshapedBatch = reshapeTo3D(array[batchIndex], depthBatch - 1, depthBatch - 2);
            }
            result = [...result, ...reshapedBatch];
        }

        return result
    }

    constructor(scene: BABYLON.Scene, array: any[]) {
        this.scene = scene;
        this.position = new BABYLON.Vector3(0, 0, 0);
        this.cube = BABYLON.MeshBuilder.CreateBox("value", { size: this.CUBE_SIZE }, scene);

        this.reshapedArray = this.getReshapedArray(array);
        this.shape = getArrayShape(this.reshapedArray);
    }
}
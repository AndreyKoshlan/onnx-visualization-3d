import * as BABYLON from 'babylonjs';
import {getArrayShape, getDepth, getTotalValuesCount, reshapeTo3D} from "./layer-utils";

export class Layer {
    CUBE_SIZE = 1;
    CUBE_OFFSET = 1.5;
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
        let maxX = 0, maxY = 0, maxZ = 0;

        for (const element of this.iterate()) {
            const [x_pos, y_pos, z_pos] = element.positionRelative;

            maxX = Math.max(maxX, x_pos);
            maxY = Math.max(maxY, -y_pos);
            maxZ = Math.max(maxZ, z_pos);
        }

        return [maxX, maxY, maxZ];
    }

    *iterate() {
        const zeroPoint = BABYLON.Vector3.Zero();

        let index = 0;
        for (let sliceIndex = 0; sliceIndex < this.reshapedArray.length; sliceIndex++) {
            for (let y = 0; y < this.reshapedArray[sliceIndex].length; y++) {
                for (let x = 0; x < this.reshapedArray[sliceIndex][y].length; x++) {
                    yield {
                        value: this.reshapedArray[sliceIndex][y][x],
                        position: this.getPosition(this.position, sliceIndex, y, x),
                        positionRelative: this.getPosition(zeroPoint, sliceIndex, y, x),
                        indices: [sliceIndex, y, x],
                        index: index
                    };
                    index++;
                }
            }
        }
    }

    getValuesCountInBatch(): number {
        if (Array.isArray(this.reshapedArray[0])) {
            return getTotalValuesCount(this.reshapedArray[0]);
        } else {
            if (Array.isArray(this.reshapedArray)) {
                return getTotalValuesCount(this.reshapedArray);
            } else {
                return 0;
            }
        }
    }

    getValuesCount() {
        return getTotalValuesCount(this.reshapedArray);
    }

    visualize() {
        let numInstances = this.getValuesCount();
        const matricesBuffer = new Float32Array(16 * numInstances);
        const colorBuffer = new Float32Array(4 * numInstances);

        for (const element of this.iterate()) {
            const {value, index} = element;
            const [xPos, yPos, zPos] = element.position;

            const matrix = BABYLON.Matrix.Translation(xPos, yPos, zPos);
            matrix.copyToArray(matricesBuffer, index * 16);

            let intensity = value;
            intensity = Math.max(0, Math.min(1, intensity));
            colorBuffer.set([intensity, intensity, intensity, 1], index * 4);
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
        this.position = BABYLON.Vector3.Zero();
        this.cube = BABYLON.MeshBuilder.CreateBox("value", { size: this.CUBE_SIZE }, scene);

        this.reshapedArray = this.getReshapedArray(array);
        this.shape = getArrayShape(this.reshapedArray);
    }
}
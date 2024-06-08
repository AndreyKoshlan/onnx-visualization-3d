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

export function normalize(value: number, min: number, max: number, minResult: number = 0): number {
    if (value <= min) return minResult;
    if (value >= max) return 1;
    return Math.max(minResult, (value - min) / (max - min));
}
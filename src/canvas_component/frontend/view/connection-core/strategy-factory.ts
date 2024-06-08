import {Layer} from "../layer";
import {ConnectionType} from "../types/connection/connection-type";
import {ConnectionStrategy} from "./connection-strategies/connection-strategy";
import {connectionTypeMap} from "./connection-type-map";

import {FullyConnectedStrategy} from "./connection-strategies/fully-connected-strategy";
import {OneToOneStrategy} from "./connection-strategies/one-to-one-strategy";
import {ConcatStrategy} from "./connection-strategies/concat-strategy";

export function getStrategy(type: ConnectionType, inputLayers: Layer[], outputLayers: Layer[], initializers: any[] = []): ConnectionStrategy | undefined {
    switch (type) {
        case ConnectionType.FullyConnected:
            return new FullyConnectedStrategy(inputLayers[0], outputLayers[0], initializers[0]);
        case ConnectionType.OneToOne:
            return new OneToOneStrategy(inputLayers[0], outputLayers[0]);
        case ConnectionType.Concat:
            return new ConcatStrategy(inputLayers, outputLayers[0]);
        case ConnectionType.None:
            return undefined;
        default:
            return undefined;
    }
}

export function getConnectionType(line: string): ConnectionType {
    if (line in connectionTypeMap) {
        return connectionTypeMap[line];
    }

    return ConnectionType.None;
}
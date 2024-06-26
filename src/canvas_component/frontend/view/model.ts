import * as BABYLON from 'babylonjs';
import ELK, {ElkNode} from 'elkjs/lib/elk.bundled.js'
import {ElkExtendedEdge} from "elkjs/lib/elk-api";

import {Data} from "./types/data/data";
import {Layer} from "./layer";
import {getLayersY} from "./layer-core/layer-utils";
import {Connection} from "./connection";
import {ConnectionType} from "./types/connection/connection-type";
import {getInitializerValues, iterateAllNodesIO, iterateAllNodesLayers} from "./graph/graph";
import {getConnectionType} from "./connection-core/strategy-factory";

export class Model {
    scene: BABYLON.Scene;
    data: Data;
    position: BABYLON.Vector3;

    layers: Record<string, Layer>;
    connections: Connection[];
    layout!: ElkNode;

    dispose() {
        for (const layerName in this.layers) {
            this.layers[layerName].cube.dispose();
        }
        for (const connection of this.connections) {
            connection.cube.dispose();
        }
    }

    getCenter(): BABYLON.Vector3 {
        let sumPosition = BABYLON.Vector3.Zero();
        let layerCount = 0;

        for (const layerName in this.layers) {
            const layerPosition = this.layers[layerName].position;
            const layerSize = this.layers[layerName].getSize();

            const layerCenter = layerPosition.add(new BABYLON.Vector3(
                layerSize[0] / 2,
                -layerSize[1] / 2,
                layerSize[2] / 2
            ));

            sumPosition = sumPosition.add(layerCenter);
            layerCount++;
        }

        return sumPosition.scale(1 / layerCount);
    }

    getLayoutFromOnnxGraph(): Promise<ElkNode> {
        const elk = new ELK();
        const graph = {
            id: "root",
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': 'DOWN',
                'spacing.nodeNodeBetweenLayers': this.data.settings.spacing_between_layers.toString()
            },
            children: [] as ElkNode[],
            edges: [] as ElkExtendedEdge[]
        };

        for (const name in this.layers) {
            const size = this.layers[name].getSize();
            graph.children.push({ id: name, width: size[0], height: 2 });
        }

        for (const element of iterateAllNodesIO(this.data, this.layers)) {
            const { inputName, outputName } = element;
            graph.edges.push({ id: inputName+outputName, sources: [inputName], targets: [outputName] } );
        }

        return elk.layout(graph);
    }

    createLayers(data: Data): Record<string, Layer> {
        const layers: Record<string, Layer> = {};

        const addLayers = (nodes: any) => {
            for (const name in nodes) {
                layers[name] = new Layer(this.scene, nodes[name], data.settings);
            }
        };

        addLayers(data.inputs);
        addLayers(data.outputs);

        return layers;
    }

    createConnections(data: Data, layers: Record<string, Layer>): Connection[] {
        const connections: Connection[] = [];

        for (const element of iterateAllNodesLayers(data, layers)) {
            const { inputs, outputs, nodeName } = element;
            const node = data.graph.nodes[nodeName];

            const initializers = getInitializerValues(data, node);
            if (initializers.length === 0) {
                console.log(`Initializer not found for node: ${nodeName}`);
            }

            const type: ConnectionType = getConnectionType(node.operation_type);

            if (type == ConnectionType.None) {
                console.log(`Unknown operation '${node.operation_type}' for node ${nodeName}`);
            }

            const inputLayers = inputs.map(inputName => layers[inputName]);
            const outputLayers = outputs.map(outputName => layers[outputName]);

            connections.push(
                new Connection(this.scene, inputLayers, outputLayers, initializers, type, data.settings)
            );
        }

        return connections;
    }

    visualize() {
        const positionsY = getLayersY(this.data, this.layers);

        if (this.layout?.children) {
            for (const node of this.layout.children) {
                const name = node.id;
                this.layers[name].position = new BABYLON.Vector3(node.x, positionsY[name], node.y);
                this.layers[name].visualize();
            }
        }

        for (const connection of this.connections) {
            connection.visualize();
        }
    }

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, data: Data, callback: () => void) {
        this.scene = scene;
        this.data = data;
        this.position = new BABYLON.Vector3(position.x, position.y, position.z);

        this.layers = this.createLayers(data);
        this.connections = this.createConnections(data, this.layers);
        this.getLayoutFromOnnxGraph().then((layout) => {
            this.layout = layout;

            this.visualize();

            callback();
        });
    }
}
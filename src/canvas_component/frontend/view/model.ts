import * as BABYLON from 'babylonjs';
import ELK, {ElkNode} from 'elkjs/lib/elk.bundled.js'
import {ElkExtendedEdge} from "elkjs/lib/elk-api";

import {Data} from "./types";
import {Layer} from "./layer";
import {getLayersY} from "./layer-utils";
import {Connection, ConnectionType} from "./connection";
import {getInitializerValue, iterateAllNodesIO} from "./graph";

export class Model {
    DISTANCE = 20;
    scene: BABYLON.Scene;
    data: Data;
    position: BABYLON.Vector3;

    layers: Record<string, Layer>;
    connections: Connection[];
    layout!: ElkNode;

    getLayoutFromOnnxGraph(): Promise<ElkNode> {
        const elk = new ELK();
        const graph = {
            id: "root",
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': 'DOWN'
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
                layers[name] = new Layer(this.scene, nodes[name]);
            }
        };

        addLayers(data.inputs);
        addLayers(data.outputs);

        return layers;
    }

    createConnections(data: Data): Connection[] {
        const connections: Connection[] = [];

        for (const element of iterateAllNodesIO(this.data, this.layers)) {
            const { inputName, outputName, nodeName } = element;

            const inputLayer = this.layers[inputName];
            const outputLayer = this.layers[outputName];
            const node = data.graph.nodes[nodeName];

            const initializer = getInitializerValue(this.data, node);
            if (!initializer) {
                console.log(`Initializer not found for node: ${nodeName}`);
                continue;
            }

            const type: ConnectionType = Connection.getType(node.operation_type);
            connections.push(
                new Connection(this.scene, initializer, inputLayer, outputLayer, type)
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

    dispose() {
        for (const layerName in this.layers) {
            this.layers[layerName].cube.dispose();
        }
        for (const connection of this.connections) {
            connection.cube.dispose();
        }
    }

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, data: Data) {
        this.scene = scene;
        this.data = data;
        this.position = new BABYLON.Vector3(position.x, position.y, position.z);

        this.layers = this.createLayers(data);
        this.connections = this.createConnections(data);
        this.getLayoutFromOnnxGraph().then((layout) => {
            this.layout = layout;

            this.visualize();
        });
    }
}
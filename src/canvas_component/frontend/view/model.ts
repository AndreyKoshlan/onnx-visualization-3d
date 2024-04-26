import * as BABYLON from 'babylonjs';
import ELK, {ElkNode} from 'elkjs/lib/elk.bundled.js'

import {Data, MappingType, NodesType} from "./types";
import {Layer} from "./layer";
import {getLayersY} from "./layer-utils";

export class Model {
    DISTANCE = 20;
    scene: BABYLON.Scene;
    data: Data;
    position: BABYLON.Vector3;
    inputMapping: Record<string, string[]>;
    outputMapping: Record<string, string[]>;

    layers: Record<string, Layer>;
    layout: ElkNode;

    createNodeMapping(nodes: NodesType, mappingType: MappingType): Record<string, string[]> {
        const nodeMapping: Record<string, string[]> = {};

        for (const nodeName in nodes) {
            if (nodes.hasOwnProperty(nodeName)) {
                const nodeDetails = nodes[nodeName];
                nodeDetails[mappingType].forEach(connection => {
                    if (!nodeMapping[connection]) {
                        nodeMapping[connection] = [];
                    }
                    nodeMapping[connection].push(nodeName);
                });
            }
        }

        return nodeMapping;
    }

    getLayoutFromOnnxGraph(): Promise<ElkNode> {
        const elk = new ELK();
        const graph = {
            id: "root",
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': 'DOWN'
            },
            children: [],
            edges: []
        };

        Object.keys(this.layers).forEach(name => {
            const size = this.layers[name].getSize();
            graph.children.push({ id: name, width: size[0], height: 2 });
        });

        Object.keys(this.data.graph.nodes).forEach(nodeName => {
            const node = this.data.graph.nodes[nodeName];
            node.inputs.forEach(inputName => {
                if (!(inputName in this.layers)) return;

                node.outputs.forEach(outputName => {
                    if (!(outputName in this.layers)) return;
                    graph.edges.push({ id: inputName+outputName, sources: [inputName], targets: [outputName] } );
                });
            });
        });

        return elk.layout(graph);
    }

    createLayers(data: Data): Record<string, Layer> {
        const layers = {};

        const addLayers = (nodes) => {
            Object.keys(nodes).forEach(name => {
                layers[name] = new Layer(this.scene, nodes[name]);
            });
        };

        addLayers(data.inputs);
        addLayers(data.outputs);

        return layers;
    }

    visualize() {
        const positionsY = getLayersY(this.data, this.inputMapping, this.outputMapping, this.layers);

        this.layout.children.forEach(node => {
            const name = node.id;
            this.layers[name].position = new BABYLON.Vector3(node.x, positionsY[name], node.y);
            this.layers[name].visualize();
        });
    }

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, data: Data) {
        this.scene = scene;
        this.data = data;
        this.position = new BABYLON.Vector3(position.x, position.y, position.z);
        this.inputMapping = this.createNodeMapping(data.graph.nodes, MappingType.Inputs);
        this.outputMapping = this.createNodeMapping(data.graph.nodes, MappingType.Outputs);

        this.layers = this.createLayers(data);
        this.getLayoutFromOnnxGraph().then((layout) => {
            this.layout = layout;

            this.visualize();
        });
    }
}
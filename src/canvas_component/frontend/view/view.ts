import * as BABYLON from 'babylonjs';
import {Model} from "./model";
import {Data} from "./types";

export class View {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene!: BABYLON.Scene;
    camera!: BABYLON.ArcRotateCamera;
    light!: BABYLON.Light;
    model!: Model;

    private createScene() {
        this.scene = new BABYLON.Scene(this.engine);

        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 2,
            2,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true);

        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this.scene);

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () =>{
            this.engine.resize();
        });
    }

    setData(data: Data) {
        console.log(data);

        this.model?.dispose();
        this.model = new Model(
            this.scene,
            BABYLON.Vector3.Zero(),
            data,
            () => this.camera.target = this.model.getCenter()
        );

        this.engine.resize();
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(canvas, true);
        this.createScene();
    }
}
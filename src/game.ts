import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";

export function createGame() {
    let canvas = document.getElementById("root") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)

    let scene = new BABYLON.Scene(engine)
    let camera = createCamera(scene, canvas)

    let sceneObjs = createSceneObjs({scene,})

    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    return {
        engine,
        canvas,
        scene,
        sceneObjs,
        camera,
        start: () => {
            engine.runRenderLoop(function () {
                if (scene && scene.activeCamera) {
                    scene.render();
                }
            });
        },
    }
}

function createCamera(scene: BABYLON.Scene, canvas: HTMLElement) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, true);
    return camera
}

export type Game = ReturnType<typeof createGame>

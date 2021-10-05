import * as BABYLON from "babylonjs";
import {createMainScene, GameScene} from "./scene";

export interface Game {
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement,
    mainScene: GameScene,

    start(): void
}

export function createGame(): Game {
    let canvas = document.getElementById("root") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)

    let mainScene = createMainScene({
        engine, canvas
    })
    let scene = mainScene.bScene

    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    return {
        engine,
        canvas,
        mainScene,
        start: () => {
            engine.runRenderLoop(function () {
                if (scene && scene.activeCamera) {
                    scene.render();
                }
            });
        },
    }
}

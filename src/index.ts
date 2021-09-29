import * as BABYLON from "babylonjs"


let canvas = document.getElementById("root") as HTMLCanvasElement


let engine = new BABYLON.Engine(canvas)


const scene = new BABYLON.Scene(engine);

const camera = new BABYLON.ArcRotateCamera(
    "camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0),
    scene);
camera.attachControl(canvas, true);

const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

const box = BABYLON.MeshBuilder.CreateBox("box", {});

engine.runRenderLoop(function () {
    if (scene && scene.activeCamera) {
        scene.render();
    }
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});

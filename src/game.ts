import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {createDragController, DragEventData} from "./drag";

export function createGame() {
    let canvas = document.getElementById("root") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)
    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    let scene = new BABYLON.Scene(engine)
    let camera = createCamera(scene, canvas)
    let sceneObjs = createSceneObjs({scene})

    let dragController = createDragController({scene, camera, canvas})
    for (const human of sceneObjs.humans.values()) {
        dragController.toDrags.add(human.mesh)
    }
    let dragInfos = new Map<BABYLON.AbstractMesh, {
        originPos: BABYLON.Vector3,
    }>()
    dragController.onDragStartObservable.add(({draggingObj, pointerInfo}) => {
        if (draggingObj) {
            dragInfos.set(draggingObj, {originPos: draggingObj.position.clone()})
        }
    })
    dragController.onDragEndObservable.add(({draggingObj, pointerInfo}) => {
        if (!draggingObj)
            return
        let info = dragInfos.get(draggingObj)
        if (!info)
            return
        draggingObj.position = info.originPos
        dragInfos.clear()
    })
    dragController.onDragMoveObservable.add(({draggingObj, pointerInfo}) => {
        if (!draggingObj)
            return

        let pos = getGroundPosition(scene, sceneObjs.ground)
        if (pos) {
            draggingObj.position = pos
            draggingObj.position.y += 3
        }
    })

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

// 获取当前鼠标所在的地形位置
function getGroundPosition(scene: BABYLON.Scene, ground: BABYLON.AbstractMesh) {
    let res = scene.pick(scene.pointerX, scene.pointerY, mesh => mesh === ground)
    if (res && res.hit) {
        return res.pickedPoint
    }
}

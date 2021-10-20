import * as BABYLON from "babylonjs";
import {Game} from "./game";

export function createCamera({scene, canvas, game}: {
    scene: BABYLON.Scene, canvas: HTMLElement, game: Game,
}) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, true);

    // 在拖拽时禁止相机旋转
    game.humanDrag.onAfterDraggingStatusChangeObservable.add(status => {
        if (status === 'draggingStart')
            camera.detachControl()
        else if (status === 'draggingEnd')
            camera.attachControl()
    })

    return camera
}
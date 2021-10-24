import * as BABYLON from "babylonjs";
import {Game} from "./game";

export function createCamera({scene, canvas, game}: {
    scene: BABYLON.Scene, canvas: HTMLElement, game: Game,
}) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI * 0.5, Math.PI / 3.5, 15, new BABYLON.Vector3(0, 0, -3),
        scene);

    // 仅在调试场景时附加相机控制
    // @ts-ignore
    if (window.debugScene) {
        camera.attachControl(canvas, true);

        // 在拖拽时禁止相机旋转
        game.humanDrag.onAfterDraggingStatusChangeObservable.add(status => {
            if (status === 'draggingStart')
                camera.detachControl()
            else if (status === 'draggingEnd')
                camera.attachControl()
        })
    }

    return camera
}
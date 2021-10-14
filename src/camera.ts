import * as BABYLON from "babylonjs";
import {GameEvents, GameStatus} from "./game";
import {HumanDragEndEventType, HumanDragStartEventType} from "./human";

export function createCamera({scene, canvas, gameStatus, gameEvents}: {
    scene: BABYLON.Scene, canvas: HTMLElement,
    gameEvents: GameEvents, gameStatus: GameStatus,
}) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, true);

    // 在拖拽时禁止相机旋转
    gameEvents.add((eventData, eventState) => {
        if (eventData.type === HumanDragStartEventType) {
            camera.detachControl()
        } else if (eventData.type === HumanDragEndEventType) {
            camera.attachControl()
        }
    })

    return camera
}
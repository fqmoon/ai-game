import * as BABYLON from "babylonjs";
import {GameEvents, Game} from "./game";
import {HumanDragBeforeEndEventType, HumanDragStartEventType} from "./human";

export function createCamera({scene, canvas, gameStatus, gameEvents}: {
    scene: BABYLON.Scene, canvas: HTMLElement,
    gameEvents: GameEvents, gameStatus: Game,
}) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, true);

    // 在拖拽时禁止相机旋转
    gameEvents.add((eventData, eventState) => {
        if (eventData.type === HumanDragStartEventType) {
            camera.detachControl()
        } else if (eventData.type === HumanDragBeforeEndEventType) {
            camera.attachControl()
        }
    })

    return camera
}
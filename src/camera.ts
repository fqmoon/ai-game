import * as BABYLON from "babylonjs";
import {Game} from "./game";
import {HumanDragBeforeEndEventType, HumanDragStartEventType} from "./human";

export function createCamera({scene, canvas, game}: {
    scene: BABYLON.Scene, canvas: HTMLElement, game: Game,
}) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, true);

    // 在拖拽时禁止相机旋转
    game.msg.add((eventData, eventState) => {
        if (eventData.type === HumanDragStartEventType) {
            camera.detachControl()
        } else if (eventData.type === HumanDragBeforeEndEventType) {
            camera.attachControl()
        }
    })

    return camera
}
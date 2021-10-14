import * as BABYLON from "babylonjs";
import {GameEvents, GameStatus} from "./game";
import {HumanDragStartEventType} from "./human";

export const PointerOnGroundEventType = "PointerOnGroundEvent"

export interface PointerOnGroundEvent {
    type: typeof PointerOnGroundEventType
    pos: BABYLON.Vector3
}

export function createGround({scene, gameEvents, gameStatus}: {
    scene: BABYLON.Scene, gameEvents: GameEvents, gameStatus: GameStatus
}) {
    let mesh = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 100,
        height: 100,
    }, scene)
    let groundMat = new BABYLON.StandardMaterial("gm", scene)
    groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5)
    mesh.material = groundMat
    mesh.receiveShadows = true

    // 获取当前鼠标所在的地形位置
    function getPointerPositionOnGround() {
        let res = scene.pick(scene.pointerX, scene.pointerY, m => m === mesh)
        if (res && res.hit) {
            return res.pickedPoint
        }
    }

    let ground = {
        mesh,
        getGroundPosition: getPointerPositionOnGround,
    }

    function setMsg() {
        let pos = getPointerPositionOnGround()
        if (pos) {
            gameEvents.notifyObservers({
                type: PointerOnGroundEventType,
                pos,
            })
        }
    }

    // 在鼠标移动时发送
    scene.onPointerObservable.add((eventData, eventState) => {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERMOVE && gameStatus.humanDrag.active) {
            setMsg()
        }
    })
    gameEvents.add(((eventData, eventState) => {
        if (eventData.type === HumanDragStartEventType) {
            setMsg()
        }
    }))

    return ground
}

export type Ground = ReturnType<typeof createGround>

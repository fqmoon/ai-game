import * as BABYLON from "babylonjs";
import {GameEvents, GameStatus} from "./game";

export const PointMoveOnGroundEventType = "PointMoveOnGroundEvent"

export interface PointMoveOnGroundEvent {
    type: typeof PointMoveOnGroundEventType
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

    // todo  更新human位置，由谁来做比较合理？
    // human和ground没有依赖性
    // Human和slot有依赖性
    // todo 这里是事件
    // 如果弄成事件，应该是外部来做？这样不成了global么
    // 还是local化。封装不只是行为和数据的绑定，还有local化

    let ground = {
        mesh,
        getGroundPosition: getPointerPositionOnGround,
    }

    // 在鼠标移动时发送
    scene.onPointerObservable.add((eventData, eventState) => {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERMOVE && gameStatus.humanDrag.active) {
            let pos = getPointerPositionOnGround()
            if (pos) {
                gameEvents.notifyObservers({
                    type: PointMoveOnGroundEventType,
                    pos,
                })
            }
        }
    })

    return ground
}

export type Ground = ReturnType<typeof createGround>

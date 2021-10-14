import * as BABYLON from "babylonjs";
import {PointMoveOnGroundEventType} from "./ground";
import {SlotManager, SlotPos} from "./slot";
import {Region} from "./region";
import {GameEvents, GameStatus} from "./game";

export type HumanIdentity = 'missionary' | 'cannibal'

export interface HumanMesh extends BABYLON.AbstractMesh {
    metadata: {
        gameObj: Human
        gameObjType: "Human"
    }
}

export interface Human {
    mesh: HumanMesh
    yOff: number
    identity: HumanIdentity
    slotManager?: SlotManager
    slotPos?: SlotPos
    region?: Region

    setPos(pos: BABYLON.Vector3): void

    setPosByPlanePos(planePos: BABYLON.Vector2): void
}

export const HumanDragStartEventType = "HumanDragStartEvent"
export const HumanDragEndEventType = "HumanDragEndEvent"
export const HumanDragMoveEventType = "HumanDragMoveEvent"

export interface HumanDragStartEvent {
    type: typeof HumanDragStartEventType
}

export interface HumanDragEndEvent {
    type: typeof HumanDragEndEventType
}

export interface HumanDragMoveEvent {
    type: typeof HumanDragMoveEventType
}

export function createHuman({scene, position, identity, gameEvents, gameStatus}: {
    scene: BABYLON.Scene, position: BABYLON.Vector3, identity: HumanIdentity,
    gameEvents: GameEvents, gameStatus: GameStatus,
}): Human {

    function createBox() {
        const box = BABYLON.MeshBuilder.CreateBox("box", {
            width: 1,
            height: 1,
            depth: 1,
        });
        box.position = position
        let boxMat = new BABYLON.StandardMaterial("boxMat", scene)
        boxMat.diffuseColor = new BABYLON.Color3(1, 0, 0)
        box.material = boxMat
        return box
    }

    let mesh = createBox() as HumanMesh

    let human = {
        mesh,
        identity,
        // 离地面高度
        yOff: 0.5,
        slotManager: undefined,
        slotPos: undefined,
        region: undefined,
        setPos(pos: BABYLON.Vector3) {
            mesh.position.copyFrom(pos)
            mesh.position.y += human.yOff
        },
        setPosByPlanePos(planePos: BABYLON.Vector2) {
            mesh.position.x = planePos.x
            mesh.position.y = human.yOff
            mesh.position.z = planePos.y
        },
    }
    mesh.metadata = {
        gameObj: human,
        gameObjType: "Human",
    }

    // 拖动时根据地形位置更新human位置
    gameEvents.add((eventData, eventState) => {
        if (eventData.type === PointMoveOnGroundEventType
            && gameStatus.humanDrag.active
            && gameStatus.humanDrag.dragging
            && gameStatus.humanDrag.human === human) {

            human.setPos(eventData.pos)
        }
    })

    // 拖动
    scene.onPointerObservable.add((pointerInfo, eventState) => {
        if (!gameStatus.humanDrag.active)
            return

        let dragInfo = gameStatus.humanDrag

        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            if (pointerInfo.pickInfo?.hit &&
                pointerInfo.pickInfo.pickedMesh) {

                let pickedMesh = pointerInfo.pickInfo.pickedMesh
                if (pickedMesh === mesh) {
                    dragInfo.human = human
                    dragInfo.dragging = true

                    gameEvents.notifyObservers({
                        type: HumanDragStartEventType,
                    })

                    // TODO 修改成非特例，根据status来
                    // dragInfo.dstRegion.updateColorByDrag(true)
                }
            }
        } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
            if (dragInfo.human === human) {
                // todo
                // dragInfo.dstRegion.updateColorByDrag(false)

                gameEvents.notifyObservers({
                    type: HumanDragEndEventType,
                })

                gameStatus.humanDrag = {
                    ...dragInfo,
                    dragging: false,
                    human: undefined,
                }
            }
        } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (dragInfo.human === human) {
                gameEvents.notifyObservers({
                    type: HumanDragMoveEventType,
                })
            }
            // regions.leftBank.updateColorByDrag(dragging)
            // regions.boat.updateColorByDrag(dragging)
        }
    })

    return human
}


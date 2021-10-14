import * as BABYLON from "babylonjs"
import {createSlotManager, SlotManager} from "./slot";
import {Human, HumanDragEndEventType, HumanDragMoveEventType, HumanDragStartEventType, HumanIdentity} from "./human";
import {GameEvents, GameStatus} from "./game";

export interface PutEventData {
    draggingObj?: BABYLON.AbstractMesh
    regionPut: boolean
}

/**
 * 主导用户交互，包括以颜色提示放置区域
 */
export function createRegion({scene, position, width, height, gameStatus, gameEvents}: {
    scene: BABYLON.Scene, position: BABYLON.Vector3, width: number, height: number,
    gameEvents: GameEvents,
    gameStatus: GameStatus,
}) {
    let mesh = BABYLON.MeshBuilder.CreatePlane("region", {
        width,
        height,
    }, scene)
    mesh.position = position
    let material = new BABYLON.StandardMaterial("", scene)
    mesh.material = material
    mesh.rotation.x = Math.PI * 0.5
    let originColor = new BABYLON.Color3(0.7, 0.5, 0.5)
    let promoteColor = new BABYLON.Color3(0.0, 0.5, 1.0)
    let selectedColor = new BABYLON.Color3(0.0, 1.0, 0.5)
    material.diffuseColor.copyFrom(originColor)

    let slotManagers: { [key in HumanIdentity]: SlotManager } = {
        'missionary': createSlotManager({
            leftDownPosition: new BABYLON.Vector2(position.x - width * 0.5, position.z),
            rightUpPosition: new BABYLON.Vector2(position.x + width * 0.5, position.z + height * 0.5),
            slotSize: [1, 3],
        }),
        'cannibal': createSlotManager({
            leftDownPosition: new BABYLON.Vector2(position.x - width * 0.5, position.z - height * 0.5),
            rightUpPosition: new BABYLON.Vector2(position.x + width * 0.5, position.z),
            slotSize: [1, 3],
        }),
    }

    function isPick() {
        let res = scene.pick(scene.pointerX, scene.pointerY, m => m === mesh)
        return res?.hit
    }

    // 在拖拽时更新选中的region信息
    gameEvents.add(((eventData, eventState) => {
        let dragInfo = gameStatus.humanDrag
        if (!dragInfo.targetRegions.has(region)) {
            return
        }

        if (eventData.type === HumanDragStartEventType || eventData.type === HumanDragMoveEventType) {
            if (isPick()) {
                dragInfo.reachedRegion = region
                region.setColorByDrag("reach")
            } else {
                region.setColorByDrag("notReach")
            }
        } else if (eventData.type === HumanDragEndEventType) {
            region.setColorByDrag("noDrag")
        }
    }))

    // 在拖拽结束时放置human
    gameEvents.add(((eventData, eventState) => {
        let dragInfo = gameStatus.humanDrag
        if (!dragInfo.dragging
            // 持有human的region才响应该事件
            || dragInfo.reachedRegion !== region)
            return

        if (eventData.type === HumanDragEndEventType) {
            dragInfo.reachedRegion.putHumanByDrag(dragInfo.human)
        }
        // TODO 放置失败还原

    }))

    let region = {
        mesh,
        slotManagers,
        putHuman(human: Human) {
            if (human.region === region)
                return false

            let newSlotManager = slotManagers[human.identity]
            if (newSlotManager === human.slotManager)
                return false

            // 先pop
            human.region?.popHuman(human)
            // 再执行put具体操作
            let res = newSlotManager.put()
            if (res) {
                human.setPosByPlanePos(res.planePos)

                human.slotManager = newSlotManager
                human.slotPos = res.slotPos
                human.region = region
            }
            return !!res
        },
        popHuman(human: Human) {
            if (human.region !== region)
                return false

            let slotManager = slotManagers[human.identity]
            // 若不是region下的slotManager里的human
            if (slotManager !== human.slotManager)
                return false

            if (human.slotPos && human.slotManager)
                human.slotManager.pop(human.slotPos)
            human.slotManager = undefined
            human.slotPos = undefined
            human.region = undefined
        },
        putHumanByDrag(human: Human) {
            if (isPick()) {
                return this.putHuman(human)
            }
            return false
        },
        setColorByDrag(status: "reach" | "notReach" | "noDrag") {
            if (status === "noDrag") {
                material.diffuseColor.copyFrom(originColor)
            } else if (status === "reach") {
                material.diffuseColor.copyFrom(selectedColor)
            } else {
                material.diffuseColor.copyFrom(promoteColor)
            }
        },
    }
    return region
}

export type Region = ReturnType<typeof createRegion>

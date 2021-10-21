import * as BABYLON from "babylonjs"
import {createSlotManager, SlotManager} from "./slot";
import {
    Human,
    HumanIdentity
} from "./human";
import {Game} from "./game";

/**
 * 主导用户交互，包括以颜色提示放置区域
 */
export function createRegion({scene, position, width, height, game}: {
    scene: BABYLON.Scene, position: BABYLON.Vector3, width: number, height: number, game: Game,
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

    function isRegionActive() {
        return game.humanDrag.activeRegions.has(region)
    }

    game.humanDrag.onAfterDraggingStatusChangeObservable.add(status => {
        if (!isRegionActive())
            return

        if (status === 'draggingStart') {
            if (game.humanDrag.reachedRegion === region) {
                region.setColorByDrag("reach")
            } else {
                region.setColorByDrag("notReach")
            }
        } else if (status === 'draggingEnd') {
            region.setColorByDrag("noDrag")
        }
    })

    game.humanDrag.onDraggingPointerMoveObservable.add(eventData => {
        if (!isRegionActive())
            return

        if (game.humanDrag.reachedRegion === region) {
            region.setColorByDrag("reach")
        } else {
            region.setColorByDrag("notReach")
        }
    })

    let _humans = new Set<Human>()

    function getHumanCount() {
        return _humans.size
    }

    let region = {
        mesh,
        slotManagers,
        get humanCount() {
            return getHumanCount()
        },
        hasHuman(human: Human) {
            return _humans.has(human)
        },
        get humans() {
            return _humans
        },
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
                _humans.add(human)
                this.onAfterHumanCountChangeObservable.notifyObservers(getHumanCount())
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
            _humans.delete(human)
            this.onAfterHumanCountChangeObservable.notifyObservers(getHumanCount())
        },
        resetHumanPos(human: Human) {
            if (human.region !== region || !human.slotManager || !human.slotPos)
                return false

            human.setPosByPlanePos(human.slotManager.slotPosToPlanePos(human.slotPos))
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
        onAfterHumanCountChangeObservable: new BABYLON.Observable<number>(),
    }
    return region
}

export type Region = ReturnType<typeof createRegion>

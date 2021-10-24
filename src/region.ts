import * as BABYLON from "babylonjs"
import {createSlotManager, SlotManager, SlotPos, SlotSize} from "./slot";
import {
    Human,
    HumanIdentity
} from "./human";
import {Game} from "./game";

type RegionStatus = "reach" | "notReach" | "noDrag"

export abstract class Region {
    _mesh: BABYLON.AbstractMesh
    _game: Game
    _material: BABYLON.StandardMaterial
    _humans = new Set<Human>()
    onAfterHumanCountChangeObservable = new BABYLON.Observable<number>()

    _originColor = new BABYLON.Color3(0.7, 0.5, 0.5)
    _promoteColor = new BABYLON.Color3(0.0, 0.5, 1.0)
    _selectedColor = new BABYLON.Color3(0.0, 1.0, 0.5)

    constructor({scene, position, width, height, game}: {
        scene: BABYLON.Scene, position: BABYLON.Vector3, width: number, height: number, game: Game,
    }) {
        this._game = game
        let mesh = BABYLON.MeshBuilder.CreatePlane("region", {
            width,
            height,
        }, scene)
        mesh.receiveShadows = false
        mesh.position = position
        let material = new BABYLON.StandardMaterial("", scene)
        mesh.material = material
        mesh.rotation.x = Math.PI * 0.5

        material.diffuseColor.copyFrom(this._originColor)
        material.alpha = 0
        this._mesh = mesh
        this._material = material

        game.humanDrag.onAfterDraggingStatusChangeObservable.add(status => {
            if (!this.regionActive)
                return

            if (status === 'draggingStart') {
                if (game.humanDrag.reachedRegion === this) {
                    this._setColorByDrag("reach")
                } else {
                    this._setColorByDrag("notReach")
                }
            } else if (status === 'draggingEnd') {
                this._setColorByDrag("noDrag")
            }
        })

        game.humanDrag.onDraggingPointerMoveObservable.add(eventData => {
            if (!this.regionActive)
                return

            if (game.humanDrag.reachedRegion === this) {
                this._setColorByDrag("reach")
            } else {
                this._setColorByDrag("notReach")
            }
        })
    }

    get regionActive() {
        return this._game.humanDrag.activeRegions.has(this)
    }

    get mesh() {
        return this._mesh
    }

    _setColorByDrag(status: RegionStatus) {
        let material = this._material
        if (status === "noDrag") {
            material.diffuseColor.copyFrom(this._originColor)
            material.alpha = 0
        } else if (status === "reach") {
            material.diffuseColor.copyFrom(this._selectedColor)
            material.alpha = 0.3
        } else {
            material.diffuseColor.copyFrom(this._promoteColor)
            material.alpha = 0.3
        }
    }

    hasHuman(human: Human) {
        return this._humans.has(human)
    }

    abstract findPutSlotManager(human: Human): SlotManager | undefined

    // canPut(human: Human) {
    //     if (this.hasHuman(human))
    //         return false
    //
    //     let slotManager = this.findHumanSlotManager(human)
    //     if (slotManager && !slotManager.canPut)
    //         return false
    //     else {
    //         return true
    //     }
    // }

    putHuman(human: Human) {
        if (this.hasHuman(human))
            return false

        let slotManager = this.findPutSlotManager(human)
        if (!slotManager)
            return false

        // 先pop
        human.region?.popHuman(human)
        // 再执行put具体操作
        let res = slotManager.put()
        if (res) {
            human.setPosByPlanePos(res.planePos)

            human.slotManager = slotManager
            human.slotPos = res.slotPos
            human.region = this
            this._humans.add(human)
            this.onAfterHumanCountChangeObservable.notifyObservers(this.humanCount)
        }
        return !!res
    }

    get humanCount() {
        return this._humans.size
    }

    get missionaryCount() {
        return this.missionaries.length
    }

    get cannibalCount() {
        return this.cannibals.length
    }

    get humans() {
        return this._humans
    }

    get missionaries() {
        return Array.from(this._humans).filter(human => human.identity === 'missionary')
    }

    get cannibals() {
        return Array.from(this._humans).filter(human => human.identity === 'cannibal')
    }

    resetHumanPos(human: Human) {
        if (!this.hasHuman(human) || !this.findHumanSlotManager(human))
            return false

        let slotManager = human.slotManager as SlotManager
        let slotPos = human.slotPos as SlotPos
        human.setPosByPlanePos(slotManager.slotPosToPlanePos(slotPos))
        return true
    }

    popHuman(human: Human) {
        if (!this.hasHuman(human))
            return false

        let slotManager = this.findHumanSlotManager(human)
        if (!slotManager)
            return false

        if (human.slotPos && human.slotManager)
            human.slotManager.pop(human.slotPos)
        human.slotManager = undefined
        human.slotPos = undefined
        human.region = undefined
        this._humans.delete(human)
        this.onAfterHumanCountChangeObservable.notifyObservers(this.humanCount)
        return true
    }

    abstract findHumanSlotManager(human: Human): SlotManager | false
}

export class Bank extends Region {
    _slotManagers: any

    constructor({scene, position, width, height, game, cannibalSlotSize, missionarySlotSize}: {
        scene: BABYLON.Scene, position: BABYLON.Vector3, width: number, height: number, game: Game,
        cannibalSlotSize: SlotSize,
        missionarySlotSize: SlotSize,
    }) {
        super({scene, position, width, height, game});

        let slotManagers: { [key in HumanIdentity]: SlotManager } = {
            'missionary': createSlotManager({
                leftDownPosition: new BABYLON.Vector2(position.x - width * 0.5, position.z),
                rightUpPosition: new BABYLON.Vector2(position.x + width * 0.5, position.z + height * 0.5),
                slotSize: missionarySlotSize,
            }),
            'cannibal': createSlotManager({
                leftDownPosition: new BABYLON.Vector2(position.x - width * 0.5, position.z - height * 0.5),
                rightUpPosition: new BABYLON.Vector2(position.x + width * 0.5, position.z),
                slotSize: cannibalSlotSize,
            }),
        }
        this._slotManagers = slotManagers
    }

    findHumanSlotManager(human: Human) {
        if (!this.hasHuman(human))
            return false
        if (this._slotManagers[human.identity] === human.slotManager)
            return human.slotManager as SlotManager
        return false
    }

    findPutSlotManager(human: Human): SlotManager | undefined {
        if (!this.hasHuman(human)) {
            let slotManager = this._slotManagers[human.identity]
            if (slotManager && slotManager.canPut)
                return slotManager
        }
    }
}

export class Boat extends Region {
    _slotManager: SlotManager

    constructor({scene, position, width, height, game, humanSlotSize}: {
        scene: BABYLON.Scene, position: BABYLON.Vector3, width: number, height: number, game: Game,
        humanSlotSize: SlotSize,
    }) {
        super({scene, position, width, height, game});

        let slotManager = createSlotManager({
            leftDownPosition: new BABYLON.Vector2(position.x - width * 0.5, position.z - height * 0.5),
            rightUpPosition: new BABYLON.Vector2(position.x + width * 0.5, position.z + height * 0.5),
            slotSize: humanSlotSize,
        })
        this._slotManager = slotManager
    }

    findHumanSlotManager(human: Human): SlotManager | false {
        if (!this.hasHuman(human))
            return false
        if (this._slotManager === human.slotManager)
            return human.slotManager as SlotManager
        return false
    }

    findPutSlotManager(human: Human): SlotManager | undefined {
        if (!this.hasHuman(human)) {
            if (this._slotManager.canPut)
                return this._slotManager
        }
    }
}


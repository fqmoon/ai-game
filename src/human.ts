import * as BABYLON from "babylonjs";
import {SlotManager, SlotPos} from "./slot";
import {Region} from "./region";
import {Game} from "./game";

export type HumanIdentity = 'missionary' | 'cannibal'

export interface HumanMesh extends BABYLON.AbstractMesh {
    metadata: {
        gameObj: Human
        gameObjType: "Human"
    }
}

export interface Human {
    mesh: HumanMesh
    meshes: HumanMesh[]
    yOff: number
    dragYOff: number
    identity: HumanIdentity
    slotManager?: SlotManager
    slotPos?: SlotPos
    region?: Region

    setPos(pos: BABYLON.Vector3): void

    setPosByPlanePos(planePos: BABYLON.Vector2): void
}

export async function createHuman({scene, position, identity, game}: {
    scene: BABYLON.Scene, position: BABYLON.Vector3, identity: HumanIdentity, game: Game,
}): Promise<Human> {

    // TODO 颜色不生效
    let activeColor = new BABYLON.Color3(1, 0, 0)
    let inactiveColor = new BABYLON.Color3(0.5, 0, 0)

    let material = new BABYLON.StandardMaterial("boxMat", scene)
    material.diffuseColor.copyFrom(activeColor)

    async function loadMesh() {
        return BABYLON.SceneLoader.ImportMeshAsync("", "", identity + ".glb", scene,)
    }

    let meshes = (await loadMesh()).meshes
    let mesh = meshes[0]

    let human = {
        // TODO 删除mesh，用meshes即可
        mesh,
        meshes,
        identity,
        // 离地面高度
        yOff: 0,
        dragYOff: 1,
        slotManager: undefined,
        slotPos: undefined,
        // TODO 更名为private或直接删掉
        region: undefined,
        setPos(pos: BABYLON.Vector3) {
            mesh.position.copyFrom(pos)
            mesh.position.y += human.dragYOff
        },
        setPosByPlanePos(planePos: BABYLON.Vector2) {
            mesh.position.x = planePos.x
            mesh.position.y = human.yOff
            mesh.position.z = planePos.y
        },
    } as Human
    for (let mesh of meshes) {
        if (!mesh.metadata)
            mesh.metadata = {}
        mesh.metadata.gameObj = human
        mesh.metadata.gameObjType = "Human"
    }

    function putIntoRegion() {
        let dragInfo = game.humanDrag
        if (dragInfo.human === human && dragInfo.reachedRegion) { // 放置成功
            dragInfo.reachedRegion.putHuman(human)
        }
        // 放置成功或失败都重置一下位置
        human.region?.resetHumanPos(human)
    }

    function updateByRegionActive() {
        if (human.region && game.humanDrag.activeRegions.has(human.region)) { // 如果当前region激活
            material.diffuseColor.copyFrom(activeColor)
        } else { // 否则
            material.diffuseColor.copyFrom(inactiveColor)
        }
    }

    function updatePos() {
        if (game.humanDrag.human !== human)
            return

        let pos = game.humanDrag.pointerPosOnGround
        if (pos)
            human.setPos(pos)
    }

    game.humanDrag.onAfterDraggingStatusChangeObservable.add(status => {
        if (status === 'draggingStart')
            updatePos()
    })

    game.humanDrag.onDraggingPointerMoveObservable.add(() => {
        updatePos()
    })

    game.humanDrag.onBeforeDraggingStatusChangeObservable.add(status => {
        if (status === 'draggingEnd') {
            putIntoRegion()
        }
    })

    game.onAfterBankChangeObservable.add(eventData => {
        updateByRegionActive()
    })

    return human
}


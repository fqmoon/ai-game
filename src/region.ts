import {DragController} from "./drag";
import * as BABYLON from "babylonjs"
import {createSlotManager} from "./slot";
import {Human} from "./human";

export interface PutEventData {
    draggingObj?: BABYLON.AbstractMesh
    regionPut: boolean
}

/**
 * 主导用户交互，包括以颜色提示放置区域
 */
export function createRegion({scene, position, width, height,}: {
    scene: BABYLON.Scene, position: BABYLON.Vector3, width: number, height: number
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

    let slotManagers = {
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

    let onPutObservable = new BABYLON.Observable<PutEventData>()

    function isPick() {
        let res = scene.pick(scene.pointerX, scene.pointerY, m => m === mesh)
        return res?.hit
    }

    return {
        mesh,
        onPutObservable,
        putHuman(human: Human, originPos: BABYLON.Vector3) {
            if (isPick()) {
                let res = slotManagers[human.identity].put()
                if (res) {
                    human.mesh.position.x = res.planePos[0]
                    human.mesh.position.y = originPos.y
                    human.mesh.position.z = res.planePos[1]
                }

                return true
            }
            return false
        },
        updateColorByDrag(dragging: boolean) {
            if (!dragging) {
                material.diffuseColor.copyFrom(originColor)
            } else if (isPick()) {
                material.diffuseColor.copyFrom(selectedColor)
            } else {
                material.diffuseColor.copyFrom(promoteColor)
            }
        },
    }
}

export type Region = ReturnType<typeof createRegion>

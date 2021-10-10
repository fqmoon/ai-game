import {DragController} from "./drag";
import {Ground} from "./ground";
import * as BABYLON from "babylonjs"

export function createRegion({scene, position}: { scene: BABYLON.Scene, position: BABYLON.Vector3 }) {
    let mesh = BABYLON.MeshBuilder.CreatePlane("region", {
        width: 10,
        height: 20,
    }, scene)
    mesh.position = position
    let material = new BABYLON.StandardMaterial("", scene)
    mesh.material = material
    mesh.rotation.x = Math.PI * 0.5
    let originColor = new BABYLON.Color3(0.7, 0.5, 0.5)
    let promoteColor = new BABYLON.Color3(0.0, 0.5, 1.0)
    let selectedColor = new BABYLON.Color3(0.0, 1.0, 0.5)
    material.diffuseColor.copyFrom(originColor)

    return {
        mesh,
        // 监听拖拽然后变色
        listenToDrag: ({dragController}: { dragController: DragController }) => {
            function setColor() {
                let res = scene.pick(scene.pointerX, scene.pointerY, m => m === mesh)
                if (res?.hit) {
                    material.diffuseColor.copyFrom(selectedColor)
                } else {
                    material.diffuseColor.copyFrom(promoteColor)
                }
            }

            // 变色
            dragController.onDragStartObservable.add(({draggingObj, pointerInfo}) => {
                setColor()
            })
            // 变回原来的颜色
            dragController.onDragEndObservable.add(({draggingObj, pointerInfo}) => {
                material.diffuseColor.copyFrom(originColor)
            })
            // 变色
            dragController.onDragMoveObservable.add(({draggingObj, pointerInfo}) => {
                setColor()
            })
        },
        // TODO 另外有一个放置位置的系统，其可以引导物体放置位置
    }
}

export type Region = ReturnType<typeof createRegion>

import * as BABYLON from "babylonjs";
import {DragController} from "./drag";
import {Ground} from "./ground";

export function createHuman({scene}: { scene: BABYLON.Scene }) {
    function createBox() {
        const box = BABYLON.MeshBuilder.CreateBox("box", {
            width: 1,
            height: 1,
            depth: 1,
        });
        box.position = new BABYLON.Vector3(0, 0.5, 0)
        let boxMat = new BABYLON.StandardMaterial("boxMat", scene)
        boxMat.diffuseColor = new BABYLON.Color3(1, 0, 0)
        box.material = boxMat
        return box
    }

    let mesh = createBox()

    return {
        mesh,
        listenToDrag: ({dragController, ground}: { dragController: DragController, ground: Ground }) => {
            dragController.toDrags.add(mesh)
            let originPos = new BABYLON.Vector3()
            dragController.onDragStartObservable.add(({draggingObj, pointerInfo}) => {
                if (draggingObj == mesh) {
                    originPos.copyFrom(mesh.position)
                }
            })
            dragController.onDragEndObservable.add(({draggingObj, pointerInfo}) => {
                if (draggingObj == mesh) {
                    mesh.position = originPos
                }
            })
            dragController.onDragMoveObservable.add(({draggingObj, pointerInfo}) => {
                if (draggingObj == mesh) {
                    let pos = ground.getGroundPosition()
                    if (pos) {
                        draggingObj.position = pos
                        draggingObj.position.y += 3
                    }
                }
            })
        }
    }
}

export type Human = ReturnType<typeof createHuman>

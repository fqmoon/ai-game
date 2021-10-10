import * as BABYLON from "babylonjs";

export interface Human {
    mesh: BABYLON.AbstractMesh
}

export function createHuman({scene}: { scene: BABYLON.Scene }): Human {
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

    return {
        mesh: createBox(),
    }
}


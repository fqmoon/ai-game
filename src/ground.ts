import * as BABYLON from "babylonjs";
import {Game} from "./game";

export function createGround({scene, game}: {
    scene: BABYLON.Scene, game: Game
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

    let ground = {
        mesh,
        getGroundPosition: getPointerPositionOnGround,
    }

    return ground
}

export type Ground = ReturnType<typeof createGround>

import * as BABYLON from "babylonjs";
import {Game} from "./game";

// TODO 改名，改为draggingMesh什么的
export function createGround({scene, game}: {
    scene: BABYLON.Scene, game: Game
}) {
    let mesh = BABYLON.MeshBuilder.CreateGround("ground", {
        width: 30,
        height: 20,
    }, scene)
    // 隐藏，因为它只作为拖动计算点位用
    mesh.visibility = 0
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

import {BeforeBoatLeaveEventType, GameEvents, GameStatus} from "./game";
import {Region} from "./region";
import {Human} from "./human";
import * as BABYLON from "babylonjs";

export const BeforeHumanArriveBankType = "BeforeHumanArriveBank"

export interface BeforeHumanArriveBank {
    type: typeof BeforeHumanArriveBankType
}

// 游戏失败
function gameOver() {

}

// 游戏过关
function gamePass() {

}

// 游戏继续
function gameContinue() {

}

export function createRules({gameStatus, gameEvents, scene, boat, humans}: {
    gameEvents: GameEvents, gameStatus: GameStatus, scene: BABYLON.Scene, boat: Region, humans: Iterable<Human>
}) {
    let frameSpeed = 60

    let humanAnims = new Map<Human, BABYLON.Animation>()

    function putHumanToRegionAndGetPositions(human: Human, region: Region) {
        let srcPos = human.mesh.position.clone()
        if (!region.putHuman(human))
            throw Error("put human failed")
        let dstPos = human.mesh.position.clone()
        return {
            srcPos,
            dstPos,
        }
    }

    function createAnimations() {
        humanAnims.clear()

        let targetRegion: Region | undefined
        for (const tr of gameStatus.humanDrag.targetRegions) {
            if (tr !== boat)
                targetRegion = tr
        }
        if (!targetRegion)
            throw Error("Not found targetRegion")

        for (const human of humans) {
            if (human.region === boat) {
                let {srcPos, dstPos} = putHumanToRegionAndGetPositions(human, targetRegion)
                setHumanAnim(human, srcPos, dstPos)
            }
        }
    }

    function setHumanAnim(human: Human, srcPos: BABYLON.Vector3, dstPos: BABYLON.Vector3) {
        let anim = new BABYLON.Animation("humanGoBank", "position", frameSpeed,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3)

        let height = 3

        // 设置keys，先抬起，再前行
        // TODO 写成easy
        // TODO 高度和平移分开
        anim.setKeys([
            {
                frame: 0,
                value: BABYLON.Vector3.FromArray([srcPos.x, srcPos.y, srcPos.z]),
            },
            {
                frame: 10,
                value: BABYLON.Vector3.FromArray([srcPos.x, srcPos.y + height, srcPos.z]),
            },
            {
                frame: 50,
                value: BABYLON.Vector3.FromArray([dstPos.x, dstPos.y + height, dstPos.z]),
            },
            {
                frame: 60,
                value: BABYLON.Vector3.FromArray([dstPos.x, dstPos.y, dstPos.z]),
            },
        ])

        humanAnims.set(human, anim)
    }

    function beginAnimations() {
        for (const [human, anim] of humanAnims.entries()) {
            scene.beginDirectAnimation(human.mesh, [anim], 0, 600, false)
        }
    }

    gameEvents.add((eventData, eventState) => {
        if (eventData.type === BeforeBoatLeaveEventType) {
            createAnimations()
            beginAnimations()
            // TODO 这个事件并不是在动画结束后才播放的，需要写成异步才是
            gameEvents.notifyObservers({
                type: BeforeHumanArriveBankType,
            })
        }
    })
}
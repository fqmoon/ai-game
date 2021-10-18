import {BeforeBoatLeaveEventType, Game, GameEvents, GameStatus} from "./game";
import {Region} from "./region";
import {Human} from "./human";
import * as BABYLON from "babylonjs";

export const BeforeHumanArriveBankType = "BeforeHumanArriveBank"
export const AfterHumanArriveBankType = "AfterHumanArriveBank"

export interface BeforeHumanArriveBank {
    type: typeof BeforeHumanArriveBankType
}

export interface AfterHumanArriveBank {
    type: typeof AfterHumanArriveBankType
}

function getMissionaries(humans: Iterable<Human>) {
    let rt = []
    for (const human of humans) {
        if (human.identity === 'missionary')
            rt.push(human)
    }
    return rt
}

function getCannibals(humans: Iterable<Human>) {
    let rt = []
    for (const human of humans) {
        if (human.identity === 'cannibal')
            rt.push(human)
    }
    return rt
}

function checkGameStatus(gameStatus: GameStatus, gamePassRegion: Region, humans: Iterable<Human>) {
    let toCheckHumans = getRegionHumans(gamePassRegion, humans)
    let missionaries = getMissionaries(toCheckHumans)
    let cannibals = getCannibals(toCheckHumans)

    let humanCount = 0
    for (const human of humans) {
        humanCount++
    }

    // TODO
    if (toCheckHumans.length === humanCount) { // game pass
        console.log('game pass')
    } else if (cannibals.length > missionaries.length) { // game over
        console.log('game over')
    } else { // game continue
        console.log('game continue')
    }
}

function getRegionHumans(region: Region, humans: Iterable<Human>) {
    let bankHumans = []
    for (const human of humans) {
        if (human.region === region) {
            bankHumans.push(human)
        }
    }
    return bankHumans
}

export function createRules({gameStatus, gameEvents, scene, boat, humans, gamePassRegion}: {
    gameEvents: GameEvents, gameStatus: GameStatus, scene: BABYLON.Scene, boat: Region, humans: Iterable<Human>,
    gamePassRegion: Region,
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

        let dstRegion = gameStatus.getDstRegion()
        let bankHumans = getRegionHumans(boat, humans)
        bankHumans.forEach(human => {
            let {srcPos, dstPos} = putHumanToRegionAndGetPositions(human, dstRegion)
            createHumanAnimation(human, srcPos, dstPos)
        })
    }

    function createHumanAnimation(human: Human, srcPos: BABYLON.Vector3, dstPos: BABYLON.Vector3) {
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

    async function beginAnimations() {
        let promises = []
        for (const [human, anim] of humanAnims.entries()) {
            let control = scene.beginDirectAnimation(human.mesh, [anim], 0, 600, false)
            let promise = new Promise<null>((resolve, reject) => {
                control.onAnimationEndObservable.add(() => {
                    resolve(null)
                })
            })
            promises.push(promise)
        }
        return Promise.all(promises)
    }

    gameEvents.add(async (eventData, eventState) => {
        if (eventData.type === BeforeBoatLeaveEventType) {
            createAnimations()
            // TODO 这个事件并不是在动画结束后才播放的，需要写成异步才是
            gameEvents.notifyObservers({
                type: BeforeHumanArriveBankType,
            })
            await beginAnimations()
            gameEvents.notifyObservers({
                type: AfterHumanArriveBankType,
            })
            checkGameStatus(gameStatus, gamePassRegion, humans)
        }
    })
}
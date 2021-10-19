import {BoatLeaveReadyType, Game, GameEvents, GameStatus} from "./game";
import {Region} from "./region";
import {Human} from "./human";
import * as BABYLON from "babylonjs";

export const BeforeHumanArriveBankType = "BeforeHumanArriveBank"
export const AfterHumanArriveBankType = "AfterHumanArriveBank"
export const GameOverType = "GameOver"
export const GamePassType = "GamePass"

export interface BeforeHumanArriveBank {
    type: typeof BeforeHumanArriveBankType
}

export interface AfterHumanArriveBank {
    type: typeof AfterHumanArriveBankType
}

export interface GameOver {
    type: typeof GameOverType
}

export interface GamePass {
    type: typeof GamePassType
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

function checkLeftRegion(region: Region, humans: Iterable<Human>, gameEvents: GameEvents) {
    let toCheckHumans = getRegionHumans(region, humans)
    let missionaries = getMissionaries(toCheckHumans)
    let cannibals = getCannibals(toCheckHumans)
    if (cannibals.length > missionaries.length && missionaries.length > 0) {
        gameEvents.notifyObservers({
            type: GameOverType,
        })
    }
}

function checkRightRegion(region: Region, humans: Iterable<Human>, gameEvents: GameEvents) {
    let toCheckHumans = getRegionHumans(region, humans)
    let missionaries = getMissionaries(toCheckHumans)
    let cannibals = getCannibals(toCheckHumans)

    let humanCount = 0
    for (const human of humans) {
        humanCount++
    }

    if (cannibals.length > missionaries.length && missionaries.length > 0) {
        gameEvents.notifyObservers({
            type: GameOverType,
        })
    } else if (toCheckHumans.length === humanCount) {
        gameEvents.notifyObservers({
            type: GamePassType,
        })
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

export function createRules({gameStatus, gameEvents, scene, boat, humans, leftBank, rightBank}: {
    gameEvents: GameEvents, gameStatus: GameStatus, scene: BABYLON.Scene, boat: Region, humans: Iterable<Human>,
    leftBank: Region, rightBank: Region,
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
        if (eventData.type === BoatLeaveReadyType) {
            checkLeftRegion(leftBank, humans, gameEvents)
            checkRightRegion(rightBank, humans, gameEvents)

            createAnimations()
            gameEvents.notifyObservers({
                type: BeforeHumanArriveBankType,
            })
            await beginAnimations()

            gameEvents.notifyObservers({
                type: AfterHumanArriveBankType,
            })

            checkLeftRegion(leftBank, humans, gameEvents)
            checkRightRegion(rightBank, humans, gameEvents)
        }
    })
}
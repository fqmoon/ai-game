import {BoatLeaveReadyType, Game, GameMsg} from "./game";
import {Region} from "./region";
import {Human} from "./human";
import * as BABYLON from "babylonjs";

export const BeforeHumanArriveBankType = "BeforeHumanArriveBank"
export const AfterHumanArriveBankType = "AfterHumanArriveBank"
export const GamePassType = "GamePass"

export interface BeforeHumanArriveBank {
    type: typeof BeforeHumanArriveBankType
}

export interface AfterHumanArriveBank {
    type: typeof AfterHumanArriveBankType
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

function checkLeftRegion(region: Region, humans: Iterable<Human>, game: Game) {
    let toCheckHumans = getRegionHumans(region, humans)
    let missionaries = getMissionaries(toCheckHumans)
    let cannibals = getCannibals(toCheckHumans)
    if (cannibals.length > missionaries.length && missionaries.length > 0) {
        game.status = "failed"
    }
}

function checkRightRegion(region: Region, humans: Iterable<Human>, game: Game) {
    let toCheckHumans = getRegionHumans(region, humans)
    let missionaries = getMissionaries(toCheckHumans)
    let cannibals = getCannibals(toCheckHumans)

    let humanCount = 0
    for (const human of humans) {
        humanCount++
    }

    if (cannibals.length > missionaries.length && missionaries.length > 0) {
        game.status = "failed"
    } else if (toCheckHumans.length === humanCount) {
        game.status = "pass"
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

export function createRules({game, scene, boat, humans, leftBank, rightBank}: {
    game: Game, scene: BABYLON.Scene, boat: Region, humans: Iterable<Human>,
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

        let dstRegion = game.getDstRegion()
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

    game.msg.add(async (eventData, eventState) => {
        if (eventData.type === BoatLeaveReadyType) {
            checkLeftRegion(leftBank, humans, game)
            checkRightRegion(rightBank, humans, game)

            if (game.status === "continue") {
                createAnimations()
                game.msg.notifyObservers({
                    type: BeforeHumanArriveBankType,
                })
                await beginAnimations()

                game.msg.notifyObservers({
                    type: AfterHumanArriveBankType,
                })

                checkLeftRegion(leftBank, humans, game)
                checkRightRegion(rightBank, humans, game)
            }
        }
    })
}
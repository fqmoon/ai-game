import {Game} from "./game";
import {Region} from "./region";
import {Human} from "./human";
import * as BABYLON from "babylonjs";

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
    function checkBanks() {
        checkLeftRegion(leftBank, humans, game)
        checkRightRegion(rightBank, humans, game)
    }

    game.onAfterNextRegionChangeObservable.add(async () => {
        checkBanks()

        if (game.status === "continue") {
            // TODO 不应该由rule管理。应该是game主动操作的
            await game.animations.boatGo.play()
            checkBanks()
        }
    })
}
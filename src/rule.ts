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
        return false
    }
    return true
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
        return false
    } else if (toCheckHumans.length === humanCount) {
        game.status = "pass"
        return false
    }
    return true
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

export function createRules({game, humans, leftBank, rightBank}: {
    game: Game, humans: Iterable<Human>,
    leftBank: Region, rightBank: Region,
}) {
    function checkBanks() {
        checkLeftRegion(leftBank, humans, game) && checkRightRegion(rightBank, humans, game)
    }

    game.onAfterBankChangeObservable.add(() => {
        checkBanks()
    })
    game.onAfterBoatGoObservable.add(() => {
        checkBanks()
    })
}
import {Region} from "./region";
import {Game} from "./game";
import {Operation} from "./ai";
import * as BABYLON from "babylonjs";
import {Human} from "./human";

export class Step {
    from: Region
    to: Region
    m: number
    c: number

    constructor(from: Region, to: Region, m: number, c: number) {
        this.from = from
        this.to = to
        this.m = m
        this.c = c
    }

    static equal(a: Step, b: Step) {
        return a.from === b.from && a.to === b.to && a.m === b.m && a.c === b.c
    }

    getReverse() {
        return new Step(this.to, this.from, this.m, this.c)
    }
}

export class StepInfo {
    _steps = [] as Step[]

    putStep(step: Step) {
        this._steps.push(step)
    }

    popStep() {
        return this._steps.pop()
    }

    findStep(step: Step) {
        for (let i = 0; i < this._steps.length; i++) {
            const step_ = this._steps[i];
            if (Step.equal(step, step_))
                return i
        }
        return -1
    }

    get lastStep() {
        return this._steps[this.length - 1]
    }

    get length() {
        return this._steps.length
    }

    [Symbol.iterator]() {
        return this._steps[Symbol.iterator]()
    }
}

export class StepLogger {
    _stepInfo = new StepInfo()
    onAfterStepInfoChangeObservable = new BABYLON.Observable<StepInfo>()

    constructor(game: Game) {
        let from: Region
        let to: Region
        game.onBeforeBoatGoObservable.add(() => {
            from = game.curBank
            to = game.nextBank

            let m = 0, c = 0
            for (const human of game.boat.humans) {
                if (human.identity === 'missionary')
                    m += 1
                else if (human.identity === 'cannibal')
                    c += 1
                else
                    throw Error()
            }
            let step = new Step(from, to, m, c)
            this._stepInfo.putStep(step)

            this.onAfterStepInfoChangeObservable.notifyObservers(this._stepInfo)
        })
    }

    reverseLastStep() {
        // TODO 撤销上一步功能
    }


}

function operationToStep(game: Game, operation: Operation) {
    return new Step(game.curBank, game.nextBank, operation.m, operation.c)
}

export function operationsToStepInfo(game: Game, operations: Operation[]) {
    let stepInfo = new StepInfo()
    for (const operation of operations) {
        stepInfo.putStep(operationToStep(game, operation))
    }
    return stepInfo
}

export class StepLoader {
    _game: Game

    constructor(game: Game) {
        this._game = game
    }

    async loadStep(step: Step) {
        let cmd = createStepCmd(this._game, step)
        await cmd()
    }

    async loadStepInfo(stepInfo: StepInfo, restart = true) {
        if (restart) {
            this._game.restart()
        }

        for (const step of stepInfo) {
            await this.loadStep(step)
        }
    }
}

// 创建step移动的命令
function createStepCmd(game: Game, step: Step) {
    if (game.curBank.missionaryCount < step.m
        || game.curBank.cannibalCount < step.c) {
        throw Error("非法操作")
    }

    return async () => {
        let anims = createBankToBoatAnims(game, step)
        let promises = []
        let controls = []
        // 等待所有上船动画播放完毕
        for (const [human, anim] of anims.entries()) {
            let control = game.scene.beginDirectAnimation(human.mesh, [anim], 0, 600, false)
            controls.push(control)
            let promise = new Promise<null>((resolve, reject) => {
                control.onAnimationEndObservable.add(() => {
                    resolve(null)
                })
            })
            promises.push(promise)
        }
        await Promise.all(promises)

        for (const human of anims.keys()) {
            game.boat.putHuman(human)
        }

        await game.boatGo()
    }
}

function createBankToBoatAnims(game: Game, step: Step) {
    let anims = new Map<Human, BABYLON.Animation>()
    let humanIndex = 0
    for (let i = 0; i < step.m; i++) {
        let human = game.curBank.missionaries[i]
        anims.set(human, createPutAnimation(human, humanIndex++, game.boat))
    }
    for (let i = 0; i < step.c; i++) {
        let human = game.curBank.cannibals[i]
        anims.set(human, createPutAnimation(human, humanIndex++, game.boat))
    }
    return anims
}

const frameSpeed = 60

function createPutAnimation(human: Human, humanIndex: number, to: Region) {
    let anim = new BABYLON.Animation("human put to region", "position", frameSpeed,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3)

    let slotManager = to.findPutSlotManager(human)
    if (!slotManager) {
        throw Error()
    }

    let slotPos = slotManager.findVacantSlot(humanIndex)
    if (!slotPos) {
        throw Error()
    }
    let planePos = slotManager.slotPosToPlanePos(slotPos)
    let dstPos = human.getPosByPlanePos(planePos)

    let srcPos = human.mesh.position.clone()

    let height = human.dragYOff
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

    return anim
}

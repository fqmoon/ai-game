import {Region} from "./region";
import {Game} from "./game";

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

function operationsToStepInfo() {
//TODO
}

class StepLoader {
    // _game: Game

    loadStep(step: Step) {

    }

    loadStepInfo(stepInfo: StepInfo, restart = true) {
        if (restart){

        }
    }
}
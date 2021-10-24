class State {
    m: number
    c: number
    b: 0 | 1

    static max: number

    constructor(m: number, c: number, b: 0 | 1) {
        this.m = m
        this.c = c
        this.b = b
    }

    get valid() {
        let that = this

        function leftValid() {
            let m = that.m
            let c = that.c
            return m === 0 || c === 0 || m >= c
        }

        function rightValid() {
            let m = State.max - that.m
            let c = State.max - that.c
            return m === 0 || c === 0 || m >= c
        }

        // 合法性
        return this.m >= 0 && this.m <= State.max
            && this.c >= 0 && this.c <= State.max
            && (this.b === 0 || this.b === 1)
            // 符合MC问题的有效状态
            && leftValid() && rightValid()
    }

    static equal(a: State, b: State) {
        return a.m === b.m
            && a.c === b.c
            && a.b === b.b
    }

    clone(state?: State) {
        if (!state)
            state = new State(0, 0, 0)
        state.m = this.m
        state.c = this.c
        state.b = this.b
        return state
    }
}

State.max = 3

class Operation {
    m: number
    c: number

    constructor(m: number, c: number) {
        this.m = m
        this.c = c
    }

    apply(state: State) {
        let copy = state.clone()

        if (copy.b === 0) {
            copy.m -= this.m
            copy.c -= this.c
            copy.b = 1
        } else if (copy.b === 1) {
            copy.m += this.m
            copy.c += this.c
            copy.b = 0
        } else {
            throw Error()
        }

        if (!copy.valid)
            return false
        copy.clone(state)
        return state
    }
}

function createOperations(boatCapacity: number) {
    let rt = [] as Operation[]
    let i = 0
    while (i <= boatCapacity) {
        let j = 0
        while (i + j <= boatCapacity) {
            if (i + j !== 0)
                rt.push(new Operation(i, j))
            j++
        }
        i++
    }
    return rt
}

export class AI {
    _initState: State
    _ops: Operation[]
    _targetState: State

    constructor(m: number, c: number, boatCapacity: number) {
        this._initState = new State(m, m, 0)
        this._ops = createOperations(boatCapacity)
        this._targetState = new State(0, 0, 1)
    }

    _indexOfState(state: State, states: State[]) {
        for (let i = 0; i < states.length; i++) {
            let s = states[i]
            if (State.equal(s, state)) {
                return i
            }
        }
        return -1
    }

    run() {
        let that = this

        function oneStep(state: State, states: State[], op: Operation, ops: Operation[], opLogging: Operation[]): {
            states: State[],
            operations: Operation[],
        } | boolean {
            if (State.equal(state, that._targetState)) {
                states.push(state)
                return {
                    states,
                    operations: opLogging,
                }
            } else if (that._indexOfState(state, states) >= 0) {
                return false
            }

            states.push(state)

            state = state.clone()
            if (op.apply(state)) {
                // clone opLogging
                opLogging = Array.from(opLogging)
                opLogging.push(op)
                for (const op_ of ops) {
                    let res = oneStep(state, Array.from(states), op_, ops, opLogging)
                    if (res)
                        return res
                }
            }
            return false
        }

        for (const op of this._ops) {
            let states = [] as State[]
            let state = this._initState.clone()
            let opLogging = [] as Operation[]
            let res = oneStep(state, states, op, this._ops, opLogging)
            if (res)
                return res
        }

        return false
    }
}

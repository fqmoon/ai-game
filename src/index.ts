import {createGame} from "./game";
import {AI, operationsToString, stringToOperations} from "./ai"
import {operationsToStepInfo} from "./step";

async function main() {
    let game = await createGame()

    let ai = new AI(3, 3, 2)

    let res = ai.run()

    if (res) {
        let str = operationsToString(res.operations)
        console.log(str)

        console.log(stringToOperations(str))
        //@ts-ignore
        window.f = stringToOperations

        let stepInfo = operationsToStepInfo(game, res.operations)

        // await StepAnimation.fromStepInfo(game, stepInfo)

        // @ts-ignore
        await game.stepLoader.loadStepInfo(stepInfo);
    }
}

main()
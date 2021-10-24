import {createGame} from "./game";
import {AI} from "./ai"

let game = createGame()


let ai = new AI(3, 3, 2)

console.log(ai.run())
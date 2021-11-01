import {createGame} from "./game";
import {AI} from "./ai"

async function main() {
    let game = await createGame()

    // 这个是AI算法
    let ai = new AI(3, 3, 2)
}

main()
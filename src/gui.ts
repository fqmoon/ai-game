import * as BABYLON from "babylonjs";
import {GameEvents, GameStatus} from "./game";
import * as $ from "jquery"

export const BoatLeaveEventType = "BoatLeaveEvent"

export interface BoatLeaveEvent {
    type: typeof BoatLeaveEventType
}

// 开船按钮
function createBoatLeaveButton({gameStatus, gameEvents}: {
    gameEvents: GameEvents, gameStatus: GameStatus,
}) {
    let button = $.parseHTML(`<button style="position: absolute;bottom: 0;margin: 1em; left: 50%;transform: translateX(-50%)">开船</button>`)[0] as HTMLButtonElement

    // 通知开船
    button.onclick = ev => {
        gameEvents.notifyObservers({
            type: BoatLeaveEventType,
        })
    }

    return button
}

export function createGUI({gameStatus, gameEvents}: {
    gameEvents: GameEvents, gameStatus: GameStatus,
}) {
    let guiDiv = document.getElementById("gui") as HTMLDivElement
    guiDiv.style.backgroundColor = "transparent"
    guiDiv.append(createBoatLeaveButton({gameStatus, gameEvents}))
    return {
        rootDiv: guiDiv,
    }
}

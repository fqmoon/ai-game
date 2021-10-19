import {GameEvents, GameStatus} from "./game";
import * as $ from "jquery"
import {Human, HumanDragAfterEndEventType} from "./human";
import {Region} from "./region";
import {AfterHumanArriveBankType, BeforeHumanArriveBankType} from "./rule";

export const BoatLeaveButtonClickEventType = "BoatLeaveEvent"

export interface BoatLeaveButtonClickEvent {
    type: typeof BoatLeaveButtonClickEventType
}

// 开船按钮
function createBoatLeaveButton({gameStatus, gameEvents, boat, humans}: {
    gameEvents: GameEvents, gameStatus: GameStatus, boat: Region, humans: Iterable<Human>,
}) {
    let button = $.parseHTML(`<button 
            disabled
            style="position: absolute;bottom: 0;margin: 1em; left: 50%;transform: translateX(-50%)"
        >开船</button>`)[0] as HTMLButtonElement

    // 在拖拽后和human到达岸之前与之后检测boat的human数量，以控制能否开船
    gameEvents.add(((eventData, eventState) => {
        if (eventData.type !== HumanDragAfterEndEventType
            && eventData.type !== BeforeHumanArriveBankType
            && eventData.type !== AfterHumanArriveBankType)
            return

        let count = 0
        for (const human of humans) {
            if (human.region === boat)
                count++
        }
        button.disabled = count === 0
    }))

    // 通知开船
    button.onclick = ev => {
        gameEvents.notifyObservers({
            type: BoatLeaveButtonClickEventType,
        })
    }

    return button
}

export function createGUI({gameStatus, gameEvents, boat, humans}: {
    gameEvents: GameEvents, gameStatus: GameStatus, boat: Region, humans: Iterable<Human>,
}) {
    let guiDiv = document.getElementById("gui") as HTMLDivElement
    guiDiv.style.backgroundColor = "transparent"
    guiDiv.append(createBoatLeaveButton({gameStatus, gameEvents, boat, humans}))
    return {
        rootDiv: guiDiv,
    }
}

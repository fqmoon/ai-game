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

function createGameOver({gameStatus, gameEvents, boat, humans}: {
    gameEvents: GameEvents, gameStatus: GameStatus, boat: Region, humans: Iterable<Human>,
}) {
    // 这个div是全屏的阻止用户点击相关事件
    let div = $.parseHTML(`<div 
            style="position: absolute;width: 100%; height:100%;"
        >
            <div class="background-ui">
                <div class="button-container">
                    <button id="restart">重来</button>
                </div>
            </div>
        </div>`)[0] as HTMLDivElement
    return div
}

function injectCss(){
    $('head').append(`<style type="text/css">
        div{
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            position: absolute;
        }
        .background-ui{
            margin: 15%;
        }
        #restart{
            left: 1em;
            bottom: 1em;
            position: absolute;
        }
    </style>`)
}

export function createGUI({gameStatus, gameEvents, boat, humans}: {
    gameEvents: GameEvents, gameStatus: GameStatus, boat: Region, humans: Iterable<Human>,
}) {
    injectCss()

    let guiDiv = document.getElementById("gui") as HTMLDivElement
    guiDiv.style.backgroundColor = "transparent"
    guiDiv.append(createBoatLeaveButton({gameStatus, gameEvents, boat, humans}))
    guiDiv.append(createGameOver({gameStatus, gameEvents, boat, humans}))

    return {
        rootDiv: guiDiv,
    }
}

import {Game} from "./game";
import * as $ from "jquery"
import {Human} from "./human";
import {Region} from "./region";

// 开船按钮
function createBoatLeaveButton({game, boat, humans}: {
    game: Game, boat: Region, humans: Iterable<Human>,
}) {
    let button = $.parseHTML(`<button 
            disabled
            style="position: absolute;bottom: 0;margin: 1em; left: 50%;transform: translateX(-50%)"
        >开船</button>`)[0] as HTMLButtonElement

    function setButtonStatus(humanCountOnBoat: number) {
        button.disabled = humanCountOnBoat === 0
    }

    game.boat.onAfterHumanCountChangeObservable.add(humanCount => {
        setButtonStatus(humanCount)
    })

    // 通知开船
    button.onclick = ev => {
        game.boatGo()
    }

    return button
}

function createGameFailed() {
    let div = $.parseHTML(`<div class="model-div">
            <div class="background-ui">
                <div class="button-container">
                    <button class="restart-button">重来</button>
                </div>
            </div>
        </div>`)[0] as HTMLDivElement
    return div
}

function createGamePass() {
    let div = $.parseHTML(`<div class="model-div">
            <div class="background-ui">
                <div class="button-container">
                    <button class="home-button">回到主菜单</button>
                </div>
            </div>
        </div>`)[0] as HTMLDivElement
    return div
}

function pushStepInfo(game: Game, parent: HTMLElement) {
    parent.append(
        $(`<div class="step-info">
            <h1 id="step-count"></h1>
        </div>`)[0])

    let pick = $("#step-count")[0]
    game.onAfterRestartObservable.add(() => {
        pick.innerText = "0步"
    })
    game.stepController.onAfterStepInfoChangeObservable.add(stepInfo => {
        pick.innerText = stepInfo.length + "步"
    })
}

export function createGUI({game, boat, humans}: {
    game: Game, boat: Region, humans: Iterable<Human>,
}) {
    let guiDiv = $("#gui")[0]
    guiDiv.style.backgroundColor = "transparent"
    guiDiv.append(createBoatLeaveButton({game, boat, humans}))

    let gameFailedUi = createGameFailed()
    let gamePassUi = createGamePass()
    guiDiv.append(gameFailedUi)
    guiDiv.append(gamePassUi)

    pushStepInfo(game, guiDiv)

    let gui = {
        rootDiv: guiDiv,
        set gameFailedShow(v: boolean) {
            if (v)
                gameFailedUi.style.display = 'block'
            else
                gameFailedUi.style.display = 'none'
        },
        set gamePassUiShow(v: boolean) {
            if (v)
                gamePassUi.style.display = 'block'
            else
                gamePassUi.style.display = 'none'
        },
    }

    gui.gameFailedShow = false
    gui.gamePassUiShow = false

    game.onAfterStatusChangeObservable.add(status => {
        if (status.to === "failed") {
            gui.gameFailedShow = true
            gui.gamePassUiShow = false
        } else if (status.to === "pass") {
            gui.gameFailedShow = false
            gui.gamePassUiShow = true
        } else {
            gui.gameFailedShow = false
            gui.gamePassUiShow = false
        }
    })

    let restartButtons = $(".restart-button")
    for (const restartButton of restartButtons) {
        restartButton.onclick = ev => {
            game.restart()
        }
    }

    return gui
}

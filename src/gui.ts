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

function createGameMain() {
    let div = $.parseHTML(`<div class="model-div">
            <div class="game-main-ui">
                <h1 style="color: white;text-align: center">MC问题交互性演示</h1>
                <div>
                    <h2>选择模式</h2>
                    <input type="radio" id="game-type" name="game-type" value="game-type" checked>
                    <label for="game-type">游戏模式</label>
                    <input type="radio" id="show-type" name="game-type" value="show-type">
                    <label for="show-type">演示模式</label>
                    <label id="path-textarea">输入路径信息：</label>
                    <textarea></textarea>
                </div>
                <button class="start-button">开始</button>
            </div>
        </div>`)[0] as HTMLDivElement
    return div
}

function createGameFailed() {
    let div = $.parseHTML(`<div class="model-div">
            <div class="background-ui">
                <h1 style="color: white;text-align: center">游戏失败！</h1>
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
                <h1 style="color: white;text-align: center">游戏通关！</h1>
                <div class="button-container">
<!--                    TODO 现在还没有这个功能 -->
<!--                    <button class="home-button">回到主菜单</button>-->
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
    game.stepLogger.onAfterStepInfoChangeObservable.add(stepInfo => {
        pick.innerText = stepInfo.length + "步"
    })
}

function pushGameRestartButton(parent: HTMLElement) {
    parent.append($(`<button class="restart-button lu-restart-button"><img src="restart.svg"></button>`)[0])
}

export function createGUI({game, boat, humans}: {
    game: Game, boat: Region, humans: Iterable<Human>,
}) {
    let guiDiv = $("#gui")[0]
    guiDiv.style.backgroundColor = "transparent"
    guiDiv.append(createBoatLeaveButton({game, boat, humans}))
    pushGameRestartButton(guiDiv)

    let gameMainUi = createGameMain()
    let gameFailedUi = createGameFailed()
    let gamePassUi = createGamePass()

    guiDiv.append(gameFailedUi)
    guiDiv.append(gamePassUi)

    pushStepInfo(game, guiDiv)
    // main ui 要在step info ui 之后
    guiDiv.append(gameMainUi)

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

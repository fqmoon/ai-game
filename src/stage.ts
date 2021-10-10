// let game: any = {}
//
// class NoImplementError extends Error {
// }
//
// class StageChangeError extends Error {
// }
//
// let stages = {
//     "leftBank": leftBankStage,
//     "rightBank": rightBankStage,
//     "boatLR": boatLRStage,
//     "boatRL": boatRLStage,
//     "pause": pauseStage,
//     "mainUi": mainUiStage,
//     "gameOver": gameOverStage,
// }
//
// class StageManager2 {
//     stages: Set<AbstractStage>
//
//     _current: AbstractStage
//
//     constructor() {
//         this.stages = stages
//         this._current = leftBankStage
//     }
//
//     set current(v) {
//         this._current = v
//     }
//
//     get current() {
//         return this._current
//     }
// }
//
// abstract class AbstractStage {
//     type: GameStageType
//     lastStage: GameStageType
//
//     change(nextStageType: GameStageType) {
//         switch (nextStageType) {
//             case "leftBank":
//                 this.toLeftBank()
//                 break;
//             case "rightBank":
//                 this.toRightBank()
//                 break;
//             case "boatLR":
//                 this.toBoatLR()
//                 break;
//             case "boatRL":
//                 this.toBoatRL()
//                 break;
//             case "pause":
//                 this.toPause()
//                 break;
//             case "mainUi":
//                 this.toMainUi()
//                 break;
//             case "gameOver":
//                 this.toGameOver()
//                 break;
//             default:
//                 throw new StageChangeError()
//         }
//     }
//
//     abstract enter(): any
//
//     abstract leave(): any
//
//     toLeftBank() {
//         throw new NoImplementError()
//     }
//
//     toRightBank() {
//         throw new NoImplementError()
//     }
//
//     toBoatLR() {
//         throw new NoImplementError()
//     }
//
//     toPause() {
//         throw new NoImplementError()
//     }
//
//     toBoatRL() {
//         throw new NoImplementError()
//     }
//
//     toMainUi() {
//         throw new NoImplementError()
//     }
//
//     toGameOver() {
//         throw new NoImplementError()
//     }
// }
//
// // TODO 用事件简化
//
// class LeftBankStage extends AbstractStage {
//     game: any
//
//     constructor(game) {
//         super()
//         this.game = game
//         this.curStageType = 'leftBank'
//     }
//
//     toBoatLR() {
//         this.game.stage = this.game.stages.boatLR
//     }
//
//     toPause() {
//         this.game.stage = this.game.stages.pause
//     }
//
//     enter(): any {
//         this.game.drag.active = true
//         this.game.drag.src = game.sceneObjs.regions.leftBank
//         this.game.drag.dst = game.sceneObjs.regions.boat
//     }
//
//     leave(): any {
//         game.drag.active = false
//     }
// }
//
// let stage: any = {}
//
type GameStageType =
    'leftBank'
    | 'rightBank'
    | 'boatLR'
    | 'boatRL'
    | 'pause'
    | 'mainUi'
    | 'gameOver'
    | undefined
// let _curStageType: GameStageType = 'leftBank'
//
// function change(nextStageType: GameStageType) {
//     // 暂停
//     if (nextStageType === 'pause') {
//         if (_curStageType === 'leftBank') {
//             stage.drag.src = sceneObjs.regions.leftBank
//             stage.drag.dst = sceneObjs.regions.boat
//         } else if (_curStageType === 'rightBank') {
//             stage.drag.src = sceneObjs.regions.rightBank
//             stage.drag.dst = sceneObjs.regions.boat
//         } else if (
//             _curStageType === 'boatLR'
//         ) {
//             stage.animations.stop()
//         } else if (
//             _curStageType === 'boatRL'
//         ) {
//             stage.animations.stop()
//         } else
//             throw Error("stage change failed")
//
//         lastStageType = _curStageType
//         _curStageType = nextStageType
//         return
//     }
//     // 恢复
//     if (_curStageType === 'pause') {
//         if (nextStageType === undefined || nextStageType === lastStageType) {
//             nextStageType = lastStageType
//             if (nextStageType === 'boatLR') {
//                 stage.animations.resume()
//             } else if (nextStageType === 'boatRL') {
//                 stage.animations.resume()
//             }
//         } else
//             throw Error("stage change failed")
//
//         lastStageType = _curStageType
//         _curStageType = nextStageType
//         return
//     }
//
//     // 转场
//     switch (_curStageType) {
//         case "leftBank":
//             if (nextStageType === undefined || nextStageType === 'boatLR') {
//                 nextStageType = 'boatLR'
//                 stage.animations.play()
//                 stage.drag.active = false
//             } else if (nextStageType === 'mainUi') {
//                 stage.drag.active = false
//                 stage.ui.state = 'main'
//             } else if (nextStageType === 'gameOver') {
//                 stage.drag.active = false
//                 stage.ui.state = 'gameOver'
//             }
//             lastStageType = _curStageType
//             _curStageType = nextStageType
//             break;
//         case "rightBank":
//             if (nextStageType === undefined || nextStageType === 'boatRL') {
//                 nextStageType = 'boatRL'
//                 stage.animations.play()
//                 stage.drag.active = false
//             } else if (nextStageType === 'mainUi') {
//                 stage.drag.active = false
//                 stage.ui.state = 'main'
//             } else if (nextStageType === 'gameOver') {
//                 stage.drag.active = false
//                 stage.ui.state = 'gameOver'
//             }
//             lastStageType = _curStageType
//             _curStageType = nextStageType
//             break;
//         case "boatLR":
//             if (nextStageType === undefined || nextStageType === 'rightBank') {
//                 nextStageType = 'rightBank'
//                 stage.drag.active = true
//             } else if (nextStageType === 'mainUi') {
//                 stage.drag.active = false
//                 stage.ui.state = 'main'
//             } else if (nextStageType === 'gameOver') {
//                 stage.drag.active = false
//                 stage.ui.state = 'gameOver'
//             }
//             lastStageType = _curStageType
//             _curStageType = nextStageType
//             break;
//         case "boatRL":
//             lastStageType = _curStageType
//             _curStageType = nextStageType
//             break;
//         case "mainUi":
//             lastStageType = _curStageType
//             _curStageType = nextStageType
//             break;
//         case "gameOver":
//             lastStageType = _curStageType
//             _curStageType = nextStageType
//             break;
//         default:
//             throw Error("stage change failed")
//     }
// }
//
// let lastStageType: GameStageType
//
// // 空参表示自动选择，有的场景可以自动选择，否则会报错
// function next(nextStage: GameStageType) {
//     switch (_curStageType) {
//         case "leftBank":
//             if (!nextStage)
//                 nextStage = 'boatLR'
//             change(nextStage)
//             break;
//         case "rightBank":
//             if (!nextStage)
//                 nextStage = 'boatRL'
//             change(nextStage)
//             break;
//         case "boatLR":
//             if (!nextStage)
//                 nextStage = 'rightBank'
//             change(nextStage)
//             break;
//         case "boatRL":
//             if (!nextStage)
//                 nextStage = 'leftBank'
//             change(nextStage)
//             break;
//         case "pause":
//             if (!nextStage)
//                 nextStage = lastStageType
//             change(nextStage)
//             break;
//         case "mainUi":
//             break;
//         case "gameOver":
//             break;
//         default:
//             break;
//     }
// }

export interface StageChangeEventData {
    lastStageType: GameStageType
    curStageType: GameStageType
    nextStageType: GameStageType
}

export function createStageManager() {
    let lastStageType: GameStageType
    let curStageType: GameStageType

    let onBeforeStageChangeObservable = new BABYLON.Observable<StageChangeEventData>()

    return {
        onBeforeStageChangeObservable,
        change(nextStageType: GameStageType) {
            if (nextStageType === curStageType)
                return

            onBeforeStageChangeObservable.notifyObservers({
                lastStageType,
                curStageType,
                nextStageType
            })
            lastStageType = curStageType
            curStageType = nextStageType
        },
    }
}

export type StageManager = ReturnType<typeof createStageManager>

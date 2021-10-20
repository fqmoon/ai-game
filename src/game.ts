import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {Human, HumanDragAfterEndEvent, HumanDragBeforeEndEvent, HumanDragMoveEvent, HumanDragStartEvent} from "./human";
import {Region} from "./region";
import {PointerOnGroundEvent} from "./ground";
import {createCamera} from "./camera";
import {
    BoatLeaveButtonClickEvent,
    BoatLeaveButtonClickEventType,
    createGUI,
} from "./gui";
import {AfterHumanArriveBank, BeforeHumanArriveBank, createRules} from "./rule";

export type GameEventData =
    PointerOnGroundEvent
    | HumanDragStartEvent
    | HumanDragBeforeEndEvent
    | HumanDragMoveEvent
    | HumanDragAfterEndEvent
    | BoatLeaveButtonClickEvent
    | BoatLeaveReady
    | BeforeHumanArriveBank
    | AfterHumanArriveBank
export type GameMsg = BABYLON.Observable<GameEventData>

export const BoatLeaveReadyType = "BoatLeaveReady"

export interface BoatLeaveReady {
    type: typeof BoatLeaveReadyType
}

export type GameStatus = "continue" | "failed" | "pass"

export type HumanDrag = {
    active: boolean
    // 拖动起始地。在拖动失败后要将human放回它
    targetRegions: Set<Region>,
    reachedRegion?: Region,
    onDraggingChangedObservable: BABYLON.Observable<boolean>
} & ({
    dragging: true,
    human: Human,
} | {
    dragging: false,
    human: undefined,
})

export interface Game {
    // human拖拽状态信息
    humanDrag: HumanDrag

    boat: Region

    getDstRegion(): Region

    // 分别对应游戏继续、失败、过关
    status: GameStatus

    msg: BABYLON.Observable<GameEventData>
    onNextRegionChangedObservable: BABYLON.Observable<void>
    onStatusChangedObservable: BABYLON.Observable<GameStatus>

    changeNextRegion(): void

    restart(): void
}

export function createGame() {
    // 全局事件处理
    let msg = new BABYLON.Observable() as GameMsg

    function createHumanDrag(): HumanDrag {
        let _dragging = false
        let rt = {
            active: true,
            get dragging() {
                return _dragging
            },
            set dragging(v) {
                if (_dragging !== v) {
                    _dragging = v
                    this.onDraggingChangedObservable.notifyObservers(_dragging)
                }
            },
            human: undefined,
            reachedRegion: undefined,
            targetRegions: new Set(),
            onDraggingChangedObservable: new BABYLON.Observable(),
        }
        // @ts-ignore
        return rt
    }

    let _status = "continue" as GameStatus
    // @ts-ignore
    let game: Game = {
        msg,
        humanDrag: createHumanDrag(),
        getDstRegion() {
            for (const region of this.humanDrag.targetRegions) {
                if (region !== this.boat)
                    return region
            }
            throw Error("find dst region failed")
        },
        get status() {
            return _status
        },
        set status(v) {
            if (_status !== v) {
                _status = v
                this.onStatusChangedObservable.notifyObservers(_status)
            }
        },
        onNextRegionChangedObservable: new BABYLON.Observable(),
        onStatusChangedObservable: new BABYLON.Observable(),
        changeNextRegion() {
            let lastRegion, nextRegion
            if (game.humanDrag.targetRegions.has(regions.leftBank)) {
                lastRegion = regions.leftBank
                nextRegion = regions.rightBank
                game.humanDrag.targetRegions.delete(regions.leftBank)
                game.humanDrag.targetRegions.add(regions.rightBank)
            } else if (game.humanDrag.targetRegions.has(regions.rightBank)) {
                lastRegion = regions.rightBank
                nextRegion = regions.leftBank
                game.humanDrag.targetRegions.delete(regions.rightBank)
                game.humanDrag.targetRegions.add(regions.leftBank)
            } else {
                throw Error("change region failed")
            }

            this.onNextRegionChangedObservable.notifyObservers()
        },
        restart() {
            for (const human of sceneObjs.humans) {
                regions.leftBank.putHuman(human)
            }
            let dragInfo = game.humanDrag
            dragInfo.targetRegions.clear()
            dragInfo.targetRegions.add(regions.leftBank)
            dragInfo.targetRegions.add(regions.boat)
            game.onNextRegionChangedObservable.notifyObservers()
            game.status = "continue"
        },
    }

    let canvas = document.getElementById("game") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)
    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    let scene = new BABYLON.Scene(engine)
    let camera = createCamera({scene, canvas, game: game,})
    let sceneObjs = createSceneObjs({scene, game: game,})
    let gui = createGUI({
        game: game,
        boat: sceneObjs.regions.boat,
        humans: sceneObjs.humans
    })
    game.boat = sceneObjs.regions.boat
    let rules = createRules({
        game: game, boat: sceneObjs.regions.boat, humans: sceneObjs.humans, scene,
        leftBank: sceneObjs.regions.leftBank,
        rightBank: sceneObjs.regions.rightBank,
    })

    let ground = sceneObjs.ground
    let regions = sceneObjs.regions

    // 初始化
    {
        game.restart()

        // 响应开船事件，切换region
        msg.add((eventData, eventState) => {
            if (eventData.type === BoatLeaveButtonClickEventType) {
                game.changeNextRegion()
                msg.notifyObservers({
                    type: BoatLeaveReadyType,
                })
            }
        })
    }

    function start() {
        engine.runRenderLoop(function () {
            if (scene && scene.activeCamera) {
                scene.render();
            }
        });
    }

    start()

    return game
}

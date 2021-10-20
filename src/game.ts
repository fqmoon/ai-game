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
    RestartEvent,
} from "./gui";
import {AfterHumanArriveBank, BeforeHumanArriveBank, createRules, GameOver, GamePass} from "./rule";

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
    | GameOver
    | GamePass
    | RestartEvent
export type GameEvents = BABYLON.Observable<GameEventData>

export const BoatLeaveReadyType = "BoatLeaveReady"

export interface BoatLeaveReady {
    type: typeof BoatLeaveReadyType
}

export interface Game {
    // human拖拽状态信息
    humanDrag: {
        active: boolean
        // 拖动起始地。在拖动失败后要将human放回它
        targetRegions: Set<Region>,
        reachedRegion?: Region,
    } & ({
        dragging: true,
        human: Human,
    } | {
        dragging: false,
        human: undefined,
    })

    boat: Region

    getDstRegion(): Region

    // 分别对应游戏继续、失败、过关
    status: "continue" | "over" | "pass"

    onNextRegionChangedObservable: BABYLON.Observable<void>
    onStatusChangedObservable: BABYLON.Observable<void>

    changeNextRegion(): void

    restart(): void
}

export function createGame() {
    // 全局事件处理
    let gameEvents = new BABYLON.Observable() as GameEvents

    let _status = "continue"
    // @ts-ignore
    let game: Game = {
        // @ts-ignore
        humanDrag: {
            active: true,
            dragging: false,
            human: undefined,
            reachedRegion: undefined,
            targetRegions: new Set(),
        },
        getDstRegion() {
            for (const region of this.humanDrag.targetRegions) {
                if (region !== this.boat)
                    return region
            }
            throw Error("find dst region failed")
        },
        // @ts-ignore
        get status() {
            return _status
        },
        // @ts-ignore
        set status(v) {
            if (_status !== v) {
                _status = v
                this.onStatusChangedObservable.notifyObservers()
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
    let camera = createCamera({scene, canvas, gameStatus: game, gameEvents})
    let sceneObjs = createSceneObjs({scene, gameStatus: game, gameEvents})
    let gui = createGUI({
        gameStatus: game, gameEvents,
        boat: sceneObjs.regions.boat,
        humans: sceneObjs.humans
    })
    game.boat = sceneObjs.regions.boat
    let rules = createRules({
        gameStatus: game, gameEvents, boat: sceneObjs.regions.boat, humans: sceneObjs.humans, scene,
        leftBank: sceneObjs.regions.leftBank,
        rightBank: sceneObjs.regions.rightBank,
    })

    let ground = sceneObjs.ground
    let regions = sceneObjs.regions

    // 初始化
    {
        game.restart()

        // 响应开船事件，切换region
        gameEvents.add((eventData, eventState) => {
            if (eventData.type === BoatLeaveButtonClickEventType) {
                game.changeNextRegion()
                gameEvents.notifyObservers({
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

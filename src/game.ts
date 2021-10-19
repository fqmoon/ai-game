import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {Human, HumanDragAfterEndEvent, HumanDragBeforeEndEvent, HumanDragMoveEvent, HumanDragStartEvent} from "./human";
import {Region} from "./region";
import {PointerOnGroundEvent} from "./ground";
import {createCamera} from "./camera";
import {BoatLeaveButtonClickEvent, BoatLeaveButtonClickEventType, createGUI} from "./gui";
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
export type GameEvents = BABYLON.Observable<GameEventData>

export const BoatLeaveReadyType = "BoatLeaveReady"

export interface BoatLeaveReady {
    type: typeof BoatLeaveReadyType
    // 始发站
    src: Region
    // 终点站
    dst: Region
}

export interface GameStatus {
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
}

export function createGame() {
    // 全局事件处理
    let gameEvents = new BABYLON.Observable() as GameEvents
    // @ts-ignore
    let gameStatus: GameStatus = {
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
        }
    }

    let canvas = document.getElementById("game") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)
    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    let scene = new BABYLON.Scene(engine)
    let camera = createCamera({scene, canvas, gameStatus, gameEvents})
    let sceneObjs = createSceneObjs({scene, gameStatus, gameEvents})
    let gui = createGUI({
        gameStatus, gameEvents,
        boat: sceneObjs.regions.boat,
        humans: sceneObjs.humans
    })
    gameStatus.boat = sceneObjs.regions.boat
    let rules = createRules({
        gameStatus, gameEvents, boat: sceneObjs.regions.boat, humans: sceneObjs.humans, scene,
        leftBank: sceneObjs.regions.leftBank,
        rightBank: sceneObjs.regions.rightBank,
    })

    let ground = sceneObjs.ground
    let regions = sceneObjs.regions

    // 初始化
    {
        gameStatus.humanDrag.targetRegions.add(regions.leftBank)
        gameStatus.humanDrag.targetRegions.add(regions.boat)

        // 初始化：将human放入region
        for (const human of sceneObjs.humans) {
            regions.leftBank.putHuman(human)
        }

        // 响应开船事件，切换region
        gameEvents.add((eventData, eventState) => {
            if (eventData.type === BoatLeaveButtonClickEventType) {
                let src, dst
                if (gameStatus.humanDrag.targetRegions.has(regions.leftBank)) {
                    src = regions.leftBank
                    dst = regions.rightBank
                    gameStatus.humanDrag.targetRegions.delete(regions.leftBank)
                    gameStatus.humanDrag.targetRegions.add(regions.rightBank)
                } else if (gameStatus.humanDrag.targetRegions.has(regions.rightBank)) {
                    src = regions.rightBank
                    dst = regions.leftBank
                    gameStatus.humanDrag.targetRegions.delete(regions.rightBank)
                    gameStatus.humanDrag.targetRegions.add(regions.leftBank)
                } else {
                    throw Error("拖拽时的targetRegions状态错误")
                }

                gameEvents.notifyObservers({
                    type: BoatLeaveReadyType,
                    src,
                    dst,
                })
            }
        })
    }

    return {
        events: gameEvents,
        status: gameStatus,
        engine,
        canvas,
        scene,
        sceneObjs,
        camera,
        start: () => {
            engine.runRenderLoop(function () {
                if (scene && scene.activeCamera) {
                    scene.render();
                }
            });
        },
    }
}

export type Game = ReturnType<typeof createGame>

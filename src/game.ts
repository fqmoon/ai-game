import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {Human, HumanDragAfterEndEvent, HumanDragBeforeEndEvent, HumanDragMoveEvent, HumanDragStartEvent} from "./human";
import {Region} from "./region";
import {PointerOnGroundEvent} from "./ground";
import {createCamera} from "./camera";

export type GameEventData =
    PointerOnGroundEvent
    | HumanDragStartEvent
    | HumanDragBeforeEndEvent
    | HumanDragMoveEvent
    | HumanDragAfterEndEvent
export type GameEvents = BABYLON.Observable<GameEventData>

export interface GameStatus {
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
}

export function createGame() {
    // 全局事件处理
    let gameEvents = new BABYLON.Observable() as GameEvents
    let gameStatus: GameStatus = {
        // TODO
        // @ts-ignore
        humanDrag: {
            active: true,
            dragging: false,
            human: undefined,
            reachedRegion: undefined,
            targetRegions: new Set(),
        },
    }

    let canvas = document.getElementById("root") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)
    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    let scene = new BABYLON.Scene(engine)
    let camera = createCamera({scene, canvas, gameStatus, gameEvents})
    let sceneObjs = createSceneObjs({scene, gameStatus, gameEvents})

    let ground = sceneObjs.ground
    let regions = sceneObjs.regions

    // TODO 新的事件驱动编程
    {
        gameStatus.humanDrag.targetRegions.add(regions.leftBank)
        gameStatus.humanDrag.targetRegions.add(regions.boat)

        // 初始化：将human放入region
        for (const human of sceneObjs.humans) {
            regions.leftBank.putHuman(human)
        }
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

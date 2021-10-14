import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {Human, HumanDragEndEvent, HumanDragMoveEvent, HumanDragStartEvent} from "./human";
import {Region} from "./region";
import {PointMoveOnGroundEvent} from "./ground";
import {createCamera} from "./camera";

export type GameEventData = {
    type: "regionPut",
} | {
    type: "regionPop"
} | PointMoveOnGroundEvent | HumanDragStartEvent | HumanDragEndEvent | HumanDragMoveEvent
type GameEventTypes = "regionPut" | "regionPop"
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

    // register events
    // {
    //     scene.onPointerObservable.add((pointerInfo, eventState) => {
    //         if (!gameStatus.humanDrag.active)
    //             return
    //
    //         if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
    //             if (pointerInfo.pickInfo?.hit &&
    //                 pointerInfo.pickInfo.pickedMesh) {
    //
    //                 let dragInfo = gameStatus.humanDrag
    //
    //                 let pickedMesh = pointerInfo.pickInfo.pickedMesh
    //                 if (pickedMesh.metadata?.gameObjType === "Human") {
    //                     let human = pickedMesh.metadata?.gameObj as Human
    //                     if (human) {
    //                         dragInfo.human = human
    //                         dragInfo.dragging = true
    //
    //                         camera.detachControl(canvas)
    //
    //                         // TODO 修改成非特例，根据status来
    //                         regions.leftBank.updateColorByDrag(!!human)
    //                         regions.boat.updateColorByDrag(!!human)
    //                     }
    //                 }
    //             }
    //         } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
    //             if (gameStatus.humanDrag.dragging) {
    //                 let dragInfo = gameStatus.humanDrag
    //                 let human = dragInfo.human
    //
    //                 camera.attachControl(canvas)
    //
    //                 // todo
    //                 regions.leftBank.updateColorByDrag(!!human)
    //                 regions.boat.updateColorByDrag(!!human)
    //
    //                 gameStatus.humanDrag = {
    //                     ...dragInfo,
    //                     dragging: false,
    //                     human: undefined,
    //                 }
    //             }
    //         } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
    //             let dragging = gameStatus.humanDrag.dragging
    //             regions.leftBank.updateColorByDrag(dragging)
    //             regions.boat.updateColorByDrag(dragging)
    //         }
    //     })
    // }

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

import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {Human} from "./human";
import {Region} from "./region";
import {PointerOnGroundEvent} from "./ground";
import {createCamera} from "./camera";
import {
    BoatLeaveButtonClickEvent,
    BoatLeaveButtonClickEventType,
    createGUI,
} from "./gui";
import {AfterHumanArriveBank, BeforeHumanArriveBank, createRules} from "./rule";

export type GameMsgData =
    PointerOnGroundEvent
    | BoatLeaveButtonClickEvent
    | BoatLeaveReady
    | BeforeHumanArriveBank
    | AfterHumanArriveBank
export type GameMsg = BABYLON.Observable<GameMsgData>

export const BoatLeaveReadyType = "BoatLeaveReady"

export interface BoatLeaveReady {
    type: typeof BoatLeaveReadyType
}

export type GameStatus = "continue" | "failed" | "pass"

// human拖拽状态信息
export type HumanDrag = {
    active: boolean
    readonly dragging: boolean
    // 对拖动激活的regions
    activeRegions: Set<Region>,
    readonly reachedRegion?: Region,
    readonly human?: Human,
    readonly lastHuman?: Human,
    onBeforeDraggingHumanChangeObservable: BABYLON.Observable<Human | undefined>
    onAfterDraggingHumanChangeObservable: BABYLON.Observable<Human | undefined>
    onDraggingPointerMoveObservable: BABYLON.Observable<{
        human: Human,
        pointerInfo: BABYLON.PointerInfo
    }>
    onBeforeReachedRegionChangeObservable: BABYLON.Observable<'draggingStart' | 'draggingEnd'>
    onAfterDraggingStatusChangeObservable: BABYLON.Observable<'draggingStart' | 'draggingEnd'>
    onBeforeDraggingStatusChangeObservable: BABYLON.Observable<'draggingStart' | 'draggingEnd'>
    onAfterReachedRegionChangeObservable: BABYLON.Observable<Region | undefined>
}

export interface Game {
    humanDrag: HumanDrag
    boat: Region
    // 分别对应游戏继续、失败、过关
    status: GameStatus
    msg: BABYLON.Observable<GameMsgData>
    onAfterNextRegionChangeObservable: BABYLON.Observable<void>
    onAfterStatusChangeObservable: BABYLON.Observable<GameStatus>

    getDstRegion(): Region

    changeNextRegion(): void

    restart(): void
}

export function createGame() {
    let canvas = document.getElementById("game") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)
    let scene = new BABYLON.Scene(engine)
    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    // 全局事件处理
    let msg = new BABYLON.Observable() as GameMsg

    function createHumanDrag(): HumanDrag {
        let _lastHuman: Human | undefined
        let _human: Human | undefined
        let _touchedRegion: Region | undefined

        let humanDrag = {
            active: true,
            get dragging() {
                return !!this.human
            },
            get lastHuman() {
                return _lastHuman
            },
            get human() {
                return getHuman()
            },
            get reachedRegion() {
                return getTouchedRegion()
            },
            activeRegions: new Set(),
            onBeforeDraggingHumanChangeObservable: new BABYLON.Observable(),
            onAfterDraggingHumanChangeObservable: new BABYLON.Observable(),
            onDraggingPointerMoveObservable: new BABYLON.Observable(),
            onAfterDraggingStatusChangeObservable: new BABYLON.Observable(),
            onBeforeDraggingStatusChangeObservable: new BABYLON.Observable(),
            onBeforeReachedRegionChangeObservable: new BABYLON.Observable(),
            onAfterReachedRegionChangeObservable: new BABYLON.Observable(),
        } as HumanDrag

        function getHuman() {
            return _human
        }

        function setHuman(v: Human | undefined) {
            if (v !== _human) {
                _lastHuman = _human
                _human = v
                humanDrag.onAfterDraggingHumanChangeObservable.notifyObservers(_human)
            }
        }

        function getTouchedRegion() {
            return _touchedRegion
        }

        function setTouchedRegion(v?: Region) {
            if (_touchedRegion !== v) {
                _touchedRegion = v
                humanDrag.onAfterReachedRegionChangeObservable.notifyObservers(_touchedRegion)
            }
        }

        function pickOneRegion() {
            for (const region of humanDrag.activeRegions) {
                let res = scene.pick(scene.pointerX, scene.pointerY, mesh => mesh === region.mesh)
                if (res?.hit) {
                    return region
                }
            }
        }

        scene.onPointerObservable.add((pointerInfo, eventState) => {
            if (!humanDrag.active)
                return

            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.pickInfo?.hit &&
                    pointerInfo.pickInfo.pickedMesh) {

                    let pickedMesh = pointerInfo.pickInfo.pickedMesh
                    if (pickedMesh.metadata?.gameObjType === "Human") { // 判定为human
                        let human = pickedMesh.metadata.gameObj as Human
                        if (!human)
                            throw Error("has human info but not has human")

                        if (!human.region || !humanDrag.activeRegions.has(human.region))
                            return

                        humanDrag.onBeforeDraggingStatusChangeObservable.notifyObservers('draggingStart')
                        setHuman(human)
                        setTouchedRegion(pickOneRegion())
                        humanDrag.onAfterDraggingStatusChangeObservable.notifyObservers('draggingStart')
                    }
                }
            } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (humanDrag.human) {
                    humanDrag.onBeforeDraggingStatusChangeObservable.notifyObservers('draggingEnd')
                    setHuman(undefined)
                    setTouchedRegion(undefined)
                    humanDrag.onAfterDraggingStatusChangeObservable.notifyObservers('draggingEnd')
                }
            } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                if (humanDrag.human) {
                    humanDrag.onDraggingPointerMoveObservable.notifyObservers({
                        human: humanDrag.human,
                        pointerInfo,
                    })
                    setTouchedRegion(pickOneRegion())
                }
            }
        })

        return humanDrag
    }

    let _status = "continue" as GameStatus
    // @ts-ignore
    let game: Game = {
        msg,
        humanDrag: createHumanDrag(),
        getDstRegion() {
            for (const region of this.humanDrag.activeRegions) {
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
                this.onAfterStatusChangeObservable.notifyObservers(_status)
            }
        },
        onAfterNextRegionChangeObservable: new BABYLON.Observable(),
        onAfterStatusChangeObservable: new BABYLON.Observable(),
        changeNextRegion() {
            let lastRegion, nextRegion
            if (game.humanDrag.activeRegions.has(regions.leftBank)) {
                lastRegion = regions.leftBank
                nextRegion = regions.rightBank
                game.humanDrag.activeRegions.delete(regions.leftBank)
                game.humanDrag.activeRegions.add(regions.rightBank)
            } else if (game.humanDrag.activeRegions.has(regions.rightBank)) {
                lastRegion = regions.rightBank
                nextRegion = regions.leftBank
                game.humanDrag.activeRegions.delete(regions.rightBank)
                game.humanDrag.activeRegions.add(regions.leftBank)
            } else {
                throw Error("change region failed")
            }

            this.onAfterNextRegionChangeObservable.notifyObservers()
        },
        restart() {
            for (const human of sceneObjs.humans) {
                regions.leftBank.putHuman(human)
            }
            let dragInfo = game.humanDrag
            dragInfo.activeRegions.clear()
            dragInfo.activeRegions.add(regions.leftBank)
            dragInfo.activeRegions.add(regions.boat)
            game.onAfterNextRegionChangeObservable.notifyObservers()
            game.status = "continue"
        },
    }


    let camera = createCamera({scene, canvas, game: game,})
    let sceneObjs = createSceneObjs({scene, game: game,})
    game.boat = sceneObjs.regions.boat
    let gui = createGUI({
        game: game,
        boat: sceneObjs.regions.boat,
        humans: sceneObjs.humans
    })
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

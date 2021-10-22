import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {Human} from "./human";
import {Region} from "./region";
import {createCamera} from "./camera";
import {createGUI} from "./gui";
import {createRules} from "./rule";
import {createBoatGoAnimation} from "./animations";

export type GameStatus = "continue" | "failed" | "pass"

// human拖拽状态信息
export type HumanDrag = {
    active: boolean
    readonly dragging: boolean
    // 对拖动激活的regions。注意对它的值是临时的，对其修改是无效的
    readonly activeRegions: Set<Region>,
    readonly reachedRegion?: Region,
    readonly human?: Human,
    readonly lastHuman?: Human,
    readonly pointerPosOnGround?: BABYLON.Vector3
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

export interface ValueChange<T> {
    from: T
    to: T
}

export interface Game {
    humanDrag: HumanDrag
    readonly boat: Region
    readonly curBank: Region
    readonly nextBank: Region
    // 分别对应游戏继续、失败、过关
    status: GameStatus
    animations: {
        boatGo: {
            play(): Promise<void>
        }
    }
    onBeforeBankChangeObservable: BABYLON.Observable<void>
    onAfterBankChangeObservable: BABYLON.Observable<void>
    onBeforeBoatGoObservable: BABYLON.Observable<void>
    onAfterBoatGoObservable: BABYLON.Observable<void>
    onBeforeStatusChangeObservable: BABYLON.Observable<ValueChange<GameStatus>>
    onAfterStatusChangeObservable: BABYLON.Observable<ValueChange<GameStatus>>

    getDstRegion(): Region

    // 开船
    boatGo(): void

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
            get activeRegions() {
                return new Set([game.boat, game.curBank])
            },
            get pointerPosOnGround() {
                return ground.getGroundPosition()
            },
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

    function _changeBank(cur: Region, next: Region) {
        game.onBeforeBankChangeObservable.notifyObservers()
        _curBank = cur
        _nextBank = next
        game.onAfterBankChangeObservable.notifyObservers()
    }

    let _status = "continue" as GameStatus
    // @ts-ignore
    let game: Game = {
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
                let from = _status
                let to = v

                this.onBeforeStatusChangeObservable.notifyObservers({from, to})
                _status = v
                this.onAfterStatusChangeObservable.notifyObservers({from, to})
            }
        },
        onBeforeBankChangeObservable: new BABYLON.Observable(),
        onAfterBankChangeObservable: new BABYLON.Observable(),
        onBeforeStatusChangeObservable: new BABYLON.Observable(),
        onAfterStatusChangeObservable: new BABYLON.Observable(),
        onBeforeBoatGoObservable: new BABYLON.Observable(),
        onAfterBoatGoObservable: new BABYLON.Observable(),
        async boatGo() {
            _changeBank(this.nextBank, this.curBank)
            if (this.status === 'continue') {
                this.onBeforeBoatGoObservable.notifyObservers()
                await this.animations.boatGo.play()
                this.onAfterBoatGoObservable.notifyObservers()
            }
        },
        restart() {
            // 重置human
            for (const human of sceneObjs.humans) {
                sceneObjs.regions.leftBank.putHuman(human)
            }
            // 重置bank
            _changeBank(sceneObjs.regions.leftBank, sceneObjs.regions.rightBank)
            game.status = "continue"
        },
        get boat() {
            return _boat
        },
        get curBank() {
            return _curBank
        },
        get nextBank() {
            return _nextBank
        }
    }

    let camera = createCamera({scene, canvas, game: game,})
    let sceneObjs = createSceneObjs({scene, game: game,})
    let _boat = sceneObjs.regions.boat
    let _curBank = sceneObjs.regions.leftBank
    let _nextBank = sceneObjs.regions.rightBank
    let gui = createGUI({
        game: game,
        boat: sceneObjs.regions.boat,
        humans: sceneObjs.humans
    })
    let rules = createRules({
        game: game, humans: sceneObjs.humans,
        leftBank: sceneObjs.regions.leftBank,
        rightBank: sceneObjs.regions.rightBank,
    })

    let ground = sceneObjs.ground
    let regions = sceneObjs.regions

    game.animations = {
        boatGo: createBoatGoAnimation({game, scene, boat: regions.boat})
    }

    game.restart()

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

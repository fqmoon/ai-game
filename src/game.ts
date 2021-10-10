import * as BABYLON from "babylonjs";
import {createSceneObjs} from "./sceneObjs";
import {Human} from "./human";
import {Region} from "./region";

export function createGame() {
    let canvas = document.getElementById("root") as HTMLCanvasElement
    let engine = new BABYLON.Engine(canvas)
    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    let scene = new BABYLON.Scene(engine)
    let camera = createCamera(scene, canvas)
    let sceneObjs = createSceneObjs({scene})

    let ground = sceneObjs.ground
    let regions = sceneObjs.regions

    for (const human of sceneObjs.humans) {
        human.updatePosition = () => {
            let pos = ground.getGroundPosition()
            if (pos) {
                human.mesh.position = pos
                human.mesh.position.y += 3
            }
        }
        human.registerDrag({ground: sceneObjs.ground})
    }
    // register events
    {
        let humanMap = new Map<BABYLON.AbstractMesh, Human>()
        for (const human of sceneObjs.humans) {
            humanMap.set(human.mesh, human)
        }

        let curHuman: Human | undefined
        let originPos = new BABYLON.Vector3()

        scene.onPointerObservable.add((pointerInfo, eventState) => {
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.pickInfo?.hit &&
                    pointerInfo.pickInfo.pickedMesh) {

                    curHuman = humanMap.get(pointerInfo.pickInfo.pickedMesh)
                    if (curHuman) {
                        originPos.copyFrom(curHuman.mesh.position)
                        curHuman.isFollowPointer = true
                        curHuman.updatePosition()
                        camera.detachControl(canvas)

                        regions.leftBank.updateColorByDrag(!!curHuman)
                        regions.boat.updateColorByDrag(!!curHuman)
                    }
                }
            } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (curHuman) {
                    if (!sceneObjs.regions.leftBank.putHuman(curHuman, originPos)
                        && !sceneObjs.regions.boat.putHuman(curHuman, originPos)) {
                        curHuman.mesh.position.copyFrom(originPos)
                    }

                    curHuman.isFollowPointer = false
                    camera.attachControl(canvas)
                    curHuman = undefined

                    regions.leftBank.updateColorByDrag(!!curHuman)
                    regions.boat.updateColorByDrag(!!curHuman)
                }
            } else if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                regions.leftBank.updateColorByDrag(!!curHuman)
                regions.boat.updateColorByDrag(!!curHuman)
            }
        })
    }

    return {
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

function createCamera(scene: BABYLON.Scene, canvas: HTMLElement) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, true);
    return camera
}

export type Game = ReturnType<typeof createGame>

function dragProcedure({}: {
    humans: Iterable<Human>,
    region: Region,
}) {

}

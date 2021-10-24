import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';
import {createHuman, Human} from "./human";
import {createGround} from "./ground";
import {createBank, createBoat} from "./region";
import {Game} from "./game";
import {SlotSize} from "./slot";

export async function createSceneObjs({scene, game}: {
    scene: BABYLON.Scene, game: Game,
}) {
    function createSkyLight() {
        // 线性光是有范围的，这里乘100
        return new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.2, -1, 1).scale(100), scene);
    }

    // 天光对非PBR起效
    let skyLight = createSkyLight()
    let ground = createGround({scene, game: game,})

    let humans = new Set<Human>()
    for (let i = 0; i < 3; i++) {
        humans.add(await createHuman({
            scene, identity: 'missionary',
            position: new BABYLON.Vector3(0, 0.5, 0),
            game: game,
        }))
    }
    for (let i = 0; i < 3; i++) {
        humans.add(await createHuman({
            scene, identity: 'cannibal',
            position: new BABYLON.Vector3(0, 0.5, 0),
            game: game,
        }))
    }

    let bankW = 5, bankH = 10
    let boatW = 4, boatH = 2
    let cannibalSlotSize = [1, 3] as SlotSize
    let missionarySlotSize = [1, 3] as SlotSize
    let regions = {
        leftBank: createBank({
            scene,
            position: new BABYLON.Vector3(-10, 0.01, 0),
            width: bankW,
            height: bankH,
            game: game,
            cannibalSlotSize,
            missionarySlotSize,
        }),
        rightBank: createBank({
            scene,
            position: new BABYLON.Vector3(10, 0.01, 0),
            width: bankW,
            height: bankH,
            game: game,
            cannibalSlotSize,
            missionarySlotSize,
        }),
        boat: createBoat({
            scene,
            position: new BABYLON.Vector3(0, 0.01, 0),
            width: boatW,
            height: boatH,
            game: game,
            humanSlotSize: [1, 2],
        }),
    }

    let shadowGenerator = new BABYLON.ShadowGenerator(1024, skyLight)
    shadowGenerator.usePoissonSampling = true;
    for (const human of humans) {
        shadowGenerator.addShadowCaster(human.mesh)
    }

    return {
        shadowGenerator,
        humans,
        ground,
        skyLight,
        regions,
    }
}

export type GameScene = ReturnType<typeof createSceneObjs>

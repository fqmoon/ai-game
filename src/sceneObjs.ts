import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';
import {createHuman, Human} from "./human";
import {createGround} from "./ground";
import {Game} from "./game";
import {SlotSize} from "./slot";
import {Bank, Boat} from "./region";

export async function createSceneObjs({scene, game}: {
    scene: BABYLON.Scene, game: Game,
}) {
    function createSkyLight() {
        // 线性光是有范围的，这里乘100
        let light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-1, -1, 1).scale(100), scene);
        light.intensity = 5
        return light
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
        leftBank: new Bank({
            scene,
            position: new BABYLON.Vector3(-10, 0.01, 0),
            width: bankW,
            height: bankH,
            game: game,
            cannibalSlotSize,
            missionarySlotSize,
        }),
        rightBank: new Bank({
            scene,
            position: new BABYLON.Vector3(10, 0.01, 0),
            width: bankW,
            height: bankH,
            game: game,
            cannibalSlotSize,
            missionarySlotSize,
        }),
        boat: new Boat({
            scene,
            position: new BABYLON.Vector3(0, 0.01, 0),
            width: boatW,
            height: boatH,
            game: game,
            humanSlotSize: [1, 2],
        }),
    }

    let shadowGenerator = new BABYLON.ShadowGenerator(2048, skyLight)
    shadowGenerator.usePoissonSampling = true;
    for (const human of humans) {
        human.meshes.forEach(mesh => shadowGenerator.addShadowCaster(mesh))
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

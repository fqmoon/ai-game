import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';
import {createHuman, Human} from "./human";
import {createGround} from "./ground";
import {createRegion} from "./region";
import {Game} from "./game";

export async function createSceneObjs({scene, game}: {
    scene: BABYLON.Scene, game: Game,
}) {
    function createSkyLight() {
        return new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.2, -1, 1), scene);
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
    let boatW = 2, boatH = 3
    let regions = {
        leftBank: createRegion({
            scene,
            position: new BABYLON.Vector3(-10, 0.01, 0),
            width: bankW,
            height: bankH,
            game: game,
        }),
        rightBank: createRegion({
            scene,
            position: new BABYLON.Vector3(10, 0.01, 0),
            width: bankW,
            height: bankH,
            game: game,
        }),
        boat: createRegion({
            scene,
            position: new BABYLON.Vector3(0, 0.01, 0),
            width: boatW,
            height: boatH,
            game: game,
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

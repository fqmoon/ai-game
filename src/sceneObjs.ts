import * as BABYLON from "babylonjs";
import {createHuman, Human} from "./human";
import {createGround} from "./ground";
import {createRegion, Region} from "./region";
import {GameEvents, GameStatus} from "./game";

export function createSceneObjs({scene, gameStatus, gameEvents}: {
    scene: BABYLON.Scene,
    gameEvents: GameEvents, gameStatus: GameStatus,
}) {
    function createSkyLight() {
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        return light
    }

    function createPointLight() {
        let light = new BABYLON.PointLight("pl", new BABYLON.Vector3(2, 3, 4), scene)
        light.intensity = 0.5;
        var lightSphere = BABYLON.Mesh.CreateSphere("sphere", 10, 1, scene);
        lightSphere.position = light.position;
        lightSphere.material = new BABYLON.StandardMaterial("light", scene)
        // @ts-ignore
        lightSphere.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
        return {light, lightSphere}
    }

    function castShadow(light: BABYLON.IShadowLight, obj: BABYLON.AbstractMesh) {
        let shadowGen = new BABYLON.ShadowGenerator(1024, light)
        shadowGen.addShadowCaster(obj);
        shadowGen.usePoissonSampling = true;
        return shadowGen
    }

    let skyLight = createSkyLight()
    let ground = createGround({scene, gameStatus, gameEvents,})

    let humans = new Set<Human>()
    for (let i = 0; i < 3; i++) {
        humans.add(createHuman({
            scene, identity: 'missionary',
            position: new BABYLON.Vector3(0, 0.5, 0),
            gameStatus,
            gameEvents,
        }))
    }
    for (let i = 0; i < 3; i++) {
        humans.add(createHuman({
            scene, identity: 'cannibal',
            position: new BABYLON.Vector3(0, 0.5, 0),
            gameStatus,
            gameEvents,
        }))
    }

    let {light: pointLight, lightSphere: pointLightSphere} = createPointLight()
    let shadowGenerator = new BABYLON.ShadowGenerator(1024, pointLight)
    shadowGenerator.usePoissonSampling = true;

    for (const human of humans) {
        shadowGenerator.addShadowCaster(human.mesh)
    }

    let regions = {
        leftBank: createRegion({
            scene,
            position: new BABYLON.Vector3(-30, 0.01, 0),
            width: 20,
            height: 40,
            gameStatus,
            gameEvents,
        }),
        rightBank: createRegion({
            scene,
            position: new BABYLON.Vector3(30, 0.01, 0),
            width: 20,
            height: 40,
            gameStatus,
            gameEvents,
        }),
        boat: createRegion({
            scene,
            position: new BABYLON.Vector3(0, 0.01, 0),
            width: 20,
            height: 40,
            gameStatus,
            gameEvents,
        }),
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

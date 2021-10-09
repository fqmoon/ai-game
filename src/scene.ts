import * as BABYLON from "babylonjs";
import {createGame} from "./game";
import {createHuman, Human} from "./human";

// export interface GameScene {
//     bScene: BABYLON.Scene
//     shadowGenerator: BABYLON.ShadowGenerator
//     humans: Set<BABYLON.AbstractMesh>
// }

export function createMainScene({engine, canvas}: { engine: BABYLON.Engine, canvas: HTMLCanvasElement }) {
    const scene = new BABYLON.Scene(engine);

    function createGround() {
        let ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: 100,
            height: 100,
        }, scene)
        let groundMat = new BABYLON.StandardMaterial("gm", scene)
        groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5)
        ground.material = groundMat
        ground.receiveShadows = true
        return ground
    }

    function createSkyLight() {
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        return light
    }

    function createCamera() {
        const camera = new BABYLON.ArcRotateCamera(
            "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
            scene);
        camera.attachControl(canvas, true);
        return camera
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
    let ground = createGround()
    let camera = createCamera()

    let human = createHuman({scene})
    let {light: pointLight, lightSphere: pointLightSphere} = createPointLight()
    let shadowGenerator = new BABYLON.ShadowGenerator(1024, pointLight)
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.addShadowCaster(human.mesh)

    let humans = new Set<Human>()
    humans.add(human)

    return {
        bScene: scene,
        shadowGenerator,
        humans,
    }
}

export type GameScene = ReturnType<typeof createMainScene>

import * as BABYLON from "babylonjs";
import {createHuman, Human} from "./human";

export function createSceneObjs({scene}: { scene: BABYLON.Scene }) {
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

    let human = createHuman({scene})
    let {light: pointLight, lightSphere: pointLightSphere} = createPointLight()
    let shadowGenerator = new BABYLON.ShadowGenerator(1024, pointLight)
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.addShadowCaster(human.mesh)

    let humans = new Set<Human>()
    humans.add(human)

    return {
        shadowGenerator,
        humans,
        ground,
        skyLight,
    }
}

export type GameScene = ReturnType<typeof createSceneObjs>

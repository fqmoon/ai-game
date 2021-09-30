import * as BABYLON from "babylonjs"


let canvas = document.getElementById("root") as HTMLCanvasElement
let engine = new BABYLON.Engine(canvas)
const scene = new BABYLON.Scene(engine);
engine.runRenderLoop(function () {
    if (scene && scene.activeCamera) {
        scene.render();
    }
});
// Resize
window.addEventListener("resize", function () {
    engine.resize();
});

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
        "camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.attachControl(canvas, true);
    return camera
}

function createBox() {
    const box = BABYLON.MeshBuilder.CreateBox("box", {
        width: 1,
        height: 1,
        depth: 1,
    });
    box.position = new BABYLON.Vector3(0, 0.5, 0)
    let boxMat = new BABYLON.StandardMaterial("boxMat", scene)
    boxMat.diffuseColor = new BABYLON.Color3(1, 0, 0)
    box.material = boxMat
    return box
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
let box = createBox()
let {light: pointLight, lightSphere: pointLightSphere} = createPointLight()
let lightGen = castShadow(pointLight, box)


let picked = false
let pickedObjs = new Set()
// 这里的pick事件可能是指鼠标的click事件而非down事件
scene.onPointerPick = function (evt, pickInfo) {
    if (pickInfo.hit) {
        if (pickInfo.pickedMesh === box) {
            box.position.y += 1
            picked = true
            pickedObjs.add(box)
        } else {
            picked = false
            for (const pickedObj of pickedObjs) {
                // @ts-ignore
                pickedObj.position = pickInfo.pickedPoint
            }
            pickedObjs.clear()
        }
    } else {
        console.log("error! 不应该拾取不到")
    }
};

scene.onPointerMove = function (evt, pickInfo, type) {
    if (picked) {
        console.log(pickInfo)
    }
}


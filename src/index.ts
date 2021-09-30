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
var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
sphere.position.y = 1;
let lightGen2 = castShadow(pointLight, sphere)

// 需要拾取的物体
let toDrag = new Set<BABYLON.AbstractMesh>()
toDrag.add(box)
toDrag.add(sphere)

// 被拾取的物体
// 存储拖拽开始前的物体信息
let draggingObjInfos = new Map<BABYLON.AbstractMesh, {
    originPosition: BABYLON.Vector3,
}>()

// 拖拽过程中相对于地面位置的偏移
let dragOffset = new BABYLON.Vector3(0, 2, 0)

// 获取当前鼠标所在的地形位置
function getGroundPosition() {
    let res = scene.pick(scene.pointerX, scene.pointerY, mesh => mesh === ground)
    if (res.hit) {
        return res.pickedPoint
    }
}

// 更新所有拖拽物体的位置
function updateAllDraggingObjPos() {
    if (draggingObjInfos.size === 0)
        return

    let groundPos = getGroundPosition()
    if (groundPos) {
        for (const draggingObj of draggingObjInfos.keys()) {
            draggingObj.position = groundPos.add(dragOffset)
        }
    }
}

scene.onPointerObservable.add((pointerInfo, eventState) => {
    switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
            if (pointerInfo.pickInfo.hit && toDrag.has(pointerInfo.pickInfo.pickedMesh)) {
                let pickedObj = pointerInfo.pickInfo.pickedMesh
                draggingObjInfos.set(pickedObj, {
                    originPosition: pickedObj.position.clone(),
                })
                // 使默认控制失效
                camera.detachControl(canvas)
                // 这里拖拽还没有被调用（因为鼠标没有移动），需要手动调用以表示拖拽开始
                updateAllDraggingObjPos()
            }
            break;
        case BABYLON.PointerEventTypes.POINTERUP:
            // 恢复默认控制
            camera.attachControl(canvas)
            for (const [obj, info] of draggingObjInfos.entries()) {
                obj.position = info.originPosition
            }
            draggingObjInfos.clear()
            break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
            updateAllDraggingObjPos()
            break;
    }
})

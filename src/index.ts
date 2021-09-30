import * as BABYLON from "babylonjs"
import {ExecuteCodeAction} from "babylonjs/Actions/directActions";

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
        "camera", -Math.PI / 2, Math.PI / 2.5, 50, new BABYLON.Vector3(0, 0, 0),
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
let shadowGen = new BABYLON.ShadowGenerator(1024, pointLight)
shadowGen.usePoissonSampling = true;
shadowGen.addShadowCaster(box)
var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
sphere.position.y = 1;
shadowGen.addShadowCaster(sphere)

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

let gameStates = {
    game: "gaming",
    region: undefined,
    dragging: false,
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
                // 设置状态机
                gameStates.dragging = true
            }
            break;
        case BABYLON.PointerEventTypes.POINTERUP:
            // 恢复默认控制
            camera.attachControl(canvas)
            for (const [obj, info] of draggingObjInfos.entries()) {
                obj.position.y = info.originPosition.y
            }
            draggingObjInfos.clear()
            // 设置状态机
            gameStates.dragging = false
            break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
            updateAllDraggingObjPos()
            break;
    }
})

function createRegion(position: BABYLON.Vector3) {
    let region = BABYLON.MeshBuilder.CreatePlane("region", {
        width: 10,
        height: 20,
    }, scene)
    region.position = position
    region.material = new BABYLON.StandardMaterial("", scene)
    region.rotation.x = Math.PI * 0.5
    // @ts-ignore
    // TODO 并不透明
    region.material.diffuseColor = new BABYLON.Color4(0.0, 0.5, 0.5, 0.5)

    return region
}

// 左岸
let region1 = createRegion(new BABYLON.Vector3(-20, 0.01, 0))
// 右岸
let region2 = createRegion(new BABYLON.Vector3(20, 0.01, 0))
gameStates.region = region1

function registerRegionActions(region: BABYLON.AbstractMesh) {
    let actionMger = new BABYLON.ActionManager(scene)
    region.actionManager = actionMger

    let conditionA = new BABYLON.PredicateCondition(actionMger, () =>
        gameStates.game === "gaming" && gameStates.dragging === true && gameStates.region === region)
    let greenColor = new BABYLON.Color4(0, 1, 0, 0.5)
    let originColor = new BABYLON.Color4(0.0, 0.5, 0.5, 0.5)

    let inOutAction = new BABYLON.SetValueAction(
        BABYLON.ActionManager.OnPointerOverTrigger, region.material, "diffuseColor",
        greenColor, conditionA)
    let outAction = new BABYLON.SetValueAction(
        BABYLON.ActionManager.OnPointerOutTrigger, region.material, "diffuseColor",
        originColor, conditionA)
    // TODO OnPickDownTrigger只能注册在scene上
    let downAction = new BABYLON.SetValueAction(
        BABYLON.ActionManager.OnPickDownTrigger, region.material, "diffuseColor",
        greenColor, conditionA)
    let upAction = new BABYLON.SetValueAction(
        BABYLON.ActionManager.OnPickUpTrigger, region.material, "diffuseColor",
        originColor, conditionA)

    actionMger.registerAction(inOutAction)
    actionMger.registerAction(outAction)
    actionMger.registerAction(downAction)
    actionMger.registerAction(upAction)
}

registerRegionActions(region1)
registerRegionActions(region2)

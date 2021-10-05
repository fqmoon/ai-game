import * as BABYLON from "babylonjs"
import {createGame} from "./game";

let game = createGame()
game.start()

// // 需要拾取的物体
// let toDrag = new Set<BABYLON.AbstractMesh>()
// toDrag.add(box)
// toDrag.add(sphere)
//
// // 被拾取的物体
// // 存储拖拽开始前的物体信息
// let draggingObjInfos = new Map<BABYLON.AbstractMesh, {
//     originPosition: BABYLON.Vector3,
// }>()
//
// // 拖拽过程中相对于地面位置的偏移
// let dragOffset = new BABYLON.Vector3(0, 2, 0)
//
// // 获取当前鼠标所在的地形位置
// function getGroundPosition() {
//     let res = scene.pick(scene.pointerX, scene.pointerY, mesh => mesh === ground)
//     if (res.hit) {
//         return res.pickedPoint
//     }
// }
//
// // 更新所有拖拽物体的位置
// function updateAllDraggingObjPos() {
//     if (draggingObjInfos.size === 0)
//         return
//
//     let groundPos = getGroundPosition()
//     if (groundPos) {
//         for (const draggingObj of draggingObjInfos.keys()) {
//             draggingObj.position = groundPos.add(dragOffset)
//         }
//     }
// }
//
// let gameStates = {
//     // 游戏执行状态
//     game: "gaming",
//     // 目前在哪个岸
//     curBank: undefined,
//     // 是否处于拖拽状态
//     dragging: false,
// }
//
// let dragStartObservable = new BABYLON.Observable()
// let dragEndObservable = new BABYLON.Observable()
//
// scene.onPointerObservable.add((pointerInfo, eventState) => {
//     switch (pointerInfo.type) {
//         case BABYLON.PointerEventTypes.POINTERDOWN:
//             if (!gameStates.dragging && pointerInfo.pickInfo.hit && toDrag.has(pointerInfo.pickInfo.pickedMesh)) {
//                 let pickedObj = pointerInfo.pickInfo.pickedMesh
//                 draggingObjInfos.set(pickedObj, {
//                     originPosition: pickedObj.position.clone(),
//                 })
//                 // 使默认控制失效
//                 camera.detachControl(canvas)
//                 // 这里拖拽还没有被调用（因为鼠标没有移动），需要手动调用以表示拖拽开始
//                 updateAllDraggingObjPos()
//                 // 设置状态机
//                 gameStates.dragging = true
//                 dragStartObservable.notifyObservers(null)
//             }
//             break;
//         case BABYLON.PointerEventTypes.POINTERUP:
//             if (gameStates.dragging) {
//                 // 恢复默认控制
//                 camera.attachControl(canvas)
//                 for (const [obj, info] of draggingObjInfos.entries()) {
//                     obj.position.y = info.originPosition.y
//                 }
//                 draggingObjInfos.clear()
//                 // 设置状态机
//                 gameStates.dragging = false
//                 dragEndObservable.notifyObservers(null)
//             }
//             break;
//         case BABYLON.PointerEventTypes.POINTERMOVE:
//             updateAllDraggingObjPos()
//             break;
//     }
// })
//
// function createRegion(position: BABYLON.Vector3) {
//     let region = BABYLON.MeshBuilder.CreatePlane("region", {
//         width: 10,
//         height: 20,
//     }, scene)
//     region.position = position
//     region.material = new BABYLON.StandardMaterial("", scene)
//     region.rotation.x = Math.PI * 0.5
//     // @ts-ignore
//     // TODO 并不透明
//     region.material.diffuseColor = new BABYLON.Color4(0.0, 0.5, 0.5, 0.5)
//
//     return region
// }
//
// // 左岸
// let leftBank = {
//     region: createRegion(new BABYLON.Vector3(-20, 0.01, 0)),
// }
// // 右岸
// let rightBank = {
//     region: createRegion(new BABYLON.Vector3(20, 0.01, 0)),
// }
// gameStates.curBank = leftBank
//
// let boat = {
//     region: createRegion(new BABYLON.Vector3(0, 0.01, 0))
// }
//
// scene.actionManager = new BABYLON.ActionManager(scene)
// sphere.actionManager = new BABYLON.ActionManager(scene)
//
// function registerBoatRegionActions(region: BABYLON.AbstractMesh) {
//     let actionMger = new BABYLON.ActionManager(scene)
//     region.actionManager = actionMger
//
//     let dragCondition = new BABYLON.PredicateCondition(actionMger, () =>
//         gameStates.game === "gaming" && gameStates.dragging === true)
//     let noDragCondition = new BABYLON.PredicateCondition(actionMger, () =>
//         gameStates.game === "gaming" && gameStates.dragging === false)
//     let greenColor = new BABYLON.Color4(0, 1, 0, 0.5)
//     let blueColor = new BABYLON.Color4(0, 0, 1, 0.5)
//     let originColor = new BABYLON.Color4(0.5, 0.5, 0, 0.5)
//
//     // OnPickDownTrigger只能注册在scene.actionManager上
//     let inAction = new BABYLON.SetValueAction(
//         BABYLON.ActionManager.OnPointerOverTrigger, region.material, "diffuseColor",
//         greenColor, dragCondition)
//     let outAction = new BABYLON.SetValueAction(
//         BABYLON.ActionManager.OnPointerOutTrigger, region.material, "diffuseColor",
//         blueColor, dragCondition)
//
//     actionMger.registerAction(inAction)
//     actionMger.registerAction(outAction)
//     dragStartObservable.add(() => {
//         // @ts-ignore
//         region.material.diffuseColor = blueColor
//     })
//     dragEndObservable.add(() => {
//         // @ts-ignore
//         region.material.diffuseColor = originColor
//     })
// }
//
// registerBoatRegionActions(boat.region)

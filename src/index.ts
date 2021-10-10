import * as BABYLON from "babylonjs"
import {createGame} from "./game";

let game = createGame()
game.start()

// TODO 将下面绑定用户操作的代码封装
// 从数据上来说，需要：
// - 被绑定的物体
// - 起始地
// - 目标地

// 具体的来说
// 在左岸时，人是可以拖动的物体
// 左岸和船是目标区域

interface DragAction {
    (props: { draggingObj: BABYLON.AbstractMesh, pointerInfo: BABYLON.PointerInfo }): any,
}

/**
 * 注册拖拽事件发生器
 */
function createDragController({scene, camera, canvas, dragAction}: {
    scene: BABYLON.Scene,
    camera: BABYLON.Camera,
    canvas: HTMLElement,
    dragAction: DragAction,
}) {
    let onDragStartObservable = new BABYLON.Observable()
    let onDragEndObservable = new BABYLON.Observable()
    let onAfterDragMoveObservable = new BABYLON.Observable()

    let toDrags = new Set<BABYLON.AbstractMesh>()

    let dragging = false
    let draggingObj: BABYLON.AbstractMesh = undefined

    scene.onPointerObservable.add((pointerInfo, eventState) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                // TODO 缺少目标物体的判定
                // TODO 此为拖拽器，却没有拖拽功能，改名？
                if (!dragging && pointerInfo.pickInfo.hit && toDrags.has(pointerInfo.pickInfo.pickedMesh)) {
                    // 使默认控制失效
                    camera.detachControl(canvas)
                    draggingObj = pointerInfo.pickInfo.pickedMesh
                    dragging = true
                    onDragStartObservable.notifyObservers({draggingObj, pointerInfo})
                }
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                if (dragging) {
                    // 恢复默认控制
                    camera.attachControl(canvas)
                    onDragEndObservable.notifyObservers({draggingObj, pointerInfo})
                    dragging = false
                    draggingObj = undefined
                }
                break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                if (dragging) {
                    dragAction({draggingObj, pointerInfo})
                    onAfterDragMoveObservable.notifyObservers({draggingObj, pointerInfo})
                }
                break;
        }
    })

    return {
        toDrags,
        draggingObj,
        dragging,
        onDragStartObservable,
        onAfterDragMoveObservable,
        onDragEndObservable,
    }
}

let dragAction: DragAction = ({draggingObj, pointerInfo}) => {
    // if (draggingObj && pickInfo.hit) {
    //     draggingObj.position.y = pickInfo.pickedPoint.y + 3
    // }

    console.log('g')
}

let {scene, sceneObjs, canvas, camera} = game

let dragController = createDragController({
    dragAction,
    scene,
    canvas,
    camera,
})
for (const human of sceneObjs.humans.values()) {
    dragController.toDrags.add(human.mesh)
}

// test
dragController.onDragEndObservable.add(() => {
    console.log("end")
})
dragController.onDragStartObservable.add(() => {
    console.log("start")
})
dragController.onAfterDragMoveObservable.add(() => {
    console.log("move")
})

/**
 * 简单的绑定
 * 注册物体，然后和目标物体位置绑定
 * 这里只负责一组物体到目标地点的拖拽，在游戏中应该存在2个目标地点，可以简单的用2个管理器
 */
function createDragManager({scene}: {
    // 别想那么多参数，先写
    // 重要性排序：必要数据、操作过程、自定义参数效果
    scene: BABYLON.Scene
}) {
    // 需要拾取的物体
    let needToDrags = new Set<BABYLON.AbstractMesh>()

    // 存储拖拽开始前的物体信息
    let draggingObjInfos = new Map<BABYLON.AbstractMesh, {
        originPosition: BABYLON.Vector3,
    }>()

    // 拖拽过程中相对于地面位置的偏移
    let dragOffset = new BABYLON.Vector3(0, 2, 0)


    // 绑定
    function bind({}: {
        obj: any,
        endRegion: any,
    }) {

    }


    let active = false;

    return {
        bind,
        get active() {
            return active
        },
        set active(v) {
            active = v
            // TODO
        },
    }
}

// 获取当前鼠标所在的地形位置
function getGroundPosition(scene: BABYLON.Scene, ground: BABYLON.AbstractMesh) {
    let res = scene.pick(scene.pointerX, scene.pointerY, mesh => mesh === ground)
    if (res.hit) {
        return res.pickedPoint
    }
}

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

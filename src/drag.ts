import * as BABYLON from "babylonjs";

export type DragEventData = { draggingObj?: BABYLON.AbstractMesh, pointerInfo: BABYLON.PointerInfo }

/**
 * 注册拖拽事件发生器
 */
export function createDragController({scene, camera, canvas}: {
    scene: BABYLON.Scene,
    camera: BABYLON.Camera,
    canvas: HTMLElement,
}) {
    let onDragStartObservable = new BABYLON.Observable<DragEventData>()
    let onDragEndObservable = new BABYLON.Observable<DragEventData>()
    let onDragMoveObservable = new BABYLON.Observable<DragEventData>()

    let toDrags = new Set<BABYLON.AbstractMesh>()

    let dragging = false
    let draggingObj: BABYLON.AbstractMesh | undefined

    let controller = {
        toDrags,
        draggingObj,
        dragging,
        onDragStartObservable,
        onDragMoveObservable,
        onDragEndObservable,
    }

    scene.onPointerObservable.add((pointerInfo, eventState) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                if (!dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.hit
                    // @ts-ignore
                    && toDrags.has(pointerInfo.pickInfo.pickedMesh)) {
                    // 使默认控制失效
                    camera.detachControl(canvas)
                    draggingObj = pointerInfo.pickInfo.pickedMesh as BABYLON.AbstractMesh
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
                    onDragMoveObservable.notifyObservers({draggingObj, pointerInfo})
                }
                break;
        }
    })

    return controller
}

export type DragController = ReturnType<typeof createDragController>

import * as BABYLON from "babylonjs";
import {Ground} from "./ground";
import {SlotManager, SlotPos} from "./slot";

export type HumanIdentity = 'missionary' | 'cannibal'

export function createHuman({scene, position, identity}: {
    scene: BABYLON.Scene, position: BABYLON.Vector3, identity: HumanIdentity
}) {
    function createBox() {
        const box = BABYLON.MeshBuilder.CreateBox("box", {
            width: 1,
            height: 1,
            depth: 1,
        });
        box.position = position
        let boxMat = new BABYLON.StandardMaterial("boxMat", scene)
        boxMat.diffuseColor = new BABYLON.Color3(1, 0, 0)
        box.material = boxMat
        return box
    }

    let mesh = createBox()
    let _isFollowPointer = false
    let _updatePosition: () => any = () => null

    type SlotManager_ = SlotManager | undefined
    type SlotPos_ = SlotPos | undefined

    return {
        mesh,
        identity,
        // 离地面高度
        yOff: 0.5,
        slotManager: undefined as SlotManager_,
        slotPos: undefined as SlotPos_,
        get isFollowPointer() {
            return _isFollowPointer
        },
        set isFollowPointer(v) {
            _isFollowPointer = v
        },
        get updatePosition() {
            return _updatePosition
        },
        set updatePosition(v) {
            _updatePosition = v
        },
        registerDrag: ({ground}: {
            ground: Ground,
        }) => {
            scene.onPointerObservable.add((pointerInfo, eventState) => {
                if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && _isFollowPointer) {
                    _updatePosition()
                }
            })
        },
    }
}

export type Human = ReturnType<typeof createHuman>

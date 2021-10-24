import {Human} from "./human";
import * as BABYLON from "babylonjs";
import {Region} from "./region";
import {Game} from "./game";

export interface GameAnimation {
    readonly controls: Iterable<BABYLON.Animatable>

    play(): Promise<void>
}

// 开船动画
export function createBoatGoAnimation({game, scene, boat}: {
    game: Game, scene: BABYLON.Scene, boat: Region,
}): GameAnimation {
    let frameSpeed = 60

    let humanAnims = new Map<Human, BABYLON.Animation>()

    function putHumanToRegionAndGetPositions(human: Human, region: Region) {
        let srcPos = human.mesh.position.clone()
        if (!region.putHuman(human))
            throw Error("put human failed")
        let dstPos = human.mesh.position.clone()
        return {
            srcPos,
            dstPos,
        }
    }

    function createAnimations() {
        humanAnims.clear()

        let dstRegion = game.getDstRegion()
        for (const human of boat.humans) {
            let {srcPos, dstPos} = putHumanToRegionAndGetPositions(human, dstRegion)
            createHumanAnimation(human, srcPos, dstPos)
        }
    }

    function createHumanAnimation(human: Human, srcPos: BABYLON.Vector3, dstPos: BABYLON.Vector3) {
        let anim = new BABYLON.Animation("humanGoBank", "position", frameSpeed,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3)

        let height = human.dragYOff

        // 设置keys，先抬起，再前行
        // TODO 写成easy
        // TODO 高度和平移分开
        anim.setKeys([
            {
                frame: 0,
                value: BABYLON.Vector3.FromArray([srcPos.x, srcPos.y, srcPos.z]),
            },
            {
                frame: 10,
                value: BABYLON.Vector3.FromArray([srcPos.x, srcPos.y + height, srcPos.z]),
            },
            {
                frame: 50,
                value: BABYLON.Vector3.FromArray([dstPos.x, dstPos.y + height, dstPos.z]),
            },
            {
                frame: 60,
                value: BABYLON.Vector3.FromArray([dstPos.x, dstPos.y, dstPos.z]),
            },
        ])

        humanAnims.set(human, anim)
    }

    let controls = [] as BABYLON.Animatable[]

    async function beginAnimations() {
        controls.forEach(control => control.stop())
        controls = []
        let promises = []
        for (const [human, anim] of humanAnims.entries()) {
            let control = scene.beginDirectAnimation(human.mesh, [anim], 0, 600, false)
            controls.push(control)
            let promise = new Promise<null>((resolve, reject) => {
                control.onAnimationEndObservable.add(() => {
                    resolve(null)
                })
            })
            promises.push(promise)
        }
        return Promise.all(promises)
    }

    return {
        get controls() {
            return controls
        },
        async play() {
            createAnimations()
            await beginAnimations()
        },
    }
}

export type BoatLeaveAnimation = ReturnType<typeof createBoatGoAnimation>

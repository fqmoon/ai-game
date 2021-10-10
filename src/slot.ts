import * as BABYLON from "babylonjs";

export type PlanePos = [number, number]
export type SlotPos = [number, number]
export type SlotSize = [number, number]

/**
 * 空间管理
 * 只负责一个分布区域，即修道士放置区域算一个，野人的放置区域也算一个
 */
export function createSlotManager({leftDownPosition, rightUpPosition, slotSize}: {
    leftDownPosition: BABYLON.Vector2,
    rightUpPosition: BABYLON.Vector2,
    // 槽的尺寸，以行列表示
    slotSize: SlotSize,
}) {
    // 创建空间矩阵，位图表示法
    function createSpaceMatrix() {
        let spaceMat = new Array(slotSize[0])
        // 行优先
        for (let row = 0; row < slotSize[0]; row++) {
            spaceMat[row] = new Array(slotSize[1]).fill(false)
        }
        return spaceMat
    }

    // 空间矩阵，位图表示法
    let spaceMat = createSpaceMatrix()

    // 已经占用的位置数量
    let occupy = 0
    let capacity = slotSize[0] * slotSize[1]

    function calculatePosition(slotPos: [number, number]): PlanePos {
        function interpolate(min: number, max: number, count: number, index: number) {
            return (max - min) / (count + 1) * (index + 1) + min
        }

        let x = interpolate(leftDownPosition.x, rightUpPosition.x, slotSize[1], slotPos[1])
        let y = interpolate(leftDownPosition.y, rightUpPosition.y, slotSize[0], slotPos[0])
        return [x, y]
    }

    function isEmpty() {
        return occupy === 0
    }

    function isFull() {
        if (occupy > capacity)
            throw Error("容量已溢出")
        else return occupy === capacity;
    }

    // 按条件搜索
    function find(predication: { (space: boolean): boolean }): SlotPos | false {
        for (let row = 0; row < slotSize[0]; row++) {
            for (let col = 0; col < slotSize[1]; col++) {
                if (predication(spaceMat[row][col]))
                    return [row, col]
            }
        }

        return false
    }

    function findOccupySlot(): SlotPos | false {
        if (isEmpty())
            return false

        return find(space => space)
    }

    function findEmptySlot(): SlotPos | false {
        if (isFull())
            return false

        return find(space => !space)
    }

    function put() {
        let slotPos = findEmptySlot()
        if (slotPos) {
            let [row, col] = slotPos
            spaceMat[row][col] = true
            occupy += 1
            return {
                planePos: calculatePosition(slotPos),
                slotPos,
            }
        }
        return false
    }

    function pop(slotPos: SlotPos) {
        let [row, col] = slotPos
        let slot = spaceMat[row][col]
        if (slot) {
            spaceMat[row][col] = false
            occupy -= 1
            return {
                scenePos: calculatePosition(slotPos),
                slotPos,
            }
        }
        return false
    }

    function arrange() {
        let toOccupy = 0;
        for (let row = 0; row < slotSize[0]; row++) {
            for (let col = 0; col < slotSize[1]; col++) {
                if (toOccupy < occupy) {
                    spaceMat[row][col] = true
                    ++toOccupy
                } else {
                    spaceMat[row][col] = false
                }
            }
        }
    }

    function print() {
        let str = ''
        for (let row = 0; row < slotSize[0]; row++) {
            for (let col = 0; col < slotSize[1]; col++) {
                str += spaceMat[row][col] ? '1 ' : ' 0'
            }
            str += '\n'
        }
        console.log(str)
    }

    return {
        put,
        pop,
        arrange,
        print,
    }
}

export type SlotManager = ReturnType<typeof createSlotManager>

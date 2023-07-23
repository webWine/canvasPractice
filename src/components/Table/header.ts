import { Ref, ref } from "vue"
import { Canvas } from "./canvas"
import { IColumns } from "./table.vue"
import { cloneDeep, debounce } from "lodash"
import { theme } from "./config"
interface ICopyColumns extends IColumns {
    level: number,
    parentLevel: number,
    startXPos: number,
    endXPos: number,
    startYPos: number,
    endYPos: number,
    parendID: string,
    height: number,
    parent: CopyColumnsType,
    textWidth: number,
    columnsIndex?: number
}

interface IParentInfo {
    rowHeight: number,
    width?: number,
    height?: number

}
type CopyColumnsType = ICopyColumns[]

let maxLevel = ref(0), defaultWidth = 200, parent = Object.create(null), index = 0

function flattenColumnsFun(copyColumns: CopyColumnsType, target: CopyColumnsType, targetObj = Object.create(null)) {
    copyColumns.forEach(item => {
        index++
        item.columnsIndex = index
        target.push(item)
        targetObj[item.field] = item
        if (item.children) {
            flattenColumnsFun(item.children as CopyColumnsType, target, targetObj)
        }
    })
    target = target.sort((a, b) => b.level - a.level)
    return { target, targetObj }
}

function handleColumns(copyColumns: CopyColumnsType, parentLevel = 0, parendID = '') {
    copyColumns.forEach(item => {
        item.level = parentLevel + 1
        item.parendID = parendID
        maxLevel.value = item.level > maxLevel.value ? item.level : maxLevel.value
        item.height = 0
        if (parentLevel) {
            item.parent = copyColumns
        }
        if (item.children) {
            item.width = 0
            handleColumns(item.children as CopyColumnsType, item.level, item.field)
        }
    })
    return copyColumns
}

// function getChildLayer(copyColumns: ICopyColumns, layer = 1) {
//     if (copyColumns.children) {
//         layer++
//         copyColumns.children.forEach(item => {
//             layer = getChildLayer(item as ICopyColumns, layer)
//         })

//     }
//     return layer
// }

function computedWidthAndHeight(target: CopyColumnsType, targetObj: any, rowHeight: number, canvas: Canvas) {
    target.forEach(item => {
        if (item.parendID) {
            targetObj[item.parendID].width += (item.width || defaultWidth)
        }
        item.textWidth = canvas.getTextWidth(item.field)
        if (item.parent && item.children) {
            item.height = rowHeight
        } else if (item.level == maxLevel.value) {
            item.height = rowHeight
        } else if (item.parent && !item.children) {
            item.height = (maxLevel.value - item.level + 1) * rowHeight
        } else if (!item.parent && item.children) {
            item.height = rowHeight
        } else {
            item.height = maxLevel.value * rowHeight
        }
    })
}

function computedAxis(copyColumns: CopyColumnsType, lastEndXPos = 0, lastEndYPos = 0, headerTrans = 0) {
    copyColumns.forEach(item => {
        item.startXPos = lastEndXPos - headerTrans
        item.endXPos = lastEndXPos + (item.width || 0) - headerTrans
        item.startYPos = lastEndYPos
        item.endYPos = lastEndYPos + item.height
        if (item.children) {
            computedAxis(item.children as CopyColumnsType, item.startXPos, item.endYPos)
        }
        lastEndXPos = item.endXPos + headerTrans
    })
}
function filterFinnalColumns(target: IColumns[]) {
    return target.filter(item => !item.children)
}

function renderHeader(copyColumns: CopyColumnsType, canvas: Canvas) {
    copyColumns.forEach(item => {
        // canvas.drawRect(item.startXPos,item.startYPos,(item.width || 0),item.height)

        canvas.drawLine({
            startX: item.startXPos,
            startY: item.startYPos + item.height + 0.5,
            endX: item.startXPos + (item.width || 0),
            endY: item.startYPos + item.height + 0.5,

        }, {
            lineColor: theme.lineColor
        })// 下边
        canvas.drawLine({
            startX: item.startXPos + (item.width || 0) + 0.5,
            startY: item.startYPos,
            endX: item.startXPos + (item.width || 0) + 0.5,
            endY: item.startYPos + item.height
        }, {
            lineColor: theme.lineColor
        })// 下边

        canvas.fillText({
           text: item.field,
           x:item.startXPos,
           y:item.startYPos,
           width:item.width || 0,
           height:item.height,
           style:{
            align:item.titleAlign
           }
        })
        if (item.children) {
            renderHeader(item.children as CopyColumnsType, canvas)
        }
    })
}

function renderFixedHeader(copyColumns: CopyColumnsType, canvas: Canvas) {
    // debugger

    let leftFixed: any[] = [],
        rightFixed: any[] = []
    copyColumns.forEach(column => {
        if (column.fixed == 'left') {
            leftFixed.push(column)
        }
        if (column.fixed == 'right') {
            rightFixed.push(column)
        }
    })
    if(leftFixed.length>0   ){
        for (let i = 0; i < leftFixed.length; i++) {
            let curObj = leftFixed[i],
                lastObj = leftFixed[i - 1]
            if (!lastObj) {
                curObj.startXPos = 0;
                continue
            }
            curObj.startXPos = lastObj.startXPos + lastObj.width
        }
        canvas && canvas.clearRect(0, 0, leftFixed[leftFixed.length - 1].startXPos + leftFixed[leftFixed.length - 1].width, leftFixed[leftFixed.length - 1].height)
        canvas.fillRect(0, 0, leftFixed[leftFixed.length - 1].startXPos + leftFixed[leftFixed.length - 1].width, leftFixed[leftFixed.length - 1].height,theme.headerColor)
        renderHeader(leftFixed, canvas)
    }

    if(rightFixed.length>0){
        for (let i = rightFixed.length-1; i >=0; i--) {
            let curObj = rightFixed[i],
                lastObj = rightFixed[i + 1]
            if (!lastObj) {
                curObj.startXPos = parent.width - curObj.width;
                continue
            }
            curObj.startXPos = lastObj.startXPos - curObj.width
        }
        canvas && canvas.clearRect(rightFixed[0].startXPos, 0, parent.width - rightFixed[0].startXPos, rightFixed[rightFixed.length - 1].height)
        canvas.fillRect(rightFixed[0].startXPos, 0, parent.width - rightFixed[0].startXPos, rightFixed[rightFixed.length - 1].height,theme.headerColor)
        canvas.drawLine({
            startX: rightFixed[0].startXPos+0.5,
            startY: 0,
            endX: rightFixed[0].startXPos+0.5,
            endY: rightFixed[rightFixed.length - 1].height,

        }, {
            lineColor: theme.lineColor
        })
        renderHeader(rightFixed, canvas)
    }

}

function render(copyColumns: CopyColumnsType, canvas: Canvas) {
    canvas && canvas.clearRect(0, 0, parent.width, maxLevel.value * parent.rowHeight)
    canvas.fillRect(0, 0,parent.width, parent.height || maxLevel.value * parent.rowHeight,theme.headerColor)
    renderHeader(copyColumns, canvas)
    renderFixedHeader(copyColumns, canvas)

}

export function useHeader(columns: IColumns[], canvas: Canvas, parentInfo: IParentInfo, headerTrans?: number) {
    parent = parentInfo
    const copyColumns: CopyColumnsType = cloneDeep(columns as CopyColumnsType)
    handleColumns(copyColumns)
    const { target, targetObj } = flattenColumnsFun(copyColumns, [])
    computedWidthAndHeight(target, targetObj, parentInfo.rowHeight, canvas)

    computedAxis(copyColumns, 0, 0, headerTrans)
    // console.log("headerTrans",headerTrans);

    render(copyColumns, canvas)

    const finnalColumns = filterFinnalColumns(target)
    return { finnalColumns, topPos: maxLevel.value * parentInfo.rowHeight, maxLevel: maxLevel.value }
}


import { cloneDeep } from "lodash"
import { Canvas } from "./canvas"
import { Ref, ref, toRaw, watch } from "vue"
import { IColumns, ISize } from "./table.vue"
import { theme } from "./config"

interface IResult {
    width: number,
    startXPos: number,
    endXPos: number,
    startYPos: number,
    height: number,
    text: string,
    bgcolor: string,
    _index: number,
    fixed?: string,
    field?: string,
    columnsIndex?: number,
    hasChildren?: boolean
}

export interface IParent {
    size: ISize,
    rowHeight: number,
    topPos: number,
    speed: number,
    noDataSetting?: any
}

let result = ref(),
    YTrans = ref(0),
    canvasCopy: any = null,
    scrollCount = 0,
    lastIndex = 0,
    originalTableData: any[] = [],
    bodyInfo = Object.create(null),
    fieldLen = 0,
    scrollSpeed = 20,
    maxXWidth = 0,
    copyColumns: IColumns[] = [],
    scrollXDis = 0,
    scrollYDis = 0,
    originalTopDataCopy: any[] = [],
    originalFooterDataCopy: any[] = [],
    topHeight = 0,
    footerHeight = 0,

    charIconOnload = false



function renderNoData(noDataSetting?: any) {
    if (!noDataSetting.show) return
    const img = document.getElementById('emTableNoDataImg') as HTMLImageElement

    img.onload = function () {
        canvasCopy.drawImg(img, bodyInfo.width / 2 - 30, (bodyInfo.height - footerHeight + bodyInfo.y) / 2 - 60, 60, 60)
    }

    canvasCopy.fillText(noDataSetting.text || '暂无数据', bodyInfo.width / 2 - canvasCopy.getTextWidth(noDataSetting.text || '暂无数据') / 2, (bodyInfo.height - footerHeight + bodyInfo.y) / 2 + theme.fontSize / 2 + 20, theme.noDataColer)
}

function clearColumns(finnalColumns: any[]) {
    let result = Object.create(null)
    finnalColumns.forEach(item => {
        result[item.field] = {
            width: item.width,
            startXPos: item.startXPos,
            endXPos: item.endXPos,
            fixed: item.fixed,
            columnsIndex: item.columnsIndex
        }
    })
    return result
}

function computedListPos(list: any[], targetColumns: any, parentInfo: IParent, flag?: number) {
    let lastendYPos = !flag ? bodyInfo.startY : parentInfo.topPos, result: IResult[] = []
    if (flag == 2) {
        lastendYPos = bodyInfo.height
        for (let i = list.length; i >= 0; i--) {
            const item = list[i]
            for (let key in item) {
                if (targetColumns[key]) {
                    result.push({
                        text: item[key],
                        width: targetColumns[key].width,
                        startXPos: targetColumns[key].startXPos,
                        endXPos: targetColumns[key].endXPos,
                        startYPos: lastendYPos,
                        height: parentInfo.rowHeight,
                        bgcolor: !flag ? (originalTopDataCopy.length / scrollCount) % 2 ? i % 2 == 0 ? '#fff' : '#f8f8f8' : i % 2 == 0 ? '#f8f8f8' : '#fff' : i % 2 == 0 ? '#fff' : '#f8f8f8',
                        _index: i,
                        fixed: targetColumns[key].fixed,
                        field: key,
                        columnsIndex: targetColumns[key].columnsIndex
                    })
                }
            }
            lastendYPos -= parentInfo.rowHeight
        }
    } else {
        list.forEach((item, index) => {
            for (let key in item) {
                if (targetColumns[key]) {
                    result.push({
                        text: item[key],
                        width: targetColumns[key].width,
                        startXPos: targetColumns[key].startXPos,
                        endXPos: targetColumns[key].endXPos,
                        startYPos: lastendYPos,
                        height: parentInfo.rowHeight,
                        bgcolor: !flag ? (originalTopDataCopy.length / scrollCount) % 2 ? index % 2 == 0 ? theme.rowColor2 : theme.rowColor1 : index % 2 == 0 ? theme.rowColor1 : theme.rowColor2 : index % 2 == 0 ? theme.rowColor2 : theme.rowColor1,
                        _index: index,
                        fixed: targetColumns[key].fixed,
                        field: key,
                        columnsIndex: targetColumns[key].columnsIndex,
                        hasChildren: item.children && item.children.length > 0
                    })
                }

            }
            lastendYPos += parentInfo.rowHeight
        })

    }


    return result
}






function getOriginalData(list: any[]) {
    return list.map(item => toRaw(item))
}




let parentCallback: { [key: string]: Function },
    tableListCopy: any[] = [],
    startIndex = 0,
    endIndex = 0,
    speedCount = 0,
    scrollHeight = 0,
    scrollXCount = 0,
    scrollYcount = 0,
    scrollYRadio = ref(0),
    isWheel = false,
    isBar = false

export function renderCell(cell: any) {
    canvasCopy.clearRect(cell.startXPos, cell.startYPos, cell.width, cell.height)
    canvasCopy.fillRect(cell.startXPos, cell.startYPos, cell.width, cell.height, cell.hoverColor || cell.bgcolor)
    if (typeof cell.text == 'object' && cell.text.isShowChart) {
        const img = document.getElementById('emTableCharIcon') as HTMLImageElement
        const imgX = cell.startXPos + cell.width - theme.cellPadding - theme.charIconWidth
        const imgY = cell.startYPos + (cell.height - theme.charIconWidth) / 2
        charIconOnload && canvasCopy.drawImg(img, imgX, imgY, theme.charIconWidth, theme.charIconHeight)
        img.onload = function () {
            charIconOnload = true
            canvasCopy.drawImg(img, imgX, imgY, theme.charIconWidth, theme.charIconHeight)
        }
    }
    // 画线，是否展示border,各种情况

    // 数字类型千分位处理，加零减零处理

    // 文本绘制
    canvasCopy.fillText(
        {
            text: typeof cell.text == 'object' ? cell.text.value : cell.text,
            x: cell.startXPos,
            y: cell.startYPos,
            hasChar: typeof cell.text == 'object' ? cell.text.isShowChart ? true : false : false,
            width: cell.width,
            height: cell.height,
            style: {
                color: typeof cell.text == 'object' ? cell.text.color ? cell.text.color : theme.textColor : theme.textColor,
                fontWeight: typeof cell.text == 'object' ? cell.text.isBold ? 'bold' : 'normal' : 'normal',
                fontSize: cell.fontSize || theme.fontSize,
                aligin: cell.align
            }
        })
}

function renderContent(list: any[]) {
    list.forEach(item => {
        renderCell(item)
    })
}

function initBodyPos(parentInfo: IParent, len: number) {
    bodyInfo.x = 0
    bodyInfo.topPos = parentInfo.topPos
    bodyInfo.startY = parentInfo.topPos + len * parentInfo.rowHeight
    bodyInfo.width = parentInfo.size.width
    bodyInfo.height = parentInfo.size.height
    bodyInfo.rowHeight = parentInfo.rowHeight
    bodyInfo.speed = parentInfo.speed
    bodyInfo.endY = parentInfo.size.height - footerHeight
    bodyInfo.startX = 0
    bodyInfo.endX = 800
}

function handleWheelScroll(upOrDown: number,dis?:number) {
    tableListCopy.forEach(item => {

        if (isBar) {
            item.startYPos += scrollYcount
            speedCount = scrollYcount
        }
        // item.startXPos += (isBar ? 0 :scrollYcount)
        if (upOrDown > 0) {
            item.startYPos -= ((isBar ? scrollYcount : 0) +( dis|| bodyInfo.speed * bodyInfo.rowHeight))
        } else {
            item.startYPos += ((isBar ? scrollYcount : 0) + ( dis|| bodyInfo.speed * bodyInfo.rowHeight))
        }
    })
    
    if (!isBar) {
        if (upOrDown > 0) {
            speedCount += ( dis|| bodyInfo.speed * bodyInfo.rowHeight)
        } else {
            speedCount -= ( dis|| bodyInfo.speed * bodyInfo.rowHeight)
        }
    }

}

function renderTargetList() {
    let list = tableListCopy.filter(item => {
        return (item.startYPos + item.height) >= bodyInfo.startY && item.startYPos < bodyInfo.endY && (item.startXPos + item.width) > bodyInfo.startX && item.startXPos < bodyInfo.endX
    })
    startIndex = tableListCopy.findIndex(item => item == list[0])
    endIndex = tableListCopy.findIndex(item => item == list[list.length - 1])
    if (list.length > 0) {
        renderContent(list)
    }
    // console.log(list);
    
    return list
}

function watchScroll(scrollDiraction: Ref<number>) {
    watch(() => scrollDiraction.value, newVal => {
        isWheel = true
        let dis = 0
        console.log(newVal,startIndex,endIndex,scrollYcount,isBar);
        
        if (newVal < 0 && startIndex <= 0)  return YTrans.value = 1  // 下边界
        if (newVal > 0 && (endIndex + 1) >= tableListCopy.length && tableListCopy.length>0 &&  tableListCopy[tableListCopy.length - 1].startYPos + tableListCopy[tableListCopy.length - 1].height > bodyInfo.endY) {
            return YTrans.value = 0; // 上边界
        }
        handleWheelScroll(newVal)
        renderTargetList()
        if(scrollHeight){
            scrollYRadio.value = (isBar ? scrollYcount : speedCount) / scrollHeight
        }
        
        isBar = false
    })
}

function handleBarYScroll(yBarScrollDis: number) {
    tableListCopy.forEach(item => {
        item.startYPos += (isWheel ? speedCount : 0 + scrollYcount)
        item.startYPos -= isWheel ? speedCount : yBarScrollDis
    })

    scrollYcount = isWheel ? speedCount : yBarScrollDis
}

function watchYBar(YTransInfo: { dis: number, flag: boolean }) {
    watch(() => YTransInfo.dis, newVal => {
        // console.log(newVal);
        
        if (!YTransInfo.flag) return
        if(newVal == 0)  return
        if(newVal == 1 && tableListCopy.length>0 &&  tableListCopy[tableListCopy.length - 1].startYPos + tableListCopy[tableListCopy.length - 1].height > bodyInfo.endY)  return
        isBar = true
        handleBarYScroll(scrollHeight * newVal)
        renderTargetList()
        isWheel = false
    })
}

function handleXbarScroll(xBarScrollDis: number) {
    tableListCopy.forEach(item => {
        item.startXPos += scrollXCount
        item.startXPos += xBarScrollDis
    })
    scrollXCount = xBarScrollDis
}

function watchXBar(XTrans: Ref<number>) {
    watch(() => XTrans.value, newVal => {
        if (newVal == 0 || newVal == 1) return
        handleXbarScroll(newVal)
        renderTargetList()
    })

}

// function watchMoveDown(mouseDownPos: { x: number, y: number }){
//     watch([()=>mouseDownPos.x,()=>mouseDownPos.y],([newX,newY])=>{
//         console.log(444);

//     })
// }

export function useTableBody(
    tableList: any[],
    finnalColumns: any[],
    canvas: Canvas,
    parentInfo: IParent,
    scrollDirection: Ref<number>,
    columns: IColumns[],
    YTransInfo: { dis: number, flag: boolean },
    XTrans: Ref<number>,
    topData: any[],
    footerData: any[],
    movePos: { top: number, left: number },
    mouseDownPos: { x: number, y: number },
    callbacks: { [key: string]: Function }
) {
    footerHeight = footerData.length * parentInfo.rowHeight
    copyColumns = columns
    canvasCopy = canvas
    parentCallback = callbacks
    initBodyPos(parentInfo, topData.length)
    if (tableList.length == 0 && topData.length == 0 && footerData.length == 0) {
        renderNoData(parentInfo.noDataSetting)
        return {
            result: null, scrollBarRatio: 0
        }
    }
    if (tableList.length == 0) renderNoData(parentInfo.noDataSetting)


    watchScroll(scrollDirection)
    watchYBar(YTransInfo)
    watchXBar(XTrans)
    // watchMove(movePos)
    // watchMoveDown(mouseDownPos)

    const list = cloneDeep(tableList)
    const topList = cloneDeep(topData)

    const targetColumns = clearColumns(finnalColumns)

    result.value = computedListPos(list, targetColumns, parentInfo, 0)
    originalTopDataCopy = computedListPos(topList, targetColumns, parentInfo, 1)
    originalFooterDataCopy = computedListPos(footerData, targetColumns, parentInfo, 2)

    tableListCopy = getOriginalData(result.value)

    scrollHeight = tableListCopy[tableListCopy.length - 1].startYPos + bodyInfo.rowHeight - tableListCopy[0].startYPos - (bodyInfo.endY - bodyInfo.startY)



    renderTargetList()

    // maxXWidth = originalTableData.length > 0 ? originalTableData[originalTableData.length - 1].endXPos : originalTopDataCopy[originalTopDataCopy.length - 1].endXPos

    topHeight = topList.length * parentInfo.rowHeight





    return { result, scrollYRadio, YTrans, maxXWidth, initBarRadio: (bodyInfo.endY - bodyInfo.startY) / (scrollHeight + (bodyInfo.endY + bodyInfo.startY)) }
}
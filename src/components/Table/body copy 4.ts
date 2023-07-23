import { cloneDeep } from "lodash"
import { Canvas } from "./canvas"
import { Ref, ref, toRaw, watch } from "vue"
import { IColumns, ISize } from "./table.vue"
import { theme } from "./config"
import { useHeader } from "./header"

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
    hasChildren?: boolean,
    align?: string
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
    tableCenterListLen = 0,
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
            columnsIndex: item.columnsIndex,
            align: item.align
        }
    })
    return result
}

function computedListPos(list: any[], flag?: number) {
    let lastendYPos = !flag ? bodyInfo.startY : bodyInfo.topPos, result: IResult[] = []
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
                        height: bodyInfo.rowHeight,
                        bgcolor: !flag ? (originalTopDataCopy.length / scrollCount) % 2 ? i % 2 == 0 ? '#fff' : '#f8f8f8' : i % 2 == 0 ? '#f8f8f8' : '#fff' : i % 2 == 0 ? '#fff' : '#f8f8f8',
                        _index: i,
                        fixed: targetColumns[key].fixed,
                        field: key,
                        columnsIndex: targetColumns[key].columnsIndex,
                        align: targetColumns[key].align
                    })
                }
            }
            lastendYPos -= bodyInfo.rowHeight
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
                        height: bodyInfo.rowHeight,
                        bgcolor: !flag ? (originalTopDataCopy.length / scrollCount) % 2 ? index % 2 == 0 ? theme.rowColor2 : theme.rowColor1 : index % 2 == 0 ? theme.rowColor1 : theme.rowColor2 : index % 2 == 0 ? theme.rowColor2 : theme.rowColor1,
                        _index: index,
                        fixed: targetColumns[key].fixed,
                        field: key,
                        columnsIndex: targetColumns[key].columnsIndex,
                        hasChildren: item.children && item.children.length > 0,
                        align: targetColumns[key].align
                    })
                }

            }
            lastendYPos += bodyInfo.rowHeight
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
                align: cell.align
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
    bodyInfo.endX = parentInfo.size.width
}

function renderTargetList(targetList: any[], flag?: number, boundary: { startY: number, endY: number, startX: number, endX: number } = bodyInfo) {
    let list = targetList.filter(item => {
        return (item.fixed && (item.startYPos + item.height) >= boundary.startY && item.startYPos < boundary.endY) || (item.startYPos + item.height) >= boundary.startY && item.startYPos < boundary.endY && (item.startXPos + item.width) > boundary.startX && item.startXPos < boundary.endX
    })
    let fixedList: any[] = list.filter(item => item.fixed)
    if (flag == 1) {
        startIndex = targetList.findIndex(item => item == list[0])
        endIndex = targetList.findIndex(item => item == list[list.length - 1])
    }
    if (list.length > 0) {
        renderContent(list)
    }
    if (fixedList.length > 0) {
        renderContent(fixedList)
    }


    useHeader(copyColumns, canvasCopy, {
        width: bodyInfo.width,
        rowHeight: bodyInfo.rowHeight,
        height: bodyInfo.topPos
    }, scrollXCount || 0)

    return list
}

function handleWheelScroll(upOrDown: number) {

    // const list = tableListCopy.slice(startIndex,endIndex)
    // list.forEach(item=>{
    //     if (isBar) {
    //         item.startYPos += scrollYcount
    //         speedCount = scrollYcount
    //     }
    // })
    let startIndex = Math.floor(scrollYcount / bodyInfo.rowHeight)
    console.log(scrollYcount,startIndex, showLen,speedCount);

    const renderList = cloneDeep(centerList.slice(startIndex, startIndex + showLen+1))
    const targetList = computedListPos(renderList, 0)

    // console.log(targetList);
    

    targetList.forEach(item => {
        if (isBar) {
            item.startYPos += scrollYcount
            speedCount = scrollYcount
        }
        if (upOrDown > 0) {
            item.startYPos -= ((isBar ? scrollYcount : 0) + bodyInfo.speed * bodyInfo.rowHeight)
        } else {
            if (isBar) {
                item.startYPos -= (speedCount + bodyInfo.speed * bodyInfo.rowHeight)
            } else {
                item.startYPos += bodyInfo.speed * bodyInfo.rowHeight
            }
        }
    })
    if (!isBar) {
        if (upOrDown > 0) {
            speedCount += bodyInfo.speed * bodyInfo.rowHeight
        } else {
            speedCount -= bodyInfo.speed * bodyInfo.rowHeight
        }
    }


    return targetList

}


function watchScroll(scrollDiraction: Ref<number>) {
    watch(() => scrollDiraction.value, newVal => {
        isWheel = true

        if (newVal < 0 && tableListCopy[startIndex]._index == 0) {
            const startYPos = tableListCopy[0].startYPos
            if (startYPos <= bodyInfo.startY) {
                tableListCopy.forEach(item => {
                    item.startYPos += (bodyInfo.startY - startYPos)
                })
                speedCount -= (bodyInfo.startY - startYPos)
            }
            renderCenter()
            scrollYRadio.value = 0
            return YTrans.value = 0  // 下边界
        }
        if (newVal > 0 && tableListCopy[endIndex]._index == (tableCenterListLen - 1)) {
            const startYPos = tableListCopy[endIndex].startYPos
            const endStartYPos = bodyInfo.endY - tableListCopy[endIndex].height
            if (startYPos >= endStartYPos) {
                tableListCopy.forEach(item => {
                    item.startYPos -= (startYPos - endStartYPos)
                })
            }
            renderCenter()
            speedCount += (startYPos - endStartYPos)
            scrollYRadio.value = 1
            return YTrans.value = 1; // 上边界
        }
        handleWheelScroll(newVal)
        renderCenter()
        if (scrollHeight) {
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
        if (!YTransInfo.flag) return
        if (newVal == 0) {
            const startYPos = tableListCopy[0].startYPos
            if (startYPos <= bodyInfo.startY) {
                tableListCopy.forEach(item => {
                    item.startYPos += (bodyInfo.startY - startYPos)
                })
            }
            scrollYcount -= (bodyInfo.startY - startYPos)
            renderCenter()
            return
        }
        if (newVal == 1) {
            const startYPos = tableListCopy[tableListCopy.length - 1].startYPos
            const endYPos = startYPos + tableListCopy[tableListCopy.length - 1].height
            const endStartYPos = bodyInfo.endY - tableListCopy[tableListCopy.length - 1].height
            if (startYPos >= endStartYPos) {
                tableListCopy.forEach(item => {
                    item.startYPos -= (startYPos - endStartYPos)
                })
                scrollYcount += (startYPos - endStartYPos)

            }

            if (endYPos < bodyInfo.endY) {
                tableListCopy.forEach(item => {
                    item.startYPos += (bodyInfo.endY - endYPos)
                })
                scrollYcount -= (endStartYPos - endYPos)
            }
            renderCenter()
            return
        }
        isBar = true
        handleBarYScroll(scrollHeight * newVal)
        renderCenter()
        isWheel = false
    })
}

function handleXbarScroll(xBarScrollDis: number) {
    tableListCopy.forEach(item => {
        if (!item.fixed) {
            item.startXPos += scrollXCount
            item.startXPos -= xBarScrollDis
        }
    })

}

function handleTopFooter(list: any[], xBarScrollDis: number) {
    list.forEach(item => {
        if (!item.fixed) {
            item.startXPos += scrollXCount
            item.startXPos -= xBarScrollDis
        }
    })
}



function watchXBar(XTrans: Ref<number>) {
    watch(() => XTrans.value, newVal => {
        if (newVal == 0) {
            let minLeft = 2000
            const targetList = tableListCopy.slice(startIndex, endIndex)
            targetList.forEach(item => {
                if (!item.fixed) {
                    minLeft > item.startXPos && (minLeft = item.startXPos)
                }
            })
            let left = bodyInfo.startX - minLeft
            console.log(bodyInfo.startY, minLeft);
            minLeft != 0 && tableListCopy.forEach(item => {
                if (!item.fixed) {
                    item.startXPos += left
                }
            })
            originalTopDataCopy.forEach(item => {
                if (!item.fixed) {
                    item.startXPos += left
                }
            })
            originalFooterDataCopy.forEach(item => {
                if (!item.fixed) {
                    item.startXPos += left
                }
            })

            scrollXCount = 0
            renderCenter()
            return
        }
        if (newVal == 1) {
            let maxLeft = 0, widthFlag = 0
            const targetList = tableListCopy.slice(startIndex, endIndex)
            targetList.forEach(item => {
                if (!item.fixed) {
                    maxLeft < item.startXPos && (maxLeft = item.startXPos, widthFlag = item.width)
                }
            })
            let left = bodyInfo.endX - widthFlag - maxLeft
            left != 0 && tableListCopy.forEach(item => {
                if (!item.fixed) {
                    item.startXPos += left
                }
            })

            originalTopDataCopy.forEach(item => {
                if (!item.fixed) {
                    item.startXPos += left
                }
            })
            originalFooterDataCopy.forEach(item => {
                if (!item.fixed) {
                    item.startXPos += left
                }
            })


            // left计算有问题
            scrollXCount = maxXWidth - bodyInfo.endX
            renderCenter()
            return
        }


        handleTopFooter(originalTopDataCopy, newVal * (maxXWidth - bodyInfo.endX))
        handleTopFooter(originalFooterDataCopy, newVal * (maxXWidth - bodyInfo.endX))
        handleXbarScroll(newVal * (maxXWidth - bodyInfo.endX))
        scrollXCount = newVal * (maxXWidth - bodyInfo.endX)
        renderCenter()
    })

}

function renderCenter() {
    // canvasCopy.clearRect(0,0,bodyInfo.width,bodyInfo.height)
    renderTargetList(tableListCopy, 1)
    renderTop()
}

function renderTop() {
    renderTargetList(originalTopDataCopy, 0, {
        startX: bodyInfo.startX,
        endX: bodyInfo.endX,
        startY: bodyInfo.topPos,
        endY: bodyInfo.endY
    })
    renderFooter()
}

function renderFooter() {
    renderTargetList(originalFooterDataCopy, 0, {
        startX: bodyInfo.startX,
        endX: bodyInfo.endX,
        startY: bodyInfo.height - footerHeight,
        endY: bodyInfo.height
    })
}

// function watchMoveDown(mouseDownPos: { x: number, y: number }){
//     watch([()=>mouseDownPos.x,()=>mouseDownPos.y],([newX,newY])=>{
//         console.log(444);

//     })
// }

function computedXPos(columns: any[]) {
    let leftWidth = 0,
        rightWidth = 0
    columns.forEach(item => {
        if (item.fixed == 'left') {
            leftWidth += item.width
        }
        if (item.fixed == 'right') {
            rightWidth += item.width
        }
    })

    return { leftWidth, rightWidth }
}

let showLen = 0,
    centerList: any = [],
    targetColumns = Object.create(null)
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
    topHeight = topData.length * parentInfo.rowHeight

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

    targetColumns = clearColumns(finnalColumns)

    fieldLen = Object.keys(targetColumns).length

    tableCenterListLen = list.length
    centerList = cloneDeep(list)


    result.value = computedListPos(list, 0)
    originalTopDataCopy = computedListPos(topList, 1)
    originalFooterDataCopy = computedListPos(footerData, 2)

    showLen = Math.ceil((bodyInfo.endY - bodyInfo.startY) / bodyInfo.rowHeight)

    tableListCopy = getOriginalData(result.value)

    scrollHeight = tableListCopy[tableListCopy.length - 1].startYPos + bodyInfo.rowHeight - tableListCopy[0].startYPos - (bodyInfo.endY - bodyInfo.startY)

    const { leftWidth, rightWidth } = computedXPos(columns)

    bodyInfo.startX = leftWidth
    bodyInfo.endX = bodyInfo.width - rightWidth

    tableListCopy.length > 0 && tableListCopy.forEach(item => {
        (item.startXPos + item.width) > maxXWidth && (maxXWidth = item.startXPos + item.width)
    })
    renderCenter()
    return {
        result,
        scrollYRadio,
        YTrans,
        initXBarRadio: (bodyInfo.endX - bodyInfo.startX) / (maxXWidth - leftWidth),
        initYBarRadio: (bodyInfo.endY - bodyInfo.startY) / (scrollHeight + (bodyInfo.endY + bodyInfo.startY))
    }
}
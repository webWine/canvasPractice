import { cloneDeep, property } from "lodash"
import { Canvas } from "./canvas"
import { Ref, ref, toRaw, watch, defineEmits } from "vue"
import { IColumns, ISize } from "./table.vue"
import { useHeader } from "./header"
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
    hasChildren?:boolean
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
    originalTableDataCopy: any[] = [],
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
    startYIndex = 0,
    endYIndex = 0,
    charIconOnload = false



function noData(noDataSetting?: any) {
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
    let lastendYPos = !flag ? bodyInfo.y : parentInfo.topPos, result: IResult[] = []
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
                        hasChildren: item.children && item.children.length>0
                    })
                }

            }
            lastendYPos += parentInfo.rowHeight
        })

    }


    return result
}

function computedLinePos() {

    let hasLeft = topLeftFixeds.length + centerLeftFixeds.length + footerLeftFixeds.length  // 左边是否有数据
    let leftArr = [...topLeftFixeds, ...centerLeftFixeds, ...footerLeftFixeds]
    let leftWidth = 0

    if (leftArr.length > 0 && leftArr[leftArr.length - 1].startXPos + leftArr[leftArr.length - 1].width) {
        leftWidth = leftArr[leftArr.length - 1].startXPos + leftArr[leftArr.length - 1].width
    }

    let hasRight = topLeftFixeds.length + centerLeftFixeds.length + footerLeftFixeds.length  // 左边是否有数据
    let rightArr = [...topLeftFixeds, ...centerLeftFixeds, footerLeftFixeds]
    let rightWidth = 0
    if (rightArr.length > 0 && rightArr[rightArr.length - 1].startXPos + rightArr[rightArr.length - 1].width) {
        rightWidth = rightArr[rightArr.length - 1].startXPos + rightArr[rightArr.length - 1].width
    }



    return {
        leftLine: hasLeft ? { startX: leftWidth, endX: leftWidth, startY: 0, endY: bodyInfo.height } : null,
        rightLine: hasRight ? { startX: bodyInfo.width - rightWidth, endX: bodyInfo.width - rightWidth, startY: topHeight ? bodyInfo.y + 0.5 : bodyInfo.topPos + 0.5, endY: footerHeight ? bodyInfo.height - footerHeight + 0.5 : bodyInfo.height + 0.5 } : null,
        topLine: topHeight ? { startY: bodyInfo.y, endY: bodyInfo.y, startX: leftWidth + 0.5 || 0 + 0.5, endX: rightWidth + 0.5 ? bodyInfo.width - rightWidth + 0.5 : bodyInfo.width + 0.5 } : null,
        bottomLine: footerHeight ? { startY: bodyInfo.height - footerHeight, endY: bodyInfo.height - footerHeight, startX: leftWidth + 0.5 || 0 + 0.5, endX: rightWidth ? bodyInfo.width - rightWidth + 0.5 : bodyInfo.width + 0.5 } : null
    }


}


function drawLine(canvas: Canvas, line: any) {
    if (!line) return
    canvas.drawLine({
        startX: line.startX,
        startY: line.startY + 0.5,
        endX: line.endX,
        endY: line.endY + 0.5,

    }, {
        lineColor: theme.lineColor
    })
}

export function renderBody(list: any[], canvas: Canvas, flag?: number, diraction?: string) {
    let { x, y, width, height } = bodyInfo
    let rectH = 0
    if (flag == 1) {
        y = y - topHeight
        rectH = topHeight
    } else if (flag == 2) {
        y = height - footerHeight
        rectH = footerHeight
    } else {
        y = y
        rectH = originalTableData.length > 0 ? height : 0
    }

    if (diraction && diraction.indexOf("LEFT") > -1) {
        // X轴滚动，计算固定列
        let left = 0
        if (list.length == 0) return
        if (list[list.length - 1].startXPos + list[list.length - 1].width) left = list[list.length - 1].startXPos + list[list.length - 1].width

        x = 0
        width = left
        rectH = height - footerHeight - bodyInfo.y

        let min = list[0].startYPos
        list.forEach(item => {
            if (item.startYPos < min) min = item.startYPos
        })
        y = min

        if (diraction == 'LEFT-TOP') {
            rectH = bodyInfo.y - bodyInfo.topPos
        }
        if (diraction == "LEFT-FOOTER") {
            rectH = footerHeight
        }
    }


    if (diraction && diraction.indexOf("RIGHT") > -1) {
        if (list.length == 0) return
        let left = list[0].startXPo
        x = left
        width = bodyInfo.width - x
        rectH = height - footerHeight - bodyInfo.y

        let min = list[0].startYPos
        list.forEach(item => {
            if (item.startYPos < min) min = item.startYPos
        })
        y = min

        if (diraction == 'RIGHT-TOP') {
            rectH = bodyInfo.y - bodyInfo.topPos
        }
        if (diraction == "RIGHT-TOP") {
            rectH = footerHeight
        }
    }



    canvasCopy && canvasCopy.clearRect(x, y, width, rectH)

    list.forEach(item => {
        if ((item.speciYPos || item.startYPos) >= (y - bodyInfo.rowHeight) && (item.speciYPos || item.startYPos) <= (y + rectH)) {
            let alisX = item.startXPos
            canvas.drawLine({
                startX: alisX + item.width,
                startY: (item.speciYPos || item.startYPos) + 0.5,
                endX: alisX + item.width,
                endY: (item.speciYPos || item.startYPos) + item.height + 0.5
            }, {
                lineColor: theme.lineColor
            })

            canvas.fillRect(alisX, (item.speciYPos || item.startYPos), item.width, item.height, item.hoverColor || item.bgcolor)
            canvas.fillText(
                handleText(typeof item.text == 'object' ? item.text.value : item.text, typeof item.text == 'object' ? item.text.isShowChart ? item.width - theme.charIconWidth : item.width : item.width),
                theme.cellPadding + alisX,
                item.startYPos + item.height / 2 + theme.fontSize / 2,
                {
                    color: typeof item.text == 'object' ? item.text.color ? item.text.color : theme.textColor : theme.textColor,
                    fontWeight: typeof item.text == 'object' ? item.text.isBold ? 'bold' : 'normal' : 'normal',
                    fontSize: theme.fontSize
                })
            // 绘制图表角标
            if (typeof item.text == 'object' && item.text.isShowChart) {
                const img = document.getElementById('emTableCharIcon') as HTMLImageElement
                // debugger
                charIconOnload && canvas.drawImg(img, item.startXPos + item.width - theme.cellPadding - theme.charIconWidth, item.startYPos + item.height / 2 - theme.charIconHeight / 2, theme.charIconWidth, theme.charIconHeight)
                img.onload = function () {
                    charIconOnload = true
                    canvas.drawImg(img, item.startXPos + item.width - theme.cellPadding - theme.charIconWidth, item.startYPos + item.height / 2 - theme.charIconHeight / 2, theme.charIconWidth, theme.charIconHeight)
                }
            }
            item.speciY = 0
            item.speciYPos = 0
        }
    })


    // 重新渲染固定列
    // renderFixed()
    useHeader(copyColumns, canvas, {
        width: bodyInfo.width,
        rowHeight: bodyInfo.rowHeight,
        height: bodyInfo.topPos
    }, scrollXDis || 0)
    !flag && renderBody(centerLeftFixeds, canvasCopy, 3, 'LEFT-CENTER')
    !flag && renderBody(centerRightFixeds, canvasCopy, 4, 'RIGHT-CENTER')

    !flag && renderBody(originalTopDataCopy, canvasCopy, 1)
    !flag && renderBody(originalFooterDataCopy, canvasCopy, 2)
    !flag && renderBody(topLeftFixeds, canvasCopy, 3, 'LEFT-TOP')
    !flag && renderBody(footerLeftFixeds, canvasCopy, 3, 'LEFT-FOOTER')
    !flag && renderBody(topRightFixeds, canvasCopy, 4, 'RIGHT-TOP')
    !flag && renderBody(footerRightFixeds, canvasCopy, 4, 'RIGHT-FOOTER')

}



function handleText(text: string, width: number) {
    if (canvasCopy.getTextWidth(text) <= (width - theme.cellPadding * 2)) {
        return text
    }
    let textArr = [...text], index = 0

    for (let i = 0; i < textArr.length; i++) {
        index++
        let result = textArr.slice(0, index).join('') + '...'
        if (canvasCopy.getTextWidth(result) > (width - theme.cellPadding * 2)) {
            break;
        }

    }
    let res = textArr.slice(0, index - 1).join('')
    res = res + '...'
    return res
}

function handleScroll(list: any[], flag: number) {
    list.forEach(item => {
        if (flag > 0) {
            item.startYPos -= scrollSpeed

            if (item.startYPos < bodyInfo.y) {
                item.speciYPos = bodyInfo.y
                item.speciY = bodyInfo.y - item.startYPos
            }
        } else {
            item.startYPos += scrollSpeed

            if (item.startYPos < bodyInfo.y) {
                item.speciYPos = bodyInfo.y
                item.speciY = bodyInfo.y - item.startYPos
            }
        }
    })

}

let list: any[] = []
function watchScroll(scrollDir: Ref<number>) {
    watch(() => scrollDir.value, newVal => {

        let copyTopData = cloneDeep(originalTopDataCopy),
            copyFooterData = cloneDeep(originalFooterDataCopy)

        if (newVal > 0 && originalTableData.length > 0 && (originalTableData[originalTableData.length - 1].startYPos + bodyInfo.rowHeight) <= bodyInfo.height) {
            YTrans.value = 1
            return
        } // 触发下边界
        if (newVal < 0 && list.length > 0 && list[0]._index == 0) {
            if (list[0].startYPos < bodyInfo.y - footerHeight) {
                handleFun()
            }
            YTrans.value = 0
            return  // 触发上边界
        }
        if (newVal < 0 && list.length == 0) return
        originalTopDataCopy.forEach(item => {
            if(item.fixed) return
            item.startXPos -= scrollXDis
        })
        originalFooterDataCopy.forEach(item => {
            if(item.fixed) return
            item.startXPos -= scrollXDis
        })


        handleFun()
        originalTopDataCopy = copyTopData
        originalFooterDataCopy = copyFooterData


        function handleFun() {
            handleScroll(originalTableData, newVal)



            list = cloneDeep(originalTableData.filter(item => item.startYPos >= (bodyInfo.y - bodyInfo.rowHeight) && item.startYPos <= (bodyInfo.height + bodyInfo.rowHeight - footerHeight) && (item.startXPos + item.width) >= 0 && item.startXPos < bodyInfo.width))
            
            startYIndex = originalTableData.findIndex(item => item == list[0])
            endYIndex = originalTableData.findIndex(item => item == list[list.length - 1])
            if (list.length > 0) {
                YTrans.value = (list[list.length - 1]._index - scrollCount) / (originalTableData.length / fieldLen - scrollCount)
                const { leftFixedList: centerLeftList, rightFixedList: centerFixedList } = handleFixedList(originalTableData, (item: any) => item.startYPos >= (bodyInfo.y - bodyInfo.rowHeight) && item.startYPos <= (bodyInfo.height + bodyInfo.rowHeight))
                centerLeftFixeds = centerLeftList
                centerRightFixeds = centerFixedList
                // console.log("centerLeftFixeds", centerLeftFixeds);
                renderBody(list, canvasCopy)
            }
        }
    }, {
        immediate: true
    })
}

function getInitList(fileldLen: number) {
    const dis = bodyInfo.height - bodyInfo.y - footerHeight
    scrollCount = Math.ceil(dis / bodyInfo.rowHeight)

    let res = scrollCount * fileldLen
    return res
}

function getOriginalData(list: any[]) {
    return list.map(item => toRaw(item))
}
function initBodyPos(parentInfo: IParent, len: number) {
    bodyInfo.x = 0
    bodyInfo.topPos = parentInfo.topPos
    bodyInfo.y = parentInfo.topPos + len * parentInfo.rowHeight
    bodyInfo.width = parentInfo.size.width
    bodyInfo.height = parentInfo.size.height
    bodyInfo.rowHeight = parentInfo.rowHeight
    bodyInfo.speed = parentInfo.speed
}


function watchTranslateY(translateYRadio: Ref<number>) {

    function handleScroll(data: any[], scrollDis: number) {
        data.forEach(item => {
            item.startYPos -= scrollDis
            if(item.fixed) return
            item.startXPos -= scrollXDis
            item.endXPos -= scrollXDis
            
        })
    }

    watch(() => translateYRadio.value, newVal => {

        originalTableData = cloneDeep(originalTableDataCopy)
        let copyTopData = cloneDeep(originalTopDataCopy),
            copyFooterData = cloneDeep(originalFooterDataCopy)
        if (originalTableData.length == 0) return
        originalTopDataCopy.forEach(item => {
            if(item.fixed) return
            item.startXPos -= scrollXDis
        })
        originalFooterDataCopy.forEach(item => {
            if(item.fixed) return
            item.startXPos -= scrollXDis
        })


        const lastData = originalTableData[originalTableData.length - 1]
        const maxScrollDis = lastData.startYPos + lastData.height - bodyInfo.height + footerHeight

        scrollYDis = maxScrollDis * newVal
        handleScroll(originalTableData, maxScrollDis * newVal)

        list = originalTableData.filter(item => (item.startYPos + item.height) > bodyInfo.y && item.startYPos < bodyInfo.height && (item.startXPos + item.width) >= 0 && item.startXPos < bodyInfo.width)

        startYIndex = originalTableData.findIndex(item => item == list[0])
        endYIndex = originalTableData.findIndex(item => item == list[list.length - 1])
        const { leftFixedList: centerLeftList, rightFixedList: centerRightFixedList } = handleFixedList(originalTableData, (item: any) => item.startYPos >= (bodyInfo.y - bodyInfo.rowHeight) && item.startYPos <= (bodyInfo.height + bodyInfo.rowHeight))
        centerLeftFixeds = centerLeftList
        centerRightFixeds = centerRightFixedList

        renderBody(list, canvasCopy)
        originalTopDataCopy = copyTopData
        originalFooterDataCopy = copyFooterData

    }, {
        immediate: true
    })
}
let centerLeftFixeds: any[] = [],
    topLeftFixeds: any[] = [],
    footerLeftFixeds: any[] = [],
    centerRightFixeds: any[] = [],
    topRightFixeds: any[] = [],
    footerRightFixeds: any[] = []

function watchTranslateX(XTrans: Ref<number>) {
    watch(() => XTrans.value, newVal => {
        let copyList: any[] = [],
            copyOriList = cloneDeep(originalTableDataCopy),
            copyTopData = cloneDeep(originalTopDataCopy),
            copyFooterData = cloneDeep(originalFooterDataCopy)
        scrollXDis = newVal * (maxXWidth - bodyInfo.width)

        copyOriList.forEach(item => {
            item.startYPos -= scrollYDis
            if(item.fixed) return
            item.startXPos -= scrollXDis
            
        })
        originalTopDataCopy.forEach(item => {
            if(item.fixed) return
            item.startXPos -= scrollXDis
        })
        originalFooterDataCopy.forEach(item => {
            if(item.fixed) return
            item.startXPos -= scrollXDis
        })
        copyList = copyOriList.filter(item => {
            return item.startYPos >= (bodyInfo.y - bodyInfo.rowHeight) && item.startYPos <= (bodyInfo.height + bodyInfo.rowHeight) && (item.startXPos + item.width) >= 0 && item.startXPos < bodyInfo.width
        })
        startYIndex = copyOriList.findIndex(item => item == copyList[0])
        endYIndex = copyOriList.findIndex(item => item == copyList[copyList.length - 1])

        const { leftFixedList: centerLeftList, rightFixedList: centerRightFixedList } = handleFixedList(copyOriList, (item: any) => item.startYPos >= (bodyInfo.y - bodyInfo.rowHeight) && item.startYPos <= (bodyInfo.height + bodyInfo.rowHeight))
        const { leftFixedList: topLeftList, rightFixedList: topRightFixedList } = handleFixedList(originalTopDataCopy, (item: any) => item.startYPos >= (bodyInfo.topPos - bodyInfo.rowHeight) && item.startYPos <= bodyInfo.y)
        const { leftFixedList: footerLeftList, rightFixedList: footerRightFixedList } = handleFixedList(originalFooterDataCopy, (item: any) => item.startYPos >= (bodyInfo.y - bodyInfo.rowHeight) && item.startYPos <= (bodyInfo.height + bodyInfo.rowHeight))
        centerLeftFixeds = centerLeftList
        topLeftFixeds = topLeftList
        footerLeftFixeds = footerLeftList
        centerRightFixeds = centerRightFixedList
        topRightFixeds = topRightFixedList
        footerRightFixeds = footerRightFixedList
        // console.log("topLeftFixeds",footerLeftFixeds);


        let FLAG = ''
        if (centerLeftList.length + topLeftList.length + footerLeftList.length > 0) {
            FLAG = 'LEFT'
        }
        if (centerRightFixedList.length + topRightFixedList.length + footerRightFixedList.length > 0) {
            FLAG = 'RIGHT'
        }


        renderBody(copyList, canvasCopy, 0, FLAG)
        // renderBody(leftFixedList,canvasCopy,0,'LEFT')
        originalTopDataCopy = copyTopData
        originalFooterDataCopy = copyFooterData

    })

}

function handleFixedList(copyOriList: any[], filter: any) {
    const allRow = copyOriList.filter(filter)
    let leftFixedList: any[] = [],
        rightFixedList: any[] = []
    allRow.forEach(item => {
        if (item.fixed == 'left') {
            leftFixedList.push(item)
        }
        if (item.fixed == 'right') {
            rightFixedList.push(item)
        }
    })
    leftFixedList = leftFixedList.sort((a, b) => a.columnsIndex - b.columnsIndex)

    for (let i = 0; i < leftFixedList.length; i++) {
        let curObj = leftFixedList[i]
        let lastObj = leftFixedList[i - 1]
        if (!lastObj) {
            curObj.startXPos = 0
            continue
        }

        if (curObj.columnsIndex != lastObj.columnsIndex) {
            curObj.startXPos = lastObj.startXPos + lastObj.width
        } else {
            curObj.startXPos = lastObj.startXPos
        }
    }
    rightFixedList = rightFixedList.sort((a, b) => a.columnsIndex - b.columnsIndex)
    for (let i = rightFixedList.length - 1; i >= 0; i--) {
        let curObj = rightFixedList[i]
        let lastObj = rightFixedList[i + 1]
        if (!lastObj) {
            curObj.startXPos = bodyInfo.width - curObj.width
            continue
        }

        if (curObj.columnsIndex != lastObj.columnsIndex) {
            curObj.startXPos = lastObj.startXPos - curObj.width
        } else {
            curObj.startXPos = lastObj.startXPos
        }
    }

    return {
        leftFixedList,
        rightFixedList
    }
}

/**
 * 
 * @param list 
 */
function setHover(list: any[], moveDisTop?: any) {
    let copyTopData = cloneDeep(originalTopDataCopy),
        copyFooterData = cloneDeep(originalFooterDataCopy)

        originalTopDataCopy.forEach(item => {
            if(item.fixed) return
        item.startXPos -= scrollXDis
    })
    originalFooterDataCopy.forEach(item => {
        if(item.fixed) return
        item.startXPos -= scrollXDis
    })
    list.forEach(item => {
        item.hoverColor = ''

        if (item.startYPos < moveDisTop && (item.startYPos + item.height) > moveDisTop) {
            item.hoverColor = '#fff6f0'
        }
    })
    renderBody(list, canvasCopy)
    // console.log(list);
    
    originalTopDataCopy = copyTopData
    originalFooterDataCopy = copyFooterData
}


function watchMove(movePos: { top: number, left: number }) {
    watch(() => movePos.top, newVal => {
        // let copyOriList = cloneDeep(originalTableDataCopy)

        // const list = copyOriList.filter(item => item.startYPos + bodyInfo.rowHeight > bodyInfo.y && (item.startYPos < bodyInfo.height - footerHeight))
        // debounceSetHover(list,newVal)
        let copyList = cloneDeep(originalTableData)

        // copyList.forEach(item => {
        //     if(item.fixed) return
        //     item.startXPos -= scrollXDis
        // })

        let list = copyList.slice(startYIndex, endYIndex + 1)
        let list2 = originalTableData.slice(startYIndex, endYIndex + 1)

        if (list.length == 0) {
            list = copyList.filter(item => item.startYPos + bodyInfo.rowHeight > bodyInfo.y && (item.startYPos < bodyInfo.height - footerHeight))
        }
        if (list2.length > 0) {
            list.forEach((item, index) => {
                item.startYPos = list2[index].startYPos
            })
        }
        setHover(centerLeftFixeds, newVal)
        setHover(centerRightFixeds, newVal)
        setHover(list, newVal)


    })
}



function watchMoveDown(mouseDownPos: { x: number, y: number }) {
    watch([() => mouseDownPos.x, () => mouseDownPos.y], ([newX, newY]) => {

        if (list.length == 0) {
            list = originalTableData.slice(lastIndex, getInitList(fieldLen) + lastIndex)
        }
        const clickCell = list.filter(item => {
            return item.startXPos < newX && item.startXPos + item.width > newX && item.startYPos < newY && item.startYPos + item.height > newY
        })
        let isClick = false
        if (clickCell && clickCell[0] && typeof clickCell[0].text == 'object') {
            const cell = clickCell[0]

            if (cell.startXPos + cell.width - theme.cellPadding > newX && newX > cell.startXPos + cell.width - theme.cellPadding - theme.charIconWidth && cell.startYPos < newY && newY < cell.startYPos + cell.height) {
                isClick = false
                if (cell.text.isShowChart) {
                    isClick = true
                    parentCallback.charClick(cell)
                }
            } 

            if (clickCell[0].text.type == 'link') {

            }
        }
        !isClick && parentCallback.cellClick(clickCell[0])
    })
}


function renderCell(cell: any) {
    canvasCopy.clearRect(cell.startXPos, cell.startYPos, cell.width, cell.height)

}

let parentCallback:{[key:string]:Function}

export function useTableBody(
    tableList: any[],
    finnalColumns: any[],
    canvas: Canvas,
    parentInfo: IParent,
    scrollDirection: Ref<number>,
    columns: IColumns[],
    translateYRadio: Ref<number>,
    XTrans: Ref<number>,
    topData: any[],
    footerData: any[],
    movePos: { top: number, left: number },
    mouseDownPos: { x: number, y: number },
    callbacks:{[key:string]:Function}
) {
    footerHeight = footerData.length * parentInfo.rowHeight
    copyColumns = columns
    canvasCopy = canvas
    parentCallback = callbacks
    initBodyPos(parentInfo, topData.length)
    if (tableList.length == 0 && topData.length == 0 && footerData.length == 0) {
        noData(parentInfo.noDataSetting)
        return {
            result, scrollBarRatio: 0
        }
    }
    if (tableList.length == 0) noData(parentInfo.noDataSetting)


    watchScroll(scrollDirection)



    watchTranslateY(translateYRadio)
    watchTranslateX(XTrans)
    watchMove(movePos)

    watchMoveDown(mouseDownPos)

    const list = cloneDeep(tableList)
    const topList = cloneDeep(topData)

    const targetColumns = clearColumns(finnalColumns)

    result.value = computedListPos(list, targetColumns, parentInfo, 0)
    originalTopDataCopy = computedListPos(topList, targetColumns, parentInfo, 1)
    originalFooterDataCopy = computedListPos(footerData, targetColumns, parentInfo, 2)

    fieldLen = Object.keys(targetColumns).length
    let index = getInitList(fieldLen)

    originalTableData = getOriginalData(result.value)


    originalTableDataCopy = cloneDeep(originalTableData)



    const targetBody = originalTableData.slice(lastIndex, index + lastIndex)


    maxXWidth = originalTableData.length > 0 ? originalTableData[originalTableData.length - 1].endXPos : originalTopDataCopy[originalTopDataCopy.length - 1].endXPos

    const scrollBarRatio = originalTableData.length > 0 ? scrollCount / (originalTableData.length / fieldLen) : 0
    topHeight = topList.length * parentInfo.rowHeight

    renderBody(targetBody, canvas)


    return { result, scrollBarRatio, YTrans, maxXWidth }
}
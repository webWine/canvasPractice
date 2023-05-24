<template>
    <div class="table" id="table" @mousemove="mouseMove($event)">
        <canvas ref="table" :width="canvasW" :height="canvasH" class="table-canvas" id="tableId"></canvas>
        <div class="line"> <span ref="tip" :style="{ transform: `translateY(${translateTop2}px)` }" class="tip"
                @mousedown="mouseDown($event)"></span>
        </div>
    </div>
</template>
<script setup lang="ts">
import { nextTick } from "vue";
import { ref, onMounted } from "vue"
let canvasCtx: CanvasRenderingContext2D | null = null, canvasW = ref(1000), canvasH = ref(300), table = ref<HTMLCanvasElement>()
interface TableData {
    width?: number,
    height?: number,
    [propname: string]: any
}
interface Column {
    width?: number,
    height?: number,
    value: string,
    children?: Array<Column>,
    [propname: string]: any
}
// 默认宽高   
defineProps<{
    data: Array<TableData>,
    column: Array<Column>
}>()

const DEFAULT_HEIGHT = 50, DEFAULT_WIDTH = 100

const tableList = [
    {
        date: '2016-05-03',
        name: 'Tom1',
        state: 'California',
        city: 'Los Angeles',
        address: 'No. 189, Grove St, Los Angeles',
        zip: 'CA 90052',
        age: "45",
        sex: "男",
        address_1: "Address_1",
        address_2: "Address_2"
    },
    {
        date: '2016-05-02',
        name: 'Tom',
        state: 'California',
        city: 'Los Angeles',
        address: 'No. 189, ',
        zip: 'CA 90036',
        age: "18",
        sex: "男",
        address_1: "Address_1",
        address_2: "Address_2"
    },
    {
        date: '2016-05-04',
        name: 'Tom2',
        state: 'California',
        city: 'Los Angeles',
        address: 'No. 189, Grove St, Los Angeles',
        zip: 'CA 90036',
        age: "18",
        sex: "男",
        address_1: "Address_1",
        address_2: "Address_2"
    },
    {
        date: '2016-05-01',
        name: 'Tom',
        state: 'California',
        city: 'Los Angeles',
        address: 'No. 189, Grove St, Los Angeles',
        zip: 'CA 90036',
        age: "18",
        sex: "男",
        address_1: "Address_1",
        address_2: "Address_2"
    },
    {
        date: '2016-05-08',
        name: 'Tom',
        state: 'California',
        city: 'Los Angeles',
        address: 'No. 189, Grove St, Los Angeles',
        zip: 'CA 90036',
        age: "18",
        sex: "男",
        address_1: "Address_1",
        address_2: "Address_2"
    },
    {
        date: '2016-05-06',
        name: 'Tom',
        state: 'California',
        city: 'Los Angeles',
        address: 'No. 189, Grove St, Los Angeles',
        zip: 'CA 90036',
        age: "18",
        sex: "男",
        address_1: "Address_1",
        address_2: "Address_2"
    },
    {
        date: '2016-05-07',
        name: 'Tom',
        state: 'California',
        city: 'Los Angeles',
        address: 'No. 189, Grove St, Los Angeles',
        zip: 'CA 90036',
        age: "19",
        sex: "男",
        address_1: "Address_1",
        address_2: "Address_2"
    },
]


const column = [
    {
        value: 'Date',
        width: 100,

    },
    {
        value: 'Delivery Info',
        children: [
            { value: 'Name' },
            {
                value: "Addres Info",
                children: [
                    {
                        value: "State",
                        height: 100,
                        children: [
                            {
                                value: 'person',
                                children: [
                                    { value: "age" },
                                    { value: 'sex' }
                                ]
                            }
                        ]
                    },
                    {
                        value: 'City'
                    }, {
                        value: 'Address'
                    }, {
                        value: 'Zip'
                    }
                ]
            }

        ]
    }]

// 扁平化页头 
// 高度计算——计算出最大高度——按最大高度遍历绘制
let startId = 0, parentIDStack: number[] = []
function delayerColumn(column: Array<Column>) {
    const res: any[] = []
    
    column.forEach((item, index) => {
        item.width = item.width || DEFAULT_WIDTH
        item.height = item.height || DEFAULT_HEIGHT
        // 高度需要合并的情况
        if (item.children) {
            item.width = 0
        }
        if (column[index + 1] && column[index + 1].children) {
            item.conputedH = true
        }
        res.push({
            id: startId++,
            parentId: parentIDStack[parentIDStack.length - 1] || -1,
            ...item
        })
        if (item.children) {
            parentIDStack.push(startId - 1)
            res.push(...delayerColumn(item.children))
        }
    })

    parentIDStack.pop()
    return res
}

const targetData = delayerColumn(column)
let maxHeight = 0, curParentId = -1, cloumnTemplate: any = [], childH = 0






function initHeigthAndWidth() {

    for (let index = targetData.length - 1; index >= 0; index--) {
        const parentData = targetData.find(item => item.id == targetData[index].parentId)

        if (curParentId != targetData[index].parentId) {
            const commonParent = targetData.filter(item => item.parentId == targetData[index].parentId)

            curParentId = targetData[index].parentId
            commonParent.forEach(item => {
                if (maxHeight < item.height && !childH) {
                    maxHeight = item.height
                }
                const c = targetData.find(t => t.parentId == item.id)
                if (c) {
                    childH = c.height + item.height
                    maxHeight = 0
                }
            })
            commonParent.forEach(item => {
                if (childH) {
                    if (!item.children) {
                        item.height = childH
                    } else {
                        item.childH = childH
                    }
                } else {
                    item.height = maxHeight
                }

            })
            maxHeight = 0
            childH = 0
        }
        if (parentData) {
            parentData.width += targetData[index].width
        }
        if (!targetData[index].children) {
            cloumnTemplate.unshift(targetData[index])
        }

    }

}


initHeigthAndWidth()
// 还原为树形
function getTree() {
    let res = [], obj: any = {}
    targetData.forEach(item => {
        delete item.children
        obj[item.id] = item

    })

    targetData.forEach(item => {
        if (obj[item.parentId]) {
            if (obj[item.parentId].child) {
                obj[item.parentId].child.push(item)
            } else {
                obj[item.parentId].child = [item]
            }
        }
    })

    for (let key in obj) {
        if (obj[key].parentId == -1) {
            res.push(obj[key])
        }
    }
    console.log(res);
    res = handleH(res)
    console.log(lastMaxH);
    
    return res
}
let maxH = 0,lastMaxH = 0
function handleH(res, h?: number) {
    
    res.forEach(item => {
        if (h && !item.childH) {
            item.height = h
            
        }
        
        if (item.child) {
            // maxH = maxH+ item.child[0].height
            handleH(item.child, item.childH - item.height )
        }
        if(item.parentId == -1){
            
            if(lastMaxH<maxH){
                lastMaxH=maxH
            }
            maxH =0
        }
        
       
    })
    
    return res
}


let startX = 0, startY = 0
const target = getTree()
function initAxis(target, h?: number) {
    target.forEach(item => {
        item.x = startX
        item.y = h || startY
        if (item.child) {
            initAxis(item.child, (item.y + item.height))
        } else {
            startX += item.width

        }
    })
}

function cerateCanvasText(text: string | Array<string>, x: number, y: number, width: number, height: number) {
    canvasCtx!.font = '12px'
    if (typeof text == 'string') {
        canvasCtx!.fillText(text, x + width / 2 - canvasCtx!.measureText(text).width / 2, y + height / 2 + 6)
    } else {
        text.forEach((t, i) => {
            canvasCtx!.fillText(t, x + width / 2 - canvasCtx!.measureText(t).width / 2, y + height / 2 + i * 15 + 6)
        })
    }

}
function createRect(x: number, y: number, width: number, height: number) {
    canvasCtx!.rect(x, y, width, height)
    canvasCtx!.stroke()
}
function createColumn(target: Array<any>) {

    target.forEach(item => {
        cerateCanvasText(item.value, item.x, item.y, item.width, item.height)
        createRect(item.x, item.y, item.width, item.height)
        if (item.child) {
            createColumn(item.child)
        }
    })

}

let heightFlag = 0
function createTableCanvas(target) {

    const list = handleDetail()
    table.value!.style.height = list[list.length - 1].y + list[list.length - 1].height + 'px';
    table.value!.height = list[list.length - 1].y + list[list.length - 1].height
    heightFlag = heightFlag || list[list.length - 1].y + list[list.length - 1].height
    createColumn(target)
    list.forEach(item => {
        cerateCanvasText(item.value, item.x, item.y, item.width, item.height)
        createRect(item.x, item.y, item.width, item.height)
    })

}

function handleDetail() {
    let res = [], lastH = 0
    tableList.forEach((item, index) => {
        let target = Object.create(null), maxH = 0, count = 0, curList = []
        for (let key in item) {
            const textWidth = canvasCtx!.measureText(item[key]).width
            const x = cloumnTemplate.find(k => k.value.toLowerCase() == key)?.x
            const w = cloumnTemplate.find(k => k.value.toLowerCase() == key)?.width
            const y = cloumnTemplate.find(k => k.value.toLowerCase() == key)?.y
            const h = cloumnTemplate.find(k => k.value.toLowerCase() == key)?.height
            let textArr = []
            if (textWidth > w) { // 换行
                let value = [...item[key]], temp = ''
                value.forEach(t => {
                    if (canvasCtx!.measureText(temp).width > w * 0.5) {
                        count++
                        maxH = 10 * count
                        textArr.push(temp)
                        temp = ''
                    }
                    temp += t
                })
            }
            target = {
                value: textArr.length > 0 ? textArr : item[key],
                x: x,
                y: y + h,
                width: w,
                height: DEFAULT_HEIGHT
            }
            if (index != 0) {
                target.y = y + h + index * DEFAULT_HEIGHT
            }
            curList.push(target)
            if (curList.length == cloumnTemplate.length) {
                curList.forEach(k => {
                    k.height = maxH + DEFAULT_HEIGHT
                    if (index > 0) {
                        k.y = lastH
                    }
                })
                lastH = curList[0].height + curList[0].y

                res.push(...curList)
                curList = []

            }

        }

        maxH = 15
        count = 0


    })
    console.log(res);

    return res

}
function init(x = 0, y = 0) {
    startX = x, startY = y
    initAxis(target)

    canvasCtx?.translate(startX, startY)
    createTableCanvas(target)
}
let mouseFlag = false, tip = ref(), mouseClientY = 0, curScroll = 0, tableEle = null, wheelFlag = false
function mouseDown(e: MouseEvent) {
    // tableEle = document.querySelector('.table') as HTMLElement
    console.log(e);
    mouseFlag = true
    mouseClientY = e.clientY
    wheelFlag = true
}
function mouseUp(e: MouseEvent) {
    mouseFlag = false
    curScroll = translateTop2.value
    lastClientY = e.clientY
}
let lastClientY = 0
function mouseMove(e: MouseEvent) {
    if (mouseFlag) {
        console.log(curScroll, e.clientY, lastClientY, mouseClientY, curScroll + e.clientY - (lastClientY || mouseClientY));
        if (curScroll > tableEle.offsetHeight) {
            curScroll = tableEle.offsetHeight
            lastClientY = e.clientY
        }
        let dis = curScroll + e.clientY - (lastClientY || mouseClientY)
        // 计算y轴滚动距离
        const a = dis / (tableEle.offsetHeight - 22)

        // 计算canvas隐藏位置高度
        const hiddenH = heightFlag - tableEle.offsetHeight
        if (dis < 0) {
            dis = 0
        }

        if (dis > tableEle.offsetHeight) {
            translateTop.value = `-${hiddenH}px`
            translateTop2.value = tableEle.offsetHeight - 20
        } else {
            translateTop.value = `-${hiddenH * a}px`
            translateTop2.value = dis
        }

    }


}
const translateTop = ref('0px'), translateTop2 = ref(0)
onMounted(() => {
    canvasCtx = table.value!.getContext('2d')
    tableEle = document.querySelector('.table') as HTMLElement
    const tableH = tableEle.offsetHeight
    init()
    let start = 0, up = false, proportion = 0
    table.value?.addEventListener('wheel', function (e: WheelEvent) {

        nextTick(() => {
            if (wheelFlag) {
                start = -curScroll || 0
                wheelFlag = false
            }

            if (e?.deltaY < 0) { // 向上
                start += 10
                up = true
            } else {
                start -= 10
                up = false
            }


            proportion = (start * -1) / (heightFlag - tableH + 42)
            if (proportion > 1) proportion = 1
            console.log(curScroll, start, tableH, proportion, heightFlag - tableH);
            if (start < -(heightFlag - tableH) && !up) {
                start = -(heightFlag - tableH)
            }
            if (start > 0) {
                start = 0
            }
            if (start * -1 > tableH) {
                translateTop2.value = proportion * tableH
            } else {
                translateTop2.value = proportion * tableH
            }

            curScroll = start * -1
            translateTop.value = `${start}px`
            // init(0, start)
        })

    })
    document.addEventListener('mousemove', mouseMove)
    document.addEventListener('mouseup', mouseUp)
})

</script>
<style scoped>
.table {
    width: 800px;
    height: 300px;
    overflow: hidden;
    border: 1px solid #000;
    /* overflow-y: scroll; */
    position: relative;
}

.line {
    position: absolute;
    right: 0;
    top: 0;
    width: 15px;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.45);
    z-index: 20;
    /* pointer-events: none; */
}

span {
    width: 12px;
    display: inline-block;
    background-color: #000;
    height: 20px;
    border-radius: 10px;
    /* pointer-events: none; */
}

.table-canvas {
    transform: translateY(v-bind(translateTop));
    /* transition: all .5s ease; */
}
</style>
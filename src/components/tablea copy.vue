<template>
    <div class="table">
        <canvas ref="table" :width="canvasW" :height="canvasH" class="table-canvas" id="tableId"></canvas>
        <div class="line" @mousemove="mouseMove($event)"> <span @mousedown="mouseDown($event)" @mouseup="mouseUp"
                @mouseout="mouseOut" ref="tip" :style="{ transform: `translateY(${translateTop2})` }"></span> </div>
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
        value: 'person',
        children: [
            { value: "age" },
            { value: 'sex' }
        ]
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
                        height: 100
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
let mouseFlag = false, startMoveY = 0, tip = ref(), mouseClientY = 0
function mouseDown(e: Event) {
    mouseFlag = true
    startMoveY = tip.value!.offsetTop
    mouseClientY = e.clientY


}
function mouseUp() {
    mouseFlag = false
}
function mouseOut() {
    mouseFlag = false
}
function mouseMove(e: Event) {
    if (mouseFlag) {

        translateTop.value = `-${(e.clientY - mouseClientY)}px`
        translateTop2.value = `${(e.clientY - mouseClientY)}px`
    }

}
// 扁平化页头
let startId = 0, parentIDStack: number[] = []
function delayerColumn(column: Array<Column>) {
    const res: any[] = []
    column.forEach((item, index) => {
        item.width = item.width || DEFAULT_WIDTH
        item.height = item.height || DEFAULT_HEIGHT
        // 高度需要合并的情况
        if (item.children) {
            item.width = 0
            // item.height = 0
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
let maxHeight = 0, curParentId = -1, cloumnTemplate: any = [],childH = 0
function initHeigthAndWidth() {
    console.log(targetData);
    
    for (let index = targetData.length - 1; index >= 0; index--) {
        const parentData = targetData.find(item => item.id == targetData[index].parentId)
        
        if (curParentId != targetData[index].parentId) {
            const commonParent = targetData.filter(item => item.parentId == targetData[index].parentId)
            console.log(commonParent);
            
            curParentId = targetData[index].parentId
            commonParent.forEach(item => {
                if (maxHeight < item.height && !childH) {
                    maxHeight = item.height
                }
                const c = targetData.find(t => t.parentId == item.id)
                if(c){ 
                    childH = c.height + item.height
                    maxHeight = 0
                }
            })
            if(targetData[index+1] && targetData[index+1].childH){
                console.log(999);
                
                targetData[index].height = targetData[index+1].childH
            }
            commonParent.forEach(item => {
                if(childH){
                    if(!item.children){
                        item.height = childH
                    } else {
                        item.childH = childH
                    }
                }else{
                    item.height = maxHeight
                }

            })
            maxHeight = 0
            childH = 0
        }
        // if (targetData[index].conputedH) {
        //     const children = targetData.find(item => item.parentId == targetData[index + 1].id)
        //     if (children) {
        //         targetData[index].height = targetData[index + 1].height + children.height
        //     }

        // }
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

    targetData.forEach((item,index) => {
        if (obj[item.parentId]) {
            if(obj[item.parentId].child){
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
        createRect(item.x, item.y, item.width, item.height+(item.childH|| 0))
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
    return res

}
function init(x = 0, y = 0) {
    startX = x, startY = y
    initAxis(target)

    canvasCtx?.translate(startX, startY)
    createTableCanvas(target)
}
function TouchMove(e: Event) {
    console.log(e);

}
const translateTop = ref('0px'), translateTop2 = ref('0px')
onMounted(() => {


    canvasCtx = table.value!.getContext('2d')
    init()
    let start = 0, up = false
    table.value?.addEventListener('wheel', function (e: WheelEvent) {


        nextTick(() => {
            if (e?.wheelDelta > 0) { // 向上
                start += 30
                up = true
            } else {
                start -= 30
                up = false
            }

            if (start < -(heightFlag - document.querySelector('.table').offsetHeight) && !up) {
                start = -320
            }
            if (start > 0) {
                start = 0
            }
            if (start * -1 > document.querySelector('.table').offsetHeight) {
                translateTop2.value = `${document.querySelector('.table').offsetHeight - 20}px`
            } else {
                translateTop2.value = `${start * -1}px`
            }

            translateTop.value = `${start}px`
            // init(0, start)
        })

    })
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
}

span {
    width: 12px;
    display: inline-block;
    background-color: #000;
    height: 20px;
    border-radius: 10px;
}

.table-canvas {
    transform: translateY(v-bind(translateTop));
    /* transition: all .5s ease; */
}
</style>
import { Ref, onMounted, onUnmounted, reactive, ref } from "vue";
import { throttle } from "lodash";
import { ISize } from "./table.vue";

interface IParent {
    size: ISize,
    YTop?:any,
    YScrollHeight?:Ref<number>
}

let up = 1,
    down = -1,
    // mouseStatY = 0,
    startY = 0,
    startX = 0,
    // barYScrollRadio = ref(0),
    barXScrollRadio = ref(0),
    mouseFlag = false,
    scrollDirection = ref(1), // 1——向下滑动 0——向上滑动
    parentInfo: IParent,
    YBarHeight: number,
    XBarWidth: number,
    isX = false,
    moveYStart = 0,
    moveXStart = 0,
    moveYDis = 0,
    moveXDis = 0,
    movePos=reactive(Object.create(null)),
    bodyWidth = 0,
    bodyHeight = 0,
    mouseDownPos = reactive(Object.create(null)),
    YBarMoveInfo :{dis:number,flag:boolean}= reactive({dis:0,flag:true})

const throttleInit = throttle((e) => {
    if ((e as any).wheelDeltaY > 0) {
        scrollDirection.value = down--
    } else {
        scrollDirection.value = up++
    }
}, 50)

function init(e: WheelEvent, tableRef: Ref<HTMLCanvasElement | undefined>) {
    YBarMoveInfo.flag = false
    if (tableRef.value?.contains(e.target as Node)) {
        throttleInit(e)
    }
}

function mouseDownY(e: any) {
    isX = false
    YBarHeight = e.target.offsetHeight
    moveYStart = e.y
    moveYDis = parentInfo.YTop.value
    
    mouseFlag = true
    YBarMoveInfo.flag = true
}

function mouseDownX(e: any) {
    isX = true
    XBarWidth = e.target.offsetWidth
    moveXStart = e.x
    mouseFlag = true
}

function mouseDown(e:any){
    mouseDownPos.x= e.x-startX
    mouseDownPos.y = e.y-startY
}

function mouseUp(e: any) {
    if (!mouseFlag) return
    mouseFlag = false
    if (!isX) {
        // barYScrollRadio.value = boundaryDetectionY(e.y - moveYStart + moveYDis)
        YBarMoveInfo.dis = boundaryDetectionY(e.y - moveYStart + moveYDis)
        // moveYDis = YBarMoveInfo.dis * ((parentInfo.YScrollHeight?.value|| 0) - YBarHeight)
    } else {
        barXScrollRadio.value = boundaryDetectionX(e.x - moveXStart + moveXDis)
        moveXDis = barXScrollRadio.value * (parentInfo.size.width - XBarWidth)
    }
}
function mouseMove(e: any) {
    const {y,x } = e
    if(y - startY >=0 &&  y - startY <= bodyHeight && x-startX> 0 && x-startX< bodyWidth){
        movePos.left = x-startX
        movePos.top = y-startY
    } else {
        movePos.left = 9999999999
        movePos.top = 99999999999999
    }
    
    if (!mouseFlag) return

    // const {top} = e.target.getBoundingClientRect()
    // debugger
    !isX && (YBarMoveInfo.dis = boundaryDetectionY(e.y - moveYStart + moveYDis))
    isX && (barXScrollRadio.value = boundaryDetectionX(e.x - moveXStart + moveXDis))
    
}

function boundaryDetectionY(dis: number) {
    if (dis < 0) return 0
    const maxScrollDis = (parentInfo.YScrollHeight?.value|| 0) - YBarHeight
    
    if (dis > (maxScrollDis)) return 1
    return dis / maxScrollDis
}

function boundaryDetectionX(dis: number) {
    if (dis < 0) return 0
    const maxScrollDis = parentInfo.size.width - XBarWidth
    if (dis > maxScrollDis) return 1
    return dis / maxScrollDis
}

export function useScroll(tableRef: Ref<HTMLCanvasElement | undefined>, parent: IParent) {
    parentInfo = parent
    onMounted(() => {
        window.addEventListener('mousewheel', (e: any) => {
            init(e, tableRef)
        })
        window.addEventListener('mousemove', mouseMove)
        window.addEventListener('mouseup', mouseUp)
        window.addEventListener('mousedown', mouseDown)
        const { top, left,width,height } = tableRef.value?.getBoundingClientRect() as DOMRect
        startY = top
        startX = left
        bodyWidth = width
        bodyHeight = height

    })

    onUnmounted(() => {
        window.removeEventListener('mousewheel', (e: any) => {
            init(e, tableRef)
        })

        window.removeEventListener('mousemove', mouseMove)
        window.removeEventListener('mouseup', mouseUp)
        window.removeEventListener('mousedown', mouseDown)
    })

    return {
        scrollDirection,
        mouseDownY,
        mouseDownX,
        YBarMoveInfo,
        barXScrollRadio,
        movePos,
        mouseDownPos
    }

}
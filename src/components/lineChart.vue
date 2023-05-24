<script setup lang="ts">
import { Ref, onMounted, ref } from 'vue'
interface DataResult {
  time: string,
  chg: number,
  x?: number,
  y?: number
}
// 初始化模拟数据
function createData(time: any) {
  const [start, end] = time.split('-')
  let [start_hour, start_sec]: [number, number] = start.split(':')
  let [end_hour, end_sec]: [number, number] = end.split(':')
  const result: DataResult[] = []
  while (!(start_hour * 1 >= end_hour * 1 && start_sec * 1 > end_sec * 1)) {
    result.push({
      time: completion(start_hour * 1) + ':' + completion(start_sec * 1),
      chg:  Number((Math.random() - 0.5).toFixed(2))
    })
    start_sec = start_sec * 1 + 1
    if (start_sec > 59) {
      start_hour = start_hour * 1 + 1
      start_sec = 0
    }
  }
  return result
}
function completion(time: number) {

  if (time * 1 < 10) {
    return '0' + time
  }
  return time
}
let data: Ref = ref([])
const initData = ['9:30-11:30', '13:00-15:00']
initData.forEach(item => {
  data.value.push(...createData(item))
})



// canvas图形绘制
let canvasW = ref(1500), canvasH = ref(600),canvasBtm=ref(40),canvasL=ref(50),ctx :CanvasRenderingContext2D | null=null;
const myCanvas = ref<HTMLCanvasElement>()

function createLineChart() {
  ctx!.fillStyle = "rgba(0,0,0,0.5)";
  ctx?.fillRect(0, 0, canvasW.value, canvasH.value);
  let ratio = window.devicePixelRatio || 1
  myCanvas.value!.style.width = canvasW.value + 'px';
  myCanvas.value!.style.height = canvasH.value + 'px';
  myCanvas.value!.width = canvasW.value * ratio;
  myCanvas.value!.height = canvasH.value * ratio;
  ctx?.scale(ratio, ratio);
  drawAxisText()
  pushLine()
  drawAxis()
  console.log(data.value);
  console.log(gap);
  
}

function getPeak() {
  let max = 0, min = 0
  data.value.find((item: DataResult) => {
    if (item.chg  > max) {
      max = item.chg
    }
    if (item.chg < min) {
      min = item.chg
    }
  })
  return { max, min }
}
const { max, min } = getPeak();

const dis = max - min
let gap = 0
function getDis(chg: number) {
  const d= canvasH.value- canvasBtm.value
  return d - d / dis * (chg - min)
}
function pushLine() {
  ctx!.beginPath()
  ctx!.lineJoin="round";
  ctx!.moveTo(canvasL.value, getDis(data.value[0].chg));
  data.value[0].x = canvasL.value;
  data.value[0].y = getDis(data.value[0].chg).toFixed(0)
  let start = canvasL.value
  data.value.forEach((item: DataResult, index: number) => {
    if (index > 0) {
      start = start + (canvasW.value-(canvasL.value*2)) / data.value.length
      gap = gap || start
      ctx!.lineTo(start, getDis(item.chg));
      item.x = Number(start.toFixed(0));
      item.y = Number(getDis(item.chg).toFixed(0))
    }
  })
  ctx!.strokeStyle = "red";
  ctx!.stroke();
  data.value.forEach((item: DataResult, index: number) => {
    if (index > 0) {
      drawArc(Number(item.x),Number(item.y))
    }
  })
  
}

function drawAxisText() {
  // x轴文案
  let count = 0;
  let len = Math.floor(data.value.length / 30)
  let startX = canvasL.value, startY = canvasH.value-canvasBtm.value
  ctx!.font = "15px";
  while (count < (len + 1)) {
    ctx?.strokeText(data.value[count * 30].time, startX - 20, canvasH.value-20);
    startX = startX + (canvasW.value - canvasL.value*2) / len
    count++
  }

  // y轴文案
  count = 0;
  const y = (max - min) / 4
  let initY = min
  ctx!.font = "15px";
  while (count < 5) {
    ctx?.strokeText(Number(initY).toFixed(2), 5, startY);
    initY = initY * 1 + y
    startY = startY - (canvasH.value-canvasBtm.value-10 )/ 4
    count++
  }


}
function drawAxis() {
  // x轴
  ctx?.beginPath()
  ctx?.moveTo(canvasL.value, canvasH.value-canvasBtm.value);
  ctx?.lineTo(canvasW.value-canvasL.value, canvasH.value-canvasBtm.value);
  ctx!.strokeStyle = "#000";
  ctx?.stroke();

  // y轴
  ctx?.beginPath()
  ctx?.moveTo(canvasL.value, 0);
  ctx!.lineTo(canvasL.value, canvasH.value-canvasBtm.value);
  ctx!.strokeStyle = "#000";
  ctx!.stroke();

}
function drawArc(x:number,y:number){
  ctx!.beginPath();
  
  ctx!.arc(x, y, 2, 0, 2 * Math.PI);
  ctx!.fillStyle="red";
  ctx!.fill()
  ctx!.stroke();
}
let myCanvas2 = ref<HTMLCanvasElement>()
function createdCrosshair(x: number, y: number, time: string, chg: string) {
  let ctx = myCanvas2.value!.getContext('2d')
  ctx?.clearRect(0, 0, canvasW.value, canvasH.value);
  if (y > canvasH.value-canvasBtm.value || (x < canvasL.value && x > canvasW.value-canvasL.value)) return
  ctx?.closePath();
  ctx!.font = "15px";
  
  ctx?.strokeText(chg, canvasL.value, y);

  ctx?.beginPath()
  ctx?.moveTo(canvasL.value, y);
  ctx?.lineTo(canvasW.value-canvasL.value, y);
  ctx!.strokeStyle = "#000";
  ctx?.stroke();


  ctx?.beginPath()
  ctx?.moveTo(x, 0);
  ctx?.lineTo(x, canvasH.value-canvasBtm.value);
  ctx!.font = "15px";
  ctx?.strokeText(time, x, canvasH.value-canvasBtm.value);
  ctx!.strokeStyle = "#000";
  ctx?.stroke();
}

function createArc(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, 2 * Math.PI);
  ctx!.fillStyle="red";
  ctx!.strokeStyle = "red";
  ctx!.fill()
  ctx.stroke();
}
onMounted(() => {
  ctx = myCanvas.value!.getContext('2d') as unknown as CanvasRenderingContext2D
  createLineChart()
  myCanvas.value?.addEventListener('mousemove', function (e) {
    const { clientX, clientY } = e
    const { left, top } = myCanvas.value?.getBoundingClientRect() as DOMRect
    let dx = clientX - left;
    let dy = clientY - top
    // 按比例计算十字标内容 高260 宽550 
    let h = (max - min) / (canvasH.value-canvasBtm.value)
    let w = (canvasW.value-canvasL.value*2) / (data.value.length)
    let y = 0
    
    if (dy > ((canvasH.value-canvasBtm.value)/2)) {
      y = (-h * dy - min * 1).toFixed(2) as unknown as number
    } else {
      y = (max - h * dy).toFixed(2) as unknown as number
    }
    if (data.value[Math.floor((dx - canvasL.value) / w)]) {
      createdCrosshair(dx, dy, data.value[Math.floor((dx - canvasL.value) / w)].time, String(y))
      if ( (data.value[Math.floor((dx - canvasL.value) / w)].chg-(max-min)/70) <y && y< (data.value[Math.floor((dx - canvasL.value) / w)].chg+(max-min)/70)) {
        createArc(myCanvas2.value!.getContext('2d') as unknown as CanvasRenderingContext2D, data.value[Math.floor((dx - canvasL.value) / w)].x, data.value[Math.floor((dx - canvasL.value) / w)].y)
      }
    }
  })

  myCanvas.value?.addEventListener('mouseleave', function () {
    let ctx = myCanvas2.value!.getContext('2d')
    ctx?.clearRect(0, 0, canvasW.value, canvasH.value);
  })
})
let timer: number | null = null;
window.addEventListener('resize', function () {

  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  timer = setTimeout(() => {

    createLineChart()
  }, 1000)


})


</script>

<template>
  <div class="wrapper">
    <canvas ref="myCanvas" :width="canvasW" :height="canvasH" class="canvas_a"></canvas>
    <canvas ref="myCanvas2" :width="canvasW" :height="canvasH" class="canvas_b"></canvas>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}

.wrapper {
  position: relative;
  height: 600px;
  width: 1500px;

}

.canvas_a {
  position: absolute;
  top: 0;
  z-index: 1;
  left: 0;
}

.canvas_b {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
}
</style>

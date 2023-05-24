<template>
    <div class="histogram">
        
        <canvas ref="histogram" :width="canvasW" :height="canvasH"></canvas>
    </div>
    <button @click="changeType">切换</button>
</template>
<script setup lang="ts">
import {ref,onMounted} from "vue"
const histogram = ref<HTMLCanvasElement>()
let canvasCtx :CanvasRenderingContext2D|null= null,canvasW=ref(1000),canvasH=ref(600),histogramW=30,btm=50,fillFlag =false

function createData(){
    const res = new Array(15).fill(null).map((_,index)=>{
        return {
            id:index+1,
            value: Math.floor(Math.random()*15)
        }
    })
    return res
} 
const initData = createData()
console.log(initData);


function createCanvas(){
    let ratio = window.devicePixelRatio || 1
    histogram.value!.style.width = canvasW.value + 'px';
    histogram.value!.style.height = canvasH.value + 'px';
    histogram.value!.width = canvasW.value * ratio;
    histogram.value!.height = canvasH.value * ratio;
    canvasCtx?.scale(ratio, ratio);
    initData.forEach((item)=>{
        createHistogram(item.id*(histogramW+histogramW*0.4),item.value,item.value)
    })
    drawAxis()
}

function drawAxis(){
    // x轴
    canvasCtx?.beginPath()
    canvasCtx?.moveTo(0, canvasH.value-btm);
    canvasCtx?.lineTo(initData.length*(histogramW+histogramW*0.4)+50, canvasH.value-btm);
    canvasCtx!.strokeStyle = "#000";
    canvasCtx?.stroke();
    initData.forEach(item=>{
        canvasCtx!.font = "15px";
        canvasCtx?.strokeText(String(item.id), item.id*(histogramW+histogramW*0.4)+7, canvasH.value-30);
    })

}
function createHistogram(x:number,h:number,value:number){
    canvasCtx?.beginPath();
    canvasCtx!.lineWidth=2;
    canvasCtx!.strokeStyle="blue";
    if(fillFlag){
        canvasCtx!.fillStyle="blue";
    }
    
    canvasCtx?.rect(x,canvasH.value-h*15-btm,histogramW,h*15)
    
    if(fillFlag){
        canvasCtx?.fill()
    }
    canvasCtx!.font = "15px";
    canvasCtx?.strokeText(String(value), x+5, canvasH.value-h*15-btm-5);
    canvasCtx?.stroke()
}
onMounted(()=>{
    canvasCtx = histogram.value!.getContext('2d')
    createCanvas()
})
function changeType(){
    fillFlag = !fillFlag
    createCanvas()
}
let timer: number | null = null;
window.addEventListener('resize', function () {

  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  timer = setTimeout(() => {

    createCanvas()
  }, 1000)


})

</script>
<style scoped></style>
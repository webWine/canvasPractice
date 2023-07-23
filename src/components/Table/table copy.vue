<template>
  <div class="table-wrapper" :style="{ height: size.height + 'px' }">
    <!-- <canvas :id="'Table-header'"></canvas> -->
    <canvas :id="'Table-body'" :width="size.width" :height="size.height" ref="tableRef" class="em-table"></canvas>
    <div class="scrollYBar" v-if="YRadio > 0" :style="{top: headrHeight + 'px',height:YScrollHeight+ 'px'}">
      <span class="y-bar"
        :style="{ height: YRadio * YScrollHeight + 'px', top: YTop + 'px' }"
        @mousedown="mouseDownY"></span>
    </div>
    <div class="scrollXBar" v-if="XRadio < 1">
      <span class="x-bar" :style="{ width: XRadio * size.width + 'px', left: XTrans * (size.width * (1 - XRadio)) + 'px' }"
        @mousedown="mouseDownX"></span>
    </div>
    <img src="./assets/icon-nodata-notext.png" alt="" style="display:none" class="noDataImg" id="emTableNoDataImg">
    <img src="./assets/charIcon.png" alt="" style="display:none"   id="emTableCharIcon" >
  </div>
</template>

<script lang="ts">


export interface IColumns {
  field: string,
  key?: string,
  title?: string,
  width?: number,
  titleAlign?: string,
  align?: string,
  sortBy?: string,
  fixed?: string,
  children?: Array<IColumns>,
  showFilter?: boolean,
  isUseOutFilterList?: boolean,
  isFilterMultiple?: boolean
}
export type ISize = {
  width: number,
  height: number
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, Ref, watch, watchEffect } from "vue";
import { useHeader } from "./header.ts";
import { Canvas } from "./canvas"
import { useTableBody } from "./body";
import { useScroll } from "./scroll";

// import { watch } from "vue";

interface IProps {
  size?: ISize,
  columns: Array<IColumns> | [],
  rowHeight?: number,
  speed?: number,
  topData?: any[],
  footerData?: any[],
  noDataSetting?:object,
  tableData:any[]
}



const props = withDefaults(defineProps<IProps>(), {
  size: () => {
    return {
      width: 800,
      height: 600
    }
  },
  noDataSetting:()=>{
    return {
      show:true,
      text:"暂无数据"
    }
  },
  columns: () => [],
  rowHeight: 36,
  topData: () => [],
  tableData:()=>[],
  footerData:()=>[],
  speed:1
})

const emits = defineEmits(['cellClick', 'charClick'])


let YRadio = ref(0),
  YTrans = ref(0),
  XRadio = ref(0),
  XTrans = ref(0),
  headrHeight = ref(0),
  YScrollHeight = ref(0)


const cellClick = (e:any)=>{
  emits('cellClick',e)
}

const charClick = (e:any)=>{
  emits('charClick',e)
}


const tableRef: Ref<HTMLCanvasElement | undefined> = ref()
  const YTop = computed(()=>{
  return YTrans.value * (YScrollHeight.value * (1 - YRadio.value))
})
let { scrollDirection, mouseDownY, mouseDownX, barYScrollRadio, barXScrollRadio, movePos,mouseDownPos } = useScroll(tableRef, { size: props.size ,YTop})




watchEffect(() => {
  YTrans.value = barYScrollRadio.value
})

watchEffect(() => {
  XTrans.value = barXScrollRadio.value
})

watch(()=>props.columns,newVal=>{
  console.log("props.columns",newVal);
  
},{
  immediate:true,
  deep:true
})
onMounted(() => {
  let canvas = new Canvas(tableRef)
  const { finnalColumns, topPos } = useHeader(props.columns, canvas, {
    rowHeight: props.rowHeight,
    width: props.size.width
  })



  headrHeight.value = topPos + props.topData.length*props.rowHeight
  YScrollHeight.value = props.size.height - topPos - props.topData.length*props.rowHeight - props.footerData.length*props.rowHeight

  console.log("scrollDirection", YScrollHeight.value);


  const { scrollBarRatio, YTrans: tableYTrans, maxXWidth, } = useTableBody(
    props.tableData,
    finnalColumns,
    canvas,
    {
      size: props.size,
      topPos: topPos + 1,
      rowHeight: props.rowHeight,
      speed: props.speed,
      noDataSetting:props.noDataSetting
    },
    scrollDirection,
    props.columns,
    YTrans,
    XTrans,
    props.topData,
    props.footerData,
    movePos,
    mouseDownPos,
    {
      cellClick,
      charClick
    }
  )

  watchEffect(() => {
    YTrans.value = tableYTrans?.value || 0
  })
  YRadio.value = scrollBarRatio
  XRadio.value = props.size.width / (maxXWidth || 1)
})
</script>

<style scoped>
.table-wrapper {
  position: relative;
  /* width: 800px; */
  height: 400px;
  border: 1px solid #D1D5D9;
  padding-bottom: 8px;
}

.scrollYBar {
  position: absolute;
  width: 8px;
  height: 100%;
  /* background-color: #D1D5D9; */
  right: 0;
  top: 0;
}

.y-bar {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  /* transition: all 0.1s ease; */
  background-color: #ccc;
  display: block;
  /* margin: auto; */
  border-radius: 4px;
}

.scrollXBar {
  position: absolute;
  width: calc(100% - 8px);
  height: 8px;
  left: 0;
  bottom: 0;
  background-color: #fff;
}

.x-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 8px;
  /* transition: all 0.1s ease; */
  background-color: #ccc;
  display: block;
  /* margin: auto; */
  border-radius: 4px;
}
.noDataImg{
  width: 88px;
  height: 88px;
}

.em-table {}</style>
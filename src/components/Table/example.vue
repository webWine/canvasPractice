<template>
    <Table :columns="columnsRef" :size="size" :tableData="tableDataRef" @cellClick="cellClick" @charClick="charClick" :topData="topData" :footerData="footerData" />
</template>
<script lang="ts" setup>
import Table from "./table.vue"
import { columns, topData, footerData } from "./data"
import tableData from "./data"
import { onMounted, ref } from "vue";
import { throttle } from "lodash";

const columnsRef = ref(columns)

const size = ref({
    width: 800,
    height: 600
})
const cellClick = (e) => {
    console.log('cellClick', e);
}
const charClick = (e) => {
    console.log('charClick', e);
}
onMounted(() => {
    size.value.width = document.body.offsetWidth - 10
    size.value.height = document.body.offsetHeight - 10
})

const throttleFun = throttle(() => {
    size.value.width = document.body.offsetWidth - 10
    size.value.height = document.body.offsetHeight - 10
}, 200)

window.addEventListener('resize', function () {
    throttleFun()
})

const tableDataRef = ref(tableData)
</script>
<style scoped></style>
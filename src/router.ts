import {RouteRecordRaw, createRouter,createWebHashHistory} from "vue-router"

const routes : Array<RouteRecordRaw>=[
    {
        path:"/",
        component:()=>import("./components/lineChart.vue")
    },{
        path:"/histogram",
        component:()=>import("./components/histogram.vue")
    },{
        path:"/table",
        component:()=>import("./components/table.vue")
    },{
        path:"/tablea",
        component:()=>import("./components/tablea.vue")
    }
]
const router = createRouter({
    history:createWebHashHistory(),
    routes
})
export default router
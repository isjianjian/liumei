// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const electron = require('electron');
var ipc = electron.ipcRenderer;
var log = require('electron-log');
log.info("index.......")

var vm = new Vue({
    el: '#app',
    data: {
        columns1: [
            {
                title: 'ID',
                key: 'id'
            },
            {
                title: '名称',
                key: 'name'
            },
            {
                title: '原始流',
                key: 'url'
            },
            {
                title: '文件路径',
                key: 'filename'
            },
            {
                title: '状态',
                key: 'status',
                render: (h, params) => {
                    if (params.row.status == 0){
                        return h('span',{style:{color:"blue"}},'初始化')
                    }
                    if (params.row.status == 1){
                        return h('span',{style:{color:"green"}},'进行中')
                    }
                    if (params.row.status == 2){
                        return h('span',{style:{color:"red"}},'已停止')
                    }

                }
            },{
                title: '重试次数',
                key: 'retry'
            },
            {
                title: '帧数变化时间',
                key: 'time',
                render:(h, params) => {
                    var date = new Date(params.row.time)
                    return  date.getFullYear() + "-" + date.getMonth() + "-"+ date.getDay()
                        +  " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
                       + ":" + date.getMilliseconds()
                }

            }
        ],
        lives: [

        ],
        loading:true,
        status:0
    },
    methods: {
      
    },
    mounted:function () {

    }
})

ipc.on("lives",function (event, arg) {
    vm.lives = arg
    vm.loading = false
})
ipc.on("status",function (event, arg) {
    vm.status = arg

})



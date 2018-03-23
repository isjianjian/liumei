// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const electron = require('electron');
var ipc = electron.ipcRenderer;
var log = require('electron-log');

log.info("set.......")

var vm = new Vue({
    el: '#app',
    data: {
        conf:{}
    },
    methods:{
        update:function () {
            ipc.send("up-conf",vm.conf)
        }
    },
    mounted () {
        log.info("get conf")
        ipc.send("get-conf","")
    }
})

ipc.on("conf",function (event, arg) {
    vm.conf = arg
})




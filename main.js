if(require('electron-squirrel-startup')) return;
const electron = require('electron')
/// / Module to control application life.
const app = electron.app
const Tray = electron.Tray
const Menu = electron.Menu
var ipc = electron.ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const io = require('socket.io-client');
const exec = require('child_process').exec
var fs = require('fs');
var log = require('electron-log');

var util = require('util');
const INI = require('./lib/ini')

/**
 *
 *  TODO 打包配置
 */

var electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: '/tmp/build/my-app-64',
    outputDirectory: '/tmp/build/installer64',
    authors: 'My App Inc.',
    exe: 'myapp.exe'
});

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function(command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
        } catch (error) {}

        return spawnedProcess;
    };

    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            app.quit();
            return true;
    }
};

//

var  server_status = 0
var CONF = {}

let lives = [];
const ini___ = INI.loadFileSync("conf.ini")

const export_time = 10 * 60 * 1000

/*
    TODO 服务配置
 */

function init_conf() {
    CONF = ini___.getOrCreateSection("conf");
}

// Log level
log.transports.console.level = 'info';

/**
 * Set output format template. Available variables:
 * Main: {level}, {text}
 * Date: {y},{m},{d},{h},{i},{s},{ms},{z}
 */
log.transports.console.format = '{y}-{m}-{d} {h}:{i}:{s}:{ms} [{level}] {text}';
log.transports.file.appName = 'mq';

// Same as for console transport
log.transports.file.level = 'info';
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}:{ms} [{level}] {text}';

// Set approximate maximum log size in bytes. When it exceeds,
// the archived log will be saved as the log.old.log file
log.transports.file.maxSize = 5 * 1024 * 1024;

// Write to this file, must be set before first logging

//log.transports.file.file = __dirname + '/logs/log.log';
// fs.createWriteStream options, must be set before first logging
// you can find more information at
// https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
log.transports.file.streamConfig = { flags: 'w' };

// set existed file stream
log.transports.file.stream = fs.createWriteStream('logs/'+ new Date().getTime() +'.log');


/***
 *   TODO 窗口配置
 */


/**
 * TODO 扩展方法
 *
 */

Array.prototype.remove = function(val) {      //按元素删除数组
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};


/***
 * TODO 菜单配置
 */
function initMenu() {
    app.setName("流媒体服务")

    const template = [
        {
            label: '选项',
            submenu: [
                {
                    label: '设置',
                    click () {
                        openSet()
                    }
                },
                {
                    label: '查看日志',
                    click () { require('electron').shell.openExternal('https://electronjs.org') }
                }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click () { require('electron').shell.openExternal('https://electronjs.org') }
                }
            ]
        }
    ]

    if (process.platform === 'darwin') {
        template.unshift({
            label: '流媒体服务',
            submenu: [
                {role: 'quit'}
            ]
        })


    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}


/**
 *
 *  TODO electron区
 */


const COM_TEMP =['@ffmpeg -re -i  @url -c\\:v copy -c\\:a copy -q:v 2  -s 720x576 -hls_wrap 10 -f hls @file'
    ,'@ffmpeg -f rtsp -i @url -c\\:v copy -c\\:a copy -q:v 2  -s 720x576 -hls_wrap 10 -f hls @file'];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let tray = null
let mainWindow

function createWindow () {
    ipc.on('get-conf', (event, arg) => {
        console.log(arg)  // prints "ping"
        event.sender.send('conf', CONF)
    })

    ipc.on('up-conf', (event, arg) => {
        ini___.update("conf",arg)
        CONF = arg
        start_live_server()
    })

  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: 800,
      height: 800,
      // closable:false,
     // fullscreen:false,
     // fullscreenable:false,
     // resizable:false,
      title:'流媒体服务'
  })
    mainWindow.on('show', () => {
        sendLive()

    })
    mainWindow.on('hide', () => {

    })

    // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
    init_conf()
    initMenu()
    tray = new Tray('img/live.png')
    tray.on('click', () => {
        if (mainWindow == null){
            createWindow()
        }else {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
        }
    })

    createWindow()
    start_live_server()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})


/**
 *
 *  TODO 直播操作区
 */



//启动流媒体服务器
function start_live_server(){
    log.info('服务启动  ')
    for(var i = 0;i<2;i++){
        addLive('http://live.hkstv.hk.lxdns.com/live/hks/playlist.m3u8','live/test' + i + ".m3u8",i,i)
    }

    var socket = io.connect('http://192.168.2.170:8001');
    socket.on('connect',function (data) {
        socket.emit("getLive")
        log.info('已连接到主服务器')
        server_status = 1
    })
    socket.on('connect_error',function (data) {
        log.info('连接出错...')
        server_status = 3
    })
    socket.on('connect_timeout',function (data) {
        log.info('连接超时...')
        server_status = 3
    })

    socket.on('disconnect',function (data) {
        log.info('断开连接...')
        server_status = 2

    })
    socket.on('lives',function (data) {
        log.info(typeof data)
        stopAll()
        lives = []
        for(var i = 0;i<data.length;i++){
            addLive(data[i].streamAddr,data[i].address,data[i].id,data[i].name)
        }

    })
    socket.on('sendLiveMassage',function (data) {
        log.info(typeof data)
        data = JSON.parse(data)
        log.info("sendLiveMassage",data)
        if (data.order == 1){
            addLive(data.adress,data.liveName,data.id,data.name)
            log.info("新增直播",data)
        }
        if (data.order == 2){
            removeLive(data.id)
            addLive(data.adress,data.liveName,data.id,data.name)
            log.info("更新直播",data)
        }
        if (data.order == 3){
            removeLive(data.id)
            log.info("删除直播",data)
        }


    })


    setInterval(function () {
        for (var i = 0 ; i < lives.length;i++){
            if (lives[i].time + export_time < new Date().getTime() && lives.status != 2){
                lives[i].exec.kill()
                lives[i].status = 0
                lives[i].exec = init_live(lives[i].url,lives[i].filename)
                sendLive()
            }
        }
    },10000)

}


// 初始化流媒体
function init_live(url,filename) {
    var option = {}

    var hz = url.substring(url.lastIndexOf("."),url.length).toLowerCase()

    if (hz == '.m3u8' || hz == '.flv'){
        option.type = 0
    }else {
        option.type = 1
    }
    option.file = CONF.dir + filename;
    return live_exec(url,option)
}

function live_exec(url,o) {       //执行拉流命令

    var com =  COM_TEMP[0]

    if (o.type != null){
        com = COM_TEMP[o.type];
    }

    com = com.replace("@ffmpeg",CONF.ffmpeg)
        .replace("@url",url)
        .replace("@file",o.file)
    log.info(com)
    const e = exec(com)

    e.stdout.on('data', data => {
        log.info('stdout: ', data)
    })

    e.stderr.on('data', (data) => {
        var live = getlive(e)
        if(data.substring(0,data.indexOf('=')) == "frame"){
            live.time = new Date().getTime()
            live.retry = 0
            live.status = 1
            sendLive()
        }
    })

    e.on('close', (code) => {
        var live = getlive(e)
       if (code != 255 && live.retry < parseInt(CONF.retry)){
           console.log("意外退出，重新拉流")
           if (live != null){
               live.status = 0
               live.exec = live_exec(url,o)
               live.retry ++
               sendLive()
           }
       }else {
           log.info("直播已退出")
           if (live != null){
               live.status = 2
           }
           sendLive()
       }
    });

    return e;
}



function getlive(e) {        // 获取
    for (var i = 0 ; i < lives.length;i++){

        if (lives[i].exec == e || lives[i].id == e){
            return lives[i]
        }
    }
}

function addLive(url,filename,id,name) {  //添加
    var live = {}
    live.url = url
    live.id = id;
    live.filename = filename
    live.exec = init_live(url,filename)
    live.retry = 0
    live.time = new Date().getTime()
    live.status = 0
    live.name  = name
    lives.push(live)
}

function removeLive(id) {   //删除
    var live = getlive(id)

    if (live != null){
        if (live.exec != null){
            live.exec.kill()
        }
        lives.remove(live)
    }
}

function stopAll() {
    for (var i = 0 ; i < lives.length;i++){
      lives[i].exec.kill()
    }
}


function sendLive() {
    if (mainWindow == null) return
    var localLive = []
    for (var i = 0 ; i < lives.length;i++){
        var live = {}
        live.url = lives[i].url
        live.filename = lives[i].filename
        live.status = lives[i].status
        live.id = lives[i].id
        live.name = lives[i].name
        live.time = lives[i].time
        live.retry = lives[i].retry
        localLive.push(live)
    }
    mainWindow.webContents.send('lives', localLive)
    mainWindow.webContents.send('status', server_status)
}


function openSet() {
    let child = new BrowserWindow({parent: mainWindow})
    child.loadURL(url.format({
        pathname: path.join(__dirname, 'set.html'),
        protocol: 'file:',
        slashes: true
    }))
    child.show()
}



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

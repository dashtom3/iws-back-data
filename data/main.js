'use strict';


import formidable from 'formidable'
import snap7 from 'node-snap7'
import axios from 'axios'
import handler from './ModbusStringHandler'
import net from 'net'
import SensorModel from '../models/system/sensor'
import DataModel from '../models/system/data'
import dtime from 'time-formater'
import { start } from 'repl';
var snap7Enum = require('node-snap7')
const url = "http://localhost:6784/"
class Main {
    constructor() {
         this.tcpDataSet = {}
         this.modbusDataSet = {}
         this.modbusSocket = net.createServer()
         this.startRead = this.startRead.bind(this)
         this.stopRead = this.stopRead.bind(this)
         this.writeDate = this.writeDate.bind(this)
    }
    async getAllData(){
        console.log("获取所有传感器")
        // console.log(url+'allStartSensor')
        //var p = await axios.get(url+'data/allStartSensor')
        var sensor = await SensorModel.find({'isStart':true}, '-__v -oldAlarmData -oldData -data').populate('point').populate('alarm')
        // console.log(sensor[0].point)
        // console.log(p.data)
        this.analyse(sensor)
        console.log(this.tcpDataSet,this.modbusDataSet)
        this.collectData()
    }
    dataStore(sensor,data){
        if(!sensor){
            return 
        }
        var newData = {create_time:dtime().format('YYYY-MM-DD HH:mm:ss'),data:data}
        // console.log(newData)
        //tcp
        var alarm = false
        var alarmContent = ""
        var allData = data.split(",")
        if(sensor.transfer_type == 1) {
            var addressStart = sensor.point.pointEnum[0].place
            sensor.alarm.alarmEnum.forEach((item,index)=>{
                if(item.isAlarm == true){
                    var num = parseInt(sensor.point.pointEnum[index].place)-addressStart
                    switch (sensor.point.pointEnum[index].type) {
                        case 0:
                            var temp = ""
                            for(var i=0;i<sensor.point.pointEnum[index].placeLength;i++){
                                temp = temp+(Array(8).join('0') + (parseInt(allData[num+i])).toString(2)).slice(-8);
                            }
                            //console.log(sensor.point.pointEnum[index].name,allData[num-1],allData[num])
                            var datatemp = parseInt(temp,2)/sensor.point.pointEnum[index].times
                            //console.log(datatemp)
                            if(!(datatemp>=item.low && datatemp<=item.high)){
                                alarm = true
                                alarmContent = alarmContent+sensor.point.pointEnum[index].name+",实际值:"+datatemp+"超出上下限("+item.low+","+item.high+");"
                            }
                            break;
                        case 1:
                            var datatemp = allData[num]
                            switch (datatemp) {
                                case 36:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',热继故障;'
                                    break;
                                case 68:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',空开跳闸;'
                                    break;
                                case 132:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',变频故障;'
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case 2:
                            var datatemp = allData[num]
                            switch (datatemp) {
                                case 1:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',无水故障;'
                                    break;
                                case 2:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',高水信号;'
                                    break;
                                case 4:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',地面积水信号;'
                                    break;
                                case 8:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',相序故障;'
                                    break;
                                case 16:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',出口超压;'
                                    break;
                                case 32:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',门禁报警;'
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case 3:
                        case 4:
                        case 5:
                            var temp = sensor.point.pointEnum[index].place.toString().split('.')
                            var datatemp = allData[num]
                            
                            datatemp = (Array(8).join('0') + (parseInt(datatemp)).toString(2)).slice(-8);
                            //console.log(datatemp)
                            var data2 = temp.length>1 ? datatemp.charAt(8-parseInt(temp[1])-1):datatemp.charAt(7) //1800.0 没有.0
                            //console.log(data2)
                            if(data2 == '1'){
                                alarm = true
                                alarmContent = alarmContent+sensor.point.pointEnum[index].name+',是;'
                            }
                            
                            break;
                        default:
                            break;
                    }
                }
                // console.log(index)
            })
        } else if(sensor.transfer_type == 0) {
            sensor.alarm.alarmEnum.forEach((item,index)=>{
                if(item.isAlarm == true){
                    switch (sensor.point.pointEnum[index].type) {
                        case 0:
                            //console.log(sensor.point.pointEnum[index].name,allData[num-1],allData[num])
                            var datatemp = parseInt(allData[index])/sensor.point.pointEnum[index].times
                            // console.log(datatemp)
                            if(!(datatemp>=item.low && datatemp<=item.high)&&(datatemp != 0)){
                                alarm = true
                                alarmContent = alarmContent+sensor.point.pointEnum[index].name+",实际值:"+datatemp+"超出上下限("+item.low+","+item.high+");"
                            }
                            break;
                        case 1:
                            var datatemp = allData[index]
                            switch (datatemp) {
                                case 36:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',热继故障;'
                                    break;
                                case 68:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',空开跳闸;'
                                    break;
                                case 132:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',变频故障;'
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case 2:
                            var datatemp = allData[index]
                            switch (datatemp) {
                                case 1:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',无水故障;'
                                    break;
                                case 2:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',高水信号;'
                                    break;
                                case 4:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',地面积水信号;'
                                    break;
                                case 8:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',相序故障;'
                                    break;
                                case 16:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',出口超压;'
                                    break;
                                case 32:
                                    alarm = true
                                    alarmContent = alarmContent+sensor.point.pointEnum[index].name+',门禁报警;'
                                    break;
                                default:
                                    break;
                            }
                            break;
                        case 3:
                        case 4:
                        case 5:
                            var datatemp = allData[index]
                            // console.log(datatemp)
                            //console.log(data2)
                            if(datatemp == 1){
                                alarm = true
                                alarmContent = alarmContent+sensor.point.pointEnum[index].name+',是;'
                            }
                            
                            break;
                        default:
                            break;
                    }
                }
            })
        }
            
            // console.log(alarmContent)
            //该条报警
            if(alarm == true) {
                // console.log(sensor)
                if(sensor.alarmData != null) {
                    sensor.alarmData.info = alarmContent
                    sensor.alarmData.data = data
                    if(sensor.transfer_type == 1){
                        this.tcpDataSet[sensor.ip].alarmData.info = alarmContent
                        this.tcpDataSet[sensor.ip].alarmData.data = data
                    }else {
                        this.modbusDataSet[sensor.ip][sensor.zhan].alarmData.info = alarmContent
                        this.modbusDataSet[sensor.ip][sensor.zhan].alarmData.data =data
                    }
                    // console.log(data,alarmContent)
                    console.log("报警数据更新",sensor.alarmData)
                    // console.log(sensor.alarmData.info)
                    //TODO 报警worker会不会更新没
                    SensorModel.findOneAndUpdate({'_id':sensor._id},{$set:{data:newData,'alarmData.info':sensor.alarmData.info,'alarmData.data':sensor.alarmData.data}}).then()
                    newData.sensor = sensor._id
                    DataModel.create(newData)
                }else {
                    sensor.alarmData = {
                        info:alarmContent,
                        data:data,
                        create_time:dtime().format('YYYY-MM-DD HH:mm:ss'),
                        stop_time:null,
                        worker:null,
                        worker_time:null,
                        finish_time:null,
                    }
                    if(sensor.transfer_type == 1){
                        this.tcpDataSet[sensor.ip].alarmData = sensor.alarmData
                    }else {
                        this.modbusDataSet[sensor.ip][sensor.zhan].alarmData = sensor.alarmData
                    }
                    console.log("报警数据创建",sensor.alarmData)
                    SensorModel.findOneAndUpdate({'_id':sensor._id},{$set:{data:newData,alarmData:sensor.alarmData}}).then()
                    newData.sensor = sensor._id
                    DataModel.create(newData)
                }
            }else {
            //数据不报警  
           
                if(sensor.alarmData != null) {
                    // sensor.alarmData.stop_time = dtime().format('YYYY-MM-DD HH:mm:ss')
                    // var temp = JSON.parse(JSON.stringify(sensor.alarmData))
                    console.log("存储报警数据",sensor.alarmData)
                    SensorModel.findOne({'_id':sensor._id},'-oldAlarmData').then((data)=>{
                        console.log(data)
                        data.alarmData.stop_time = dtime().format('YYYY-MM-DD HH:mm:ss')
                        SensorModel.findOneAndUpdate({'_id':sensor._id},{$set:{data:newData,alarmData:null},$push:{oldAlarmData:data.alarmData}}).then()
                    })
                    newData.sensor = sensor._id
                    DataModel.create(newData)
                    if(sensor.transfer_type == 1){
                        this.tcpDataSet[sensor.ip].alarmData = null
                    }else {
                        this.modbusDataSet[sensor.ip][sensor.zhan].alarmData = null
                    }
                }else {
                    console.log("没有报警数据",sensor.alarmData)
                    SensorModel.findOneAndUpdate({'_id':sensor._id},{$set:{data:newData}}).then()
                    newData.sensor = sensor._id
                    DataModel.create(newData)
                }
            }
        
    }
    analyse(data){
        this.modbusDataSet = {}
        this.tcpDataSet = {}
        data.forEach(item=>{
            if(item.transfer_type == 0) {
                if(!this.modbusDataSet[item.ip]){
                    this.modbusDataSet[item.ip] = {}
                }
                this.modbusDataSet[item.ip][item.zhan] = item
                // console.log(this.modbusDataSet[item.ip])
            } else {
                this.tcpDataSet[item.ip] = item
            }
        })
    }
//modbus协议解析   
//[11][01][00][13][00][25][CRC低][CRC高] 所有都为16进制 
//<1> <2> <3> <4> <5> <6> <7> <8>
//<1>设备地址：站号 <2> 01 读取数字量的命令号固定为01 <3> 想读取的开关量的起始地址的高八位 <4> 想读取的开关量的起始地址的低八位
//<5>想读取的开关量的数量起始地址的高八位 <6> 想读取的开关量的数量的低八位 <7> <8> CRC的低八位和高八位
//返回值
//[11][01][05][CD][6B][B2][0E][1B][CRC低][CRC高]
//[设备地址] [命令号01] [返回的字节个数][数据1][数据2]...[数据n][CRC校验的低8位] [CRC校验的高8位]
    collectData(){
        for(var i in this.tcpDataSet) {
            this.tcpCollectData(this.tcpDataSet[i])
        }
        this.modbusSocket.listen(6790,'0.0.0.0')
        this.modbusSocket.on('connection',(client)=>{ 
            console.log(client.remoteAddress)
            client.on('data',data=>{
                // console.log(data)
                // console.log(client.remoteAddress)
                var tempResult = handler.ResponseHandler(data.toString())
                console.log(11,tempResult.data.join())
                if(data && tempResult.data.length>0){
                    this.dataStore(this.modbusDataSet[client.remoteAddress][tempResult.unitId],tempResult.data.join())
                }
                
            })
            if(this.modbusDataSet[client.remoteAddress]){
                if(!this.modbusDataSet[client.remoteAddress].interval){
                    this.modbusDataSet[client.remoteAddress].interval = setInterval(()=>{
                        for(var i in  this.modbusDataSet[client.remoteAddress])
                        {   
                            if(i != "interval"){
                                try{ 
                                    // console.log(this.modbusDataSet[client.remoteAddress][i])   
                                    if(this.modbusDataSet[client.remoteAddress][i].WC){
                                        var tempWC = this.modbusDataSet[client.remoteAddress][i].WC
                                        // console.log(3333333,tempWC[0],tempWC[1])
                                        // console.log(tempWC[0].toString(16),tempWC[1].toString(16))
                                        var command = handler.CMD_WriteCommand(i,parseInt(tempWC[0]),parseInt(tempWC[1]))+'\r\n'
                                        console.log(command)
                                          this.modbusDataSet[client.remoteAddress][i].WC = null
                                          
                                          client.write(command)
                                        
                                    }else {
                                        var tempZhan = this.modbusDataSet[client.remoteAddress][i].zhan
                                        var tempLength = this.modbusDataSet[client.remoteAddress][i].point.pointEnum.length
                                        var command = handler.CMD_ReadHoldingRegisters(tempZhan,0,tempLength)+'\r\n'
                                        console.log(command)  
                                        client.write(command)     
                                    }
                                }catch(res){
                                    console.log(res) 
                                }
                                // console.log(222222,this.modbusDataSet[client.remoteAddress][i])
                                
                                  
                            }
                            
                        }
                    },5000)
                }
            }
        })
    }
    tcpCollectData(item){
        var s7client = new snap7.S7Client()
        if(this.tcpDataSet[item.ip]){
            this.tcpDataSet[item.ip].s7client = s7client
            // console.log( this.tcpDataSet[item.ip])
            try{
                s7client.ConnectTo(item.ip,0,1,(err)=>{
                    if(err){
                        setTimeout(()=>{
                            this.tcpCollectData(item)
                        },20000)
                        return console.log(item.ip+"错误")
                    }
                        
                    
                    this.tcpReadData(item)
                })
            }catch(err){
                console.log(err)
            }
            
        }
        
    }
    tcpReadData(item){
        // console.log(item)
        var startAddress = item.point.pointEnum[0].place
        var lastAddressNum = item.point.pointEnum.length-1
        var datalength = item.point.pointEnum[lastAddressNum].place-startAddress+item.point.pointEnum[lastAddressNum].placeLength
        // console.log(startAddress,lastAddressNum,datalength)
        if(this.tcpDataSet[item.ip]){
            this.tcpDataSet[item.ip].interval = setInterval(()=>{
                console.log("开始读数据") 
                if(this.tcpDataSet[item.ip]){
                    try{
                        
                        this.tcpDataSet[item.ip].s7client.DBRead(1,startAddress,datalength,(err,res)=>{
                            if(err){
                                return console.log(item.ip+"读数据错误")
                            }
                            console.log("发送数据:"+item.ip+","+res.join()) 
                            //axios.post(url+'data/collectData/'+item._id,{data:res.join()})
                            this.dataStore(item,res.join())
                        })
                    }catch(err){
                        console.log(err)
                    }
                    
                }
            },5000)
        }
    }
             
    async startRead(req, res, next){
        console.log("开启")
        // console.log(this.tcpDataSet)
        var device = req.body
        try {
        //TCP
            if(device.sensor[0].transfer_type == 1){
                device.sensor.forEach(item=>{
                    if(this.tcpDataSet[item.ip]){
                        console.log(this.tcpDataSet)
                        clearInterval( this.tcpDataSet[item.ip].interval)
                        this.tcpDataSet[item.ip].s7client.Disconnect()
                          
                    }
                    this.tcpDataSet[item.ip] = item
                    this.tcpCollectData(item)
                })
            }else {
            //MODEBUS
                device.sensor.forEach(item=>{
                    if(!this.modbusDataSet[item.ip]){
                        this.modbusDataSet[item.ip] = {}
                    }
                    this.modbusDataSet[item.ip][item.zhan] = item
                })    
            }
            res.send({
                status: 1,
                message: '开启成功'
            })
        } catch (error) {
            console.log(error)
        }
        
    }
    async writeDate(req,res,next){
        console.log("写数据")
        var {transfer_type,ip,zhan,startAddress,datalength,bitnum,buffer} = req.body
        console.log(req.body)
        //TCP
        if(transfer_type == 1){
                if(this.tcpDataSet[ip]){
                    console.log(this.tcpDataSet[ip])
                    // clearInterval( this.tcpDataSet[item.ip].interval) 
                    // this.tcpDataSet[item.ip].s7client.Disconnect()
                    // delete this.tcpDataSet[item.ip]
                    var tempClient = this.tcpDataSet[ip].s7client
                    
                    var tempLength = tempClient.S7WLBit
                    var tempStart;
                    var numAll=0; 
                    switch (parseInt(datalength)) {
                        case 0:
                            tempLength = tempClient.S7WLBit
                            tempStart = startAddress*8+parseInt(bitnum)
                            numAll=8
                            break;
                        case 1:
                            tempLength = tempClient.S7WLByte
                            tempStart = startAddress
                            numAll=8
                            break;
                        case 2:
                            tempLength = tempClient.S7WLByte
                            tempStart = startAddress
                            numAll=16
                            break;
                        case 4:
                            tempLength = tempClient.S7WLByte
                            tempStart = startAddress
                            numAll=32
                            break;

                        default: 
                            break;
                    }
                    var tempDataInt = (Array(numAll).join(0)+parseInt(buffer).toString(2)).slice(-numAll)
                    var tempDataResult = []
                    for(var i=0;i<tempDataInt.length/8;i++){
                        
                        tempDataResult.push(parseInt(tempDataInt.substring(0+i*8,8+8*i),2))
                    }

                    var tempbuffer = new Buffer(tempDataResult); 
                    // var tempbuffer = new Buffer([15,]); 
                    console.log(tempStart,tempLength,tempbuffer.length,tempbuffer)
                    this.tcpDataSet[ip].s7client.WriteArea(tempClient.S7AreaDB,1,parseInt(tempStart),tempbuffer.length,tempLength,tempbuffer,(err,res2)=>{
                        console.log(111111,err,res2)  
                        if(err){
                            res.send({
                                status: 0,
                                message: '写数据失败'
                            })
                            return console.log(ip+"写数据错误")
                        }
                        res.send({
                            status: 1,
                            message: '写数据成功'
                        })
                        return 
                    })
                    // this.tcpDataSet[ip].s7client.WriteArea(tempClient.S7AreaDB,1,startAddress,1,tempLength,buffer)
                    // tempClient.S7AreaDB,1,startAddress,1,tempLength,buffer,((err,res2)=>{
                    // this.tcpDataSet[ip].s7client.DBWrite(1,startAddress,tempLength,new Buffer(parseInt(buffer)),(err,res2)=>{
                        // this.tcpReadData(item)
                        
                        
                        // console.log("发送数据:"+item.ip+","+res.join()) 
                        //axios.post(url+'data/collectData/'+item._id,{data:res.join()})
                        // this.dataStore(item,res.join())
                    // }))
                }else {
                    res.send({
                        status: 0,
                        message: '设备未启动'
                    })
                    return 
                }
        }else {
        //MODEBUS 
            if(this.modbusDataSet[ip]){
                
                if(this.modbusDataSet[ip][zhan]){
                    
                    this.modbusDataSet[ip][zhan].WC = [startAddress,buffer]
                    res.send({
                        status: 1,
                        message: '写数据成功'
                    })
                    return 
                }
            }  
            res.send({
                status: 0,
                message: '写数据失败'
            })
            return 
        }
    }
    async stopRead(req, res, next){
        console.log("关闭")
        var device = req.body
        //TCP
        if(device.sensor[0].transfer_type == 1){
            device.sensor.forEach(item=>{
                if(this.tcpDataSet[item.ip]){
                    console.log(this.tcpDataSet[item.ip])
                    clearInterval( this.tcpDataSet[item.ip].interval) 
                    this.tcpDataSet[item.ip].s7client.Disconnect()
                    delete this.tcpDataSet[item.ip]  
                }
            })
        }else {
        //MODEBUS   
            device.sensor.forEach(item=>{
                if(this.modbusDataSet[item.ip]){
                    if(this.modbusDataSet[item.ip][item.zhan]){
                        delete this.modbusDataSet[item.ip][item.zhan]
                    }
                }
                if(this.modbusDataSet[item.ip] == {}){
                    console.log("无数据")
                    clearInterval( this.modbusDataSet[item.ip].interval) 
                }
            })  
        }
        console.log(this.tcpDataSet)
        res.send({
            status: 1,
            message: '关闭成功'
        })
    }
   

}

export default new Main()

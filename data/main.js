'use strict';


import formidable from 'formidable'
import snap7 from 'node-snap7'
import axios from 'axios'
var tcpDataSet = {}
var modbusDataSet = {}
const url = "http://localhost:6784/"
class Main {
    constructor() {
        // tcpDataSet = {}
        // this.modbusDataSet = {}
    }
    async getAllData(){
        // console.log(url+'allStartSensor')
        var p = await axios.get(url+'data/allStartSensor')
        // console.log(p.data)
        this.analyse(p.data.data)
        console.log(tcpDataSet,modbusDataSet)
        this.collectData()
    }
    analyse(data){
        modbusDataSet = {}
        tcpDataSet = {}
        data.forEach(item=>{
            if(item.transfer_type == 0) {
                if(modbusDataSet[item.ip]){
                    modbusDataSet[item.ip].push(item)
                }else {
                    modbusDataSet[item.ip] = [item]
                }
                
            } else {
                tcpDataSet[item.ip] = item
            }
        })
    }
    collectData(){
        for(var i in tcpDataSet) {
            this.tcpCollectData(tcpDataSet[i])
        }
    }
    tcpCollectData(item){
        var s7client = new snap7.S7Client()
        tcpDataSet[item.ip].s7client = s7client
        s7client.ConnectTo(item.ip,0,1,(err)=>{
            if(err)
                return console.log(s7client.ErrorText)
            var startAddress = item.point.pointEnum[0].place
            var lastAddressNum = item.point.pointEnum.length-1
            var datalength = item.point.pointEnum[lastAddressNum].place-startAddress+item.point.pointEnum[lastAddressNum].placeLength
            console.log(startAddress,lastAddressNum,datalength)
            s7client.DBRead(1,startAddress,datalength,(err,res)=>{
                if(err)
                    return console.log(s7client.ErrorText)
                console.log(res.join())
            })
        })
    }
    async startRead(req, res, next){
        console.log(req.body)
        var device = req.body
        try {
            console.log(Main)
            console.log(tcpDataSet)
        //TCP
            if(device.sensor[0].transfer_type == 1){
                device.sensor.forEach(item=>{
                    console.log(tcpDataSet)
                    // if(tcpDataSet[item.ip]){
                    //     console.log(tcpDataSet)
                    //     tcpDataSet[item.ip].s7client.stop()  
                    // }
                    tcpDataSet[item.ip] = item
                    Main.tcpCollectData(item)
                })
            }else {
            //MODEBUS    
            }
            res.send({
                status: 1,
                message: '开启成功'
            })
        } catch (error) {
            console.log(error)
        }
        
    }
    async stopRead(req, res, next){
        console.log(req.body)
        var device = req.body
        //TCP
        if(device.sensor[0].transfer_type == 1){
            device.sensor.forEach(item=>{
                if(tcpDataSet[item.ip]){
                    // tcpDataSet[item.ip].s7client.stop()
                    delete tcpDataSet[item.ip]  
                }
            })
        }else {
        //MODEBUS    
        }
        res.send({
            status: 1,
            message: '关闭成功'
        })
    }
   

}

export default new Main()

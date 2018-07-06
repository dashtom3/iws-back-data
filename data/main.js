'use strict';


import formidable from 'formidable'
import snap7 from 'node-snap7'
import axios from 'axios'
const url = "http://localhost:8001/"
class Main {
    constructor(tcpDataSet,modbusDataSet) {
        this.tcpDataSet = tcpDataSet
        this.modbusDataSet = modbusDataSet
    }
    async getAllData(){
        console.log(url+'allStartSensor')
        var p = await axios.get(url+'data/allStartSensor')
        console.log(p.data)
        this.analyse(p.data.data)
        console.log(this.tcpDataSet,this.modbusDataSet)
        this.collectData()
    }
    analyse(data){
        this.modbusDataSet = []
        this.tcpDataSet = []
        data.forEach(item=>{
            if(item.transfer_type == 0) {
                this.modbusDataSet.push(item)
            } else {
                this.tcpDataSet.push(item)
            }
        })
    }
    collectData(){
        this.tcpDataSet.forEach(item=>{
            this.tcpCollectData(item)
        })
    }
    tcpCollectData(item){
        var s7client = new snap7.S7Client()
        s7client.ConnectTo(item.ip,0,1,(err)=>{
            if(err)
                return console.log(err+'-'+s7client.ErrorText)
            var startAddress = item.point.pointEnum[0].place
            var lastAddressNum = item.point.pointEnum.length-1
            var datalength = item.point.pointEnum[lastAddressNum].place-startAddress+item.point.pointEnum[lastAddressNum].placeLength
            s7client.DBRead(1,startAddress,datalength,(err,res)=>{
                if(err)
                    return console.log(err+'-'+s7client.ErrorText)
                console.log(res)
            })
        })
    }
    async startRead(req, res, next){
        console.log(req.body)
        const form = new formidable.IncomingForm();
		form.parse(req, async (err, fields, files) => {
			// if (err) {
			// 	res.send({
			// 		status: 0,
			// 		type: 'FORM_DATA_ERROR',
			// 		message: '表单信息错误'
			// 	})
				
			// }
			console.log(fields)  
        })
        res.send({
            status: 0,
            type: 'FORM_DATA_ERROR',
            message: '表单信息错误'
        })
    }
    async stopRead(req, res, next){
    const _id = req.params._id
    if (!_id) {
            console.log('参数错误');
            res.send({
                status: 0,
                type: 'ERROR_PARAMS',
                message: '参数错误',
            })
            return
        }
    try {
        const device = await DeviceModel.findOne({'_id':_id})
        
        await PointModel.findOneAndRemove({'_id':_id})
        res.send({
            status: 1,
            message: '开启成功'
        })
    }catch(err){
        console.log('删除失败', err);
        res.send({
            status: 0,
            type: 'ERROR_GET_LIST',
            message: '删除失败'
        })
    }
}
   

}

export default new Main()

import crc from "crc";
// this.pad = function() {
//   var tbl = [];
//   return function(num, n,encode=10,_switch=false) {
//     var len = n-num.toString(encode).length
//     if (len <= 0) return num.toString(encode)
//     if (!tbl[len]) tbl[len] = (new Array(len+1)).join('0')
//     let rtn = tbl[len] + num.toString(encode)
//     return _switch ? (rtn[2]+rtn[3]+rtn[0]+rtn[1]) : rtn
//   }
// }()
class ModbusStringHandler {
  constructor(){
    this.tbl=[]
  }
  CMD_ReadCoils(unitId,start,number){
    //unityId,0x01,Hi起始，Lo起始，Hi数量，Lo数量
    let cmd = ''
    cmd += this.Pad(unitId,2)
    cmd += '01'
    cmd += this.Pad(start,4)
    cmd += this.Pad(number,4)
    return this.CalcModbusCrc(cmd)
  }
  CMD_ReadDiscreteInput(unitId,start,number){
    //unityId,0x02,Hi起始，Lo起始，Hi数量，Lo数量
    let cmd = ''
    cmd += this.Pad(unitId,2)
    cmd += '02'
    cmd += this.Pad(start,4)
    cmd += this.Pad(number,4)
    return this.CalcModbusCrc(cmd)
  }
  CMD_ReadInputRegisters(unitId,start,number){
    //unitId,0x03,Hi起始，Lo起始，Hi数量，Lo数量
    let cmd = ''
    cmd += this.Pad(unitId,2)
    cmd += '04'
    cmd += this.Pad(start,4)
    cmd += this.Pad(number,4)
    return this.CalcModbusCrc(cmd)
  }
  CMD_ReadHoldingRegisters(unitId,start,number){
    //unitId,0x03,Hi起始，Lo起始，Hi数量，Lo数量
    let cmd = ''
    cmd += this.Pad(unitId,2)
    cmd += '03'
    cmd += this.Pad(start,4)
    cmd += this.Pad(number,4)
    return this.CalcModbusCrc(cmd)
  }
  CMD_WriteCommand(unitId,start,data){
    //unitId,0x05,Hi起始，Lo起始，Hi数量，Lo数量
    let cmd = ''
    cmd += this.Pad(unitId,2)
    cmd += '06'
    cmd += this.Pad(start,4)
    cmd += this.Pad(data,4)
    return this.CalcModbusCrc(cmd)
  }
  ResponseHandler(response){
    response = response.trim()
    let unitId = parseInt(response.slice(0,2),16)
    let funCode = parseInt(response.slice(2,4),16)
    let numOfBytes = parseInt(response.slice(4,6),16)
    let data = []
    let dataPayload = response.slice(6,6+2*numOfBytes)
    switch (funCode){
      case (1):
      case (2):
        // dataPayload = dataPayload.slice(0,2*numOfBytes)
        dataPayload = parseInt(dataPayload,16).toString(2)
        // print(dataPayload)
        dataPayload = dataPayload.split('').reverse()
        for (let i = 0; i < numOfBytes; i++){
          data.push(dataPayload.splice(0,8))
        }
        data = data.map(e => e.reverse())
        let temp = []
        data.forEach(e => { temp = temp.concat(e) })
        data = temp.reverse()
        data = data.map( e => {
          switch (e){
            case '0':
              return false
              break
            case '1':
              return true
              break
            default :
              break
          }
        })
        break;
      case (3):
      case (4):
        for (let i = 0; i < numOfBytes/2; i++){
          data.push(parseInt(dataPayload.slice(0,4),16))
          dataPayload = dataPayload.slice(4)
        }
        break
      default:
        break
    }
    // for (let i = 0; i < numOfBytes/2; i++){
    //   data.push(parseInt(dataPayload.slice(0,4),16))
    //   dataPayload = dataPayload.slice(4)
    // }
    return {unitId,funCode,numOfBytes,data}
  }
  Pad(num, n,encode=16,_switch=false){
    var len = n-num.toString(encode).length
    if (len <= 0) return num.toString(encode)
    if (!this.tbl[len]) this.tbl[len] = (new Array(len+1)).join('0')
    let rtn = this.tbl[len] + num.toString(encode)
    return _switch ? (rtn[2]+rtn[3]+rtn[0]+rtn[1]) : rtn
  }
  CalcModbusCrc(text){
    let result = crc.crc16modbus(Buffer.from(text.trim(),'hex')).toString(16)
    result = this.Pad(result,4)
    // console.log('@@')
    // console.log(result)
    // console.log(text)
    // console.log('@@')
    let ret = text+result[2]+result[3]+result[0]+result[1]
    return ret
  }
  Str2Hex(str){
    return Buffer.from(str.trim(),'hex')
  }
  Hex2Str(hex){
    return hex.toString('hex')
  }
}

export default new ModbusStringHandler()

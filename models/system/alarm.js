'use strict';

import mongoose from 'mongoose'


const Schema = mongoose.Schema;
// const alarmRelationSchema = new Schema({
//   type: Number, //默认 自定义
//   point_id:ObjectId, 
//   alarm:{ type:Schema.Types.ObjectId, ref: 'Alarm'},
// })
const alarmEnumSchema = new Schema({
  number: Number,
  isAlarm: Boolean,
  low: Number,
  high: Number,
})

const alarmSchema = new Schema({
  alarmEnum:[alarmEnumSchema],
  create_time: String,
})



const Alarm = mongoose.model('Alarm', alarmSchema);


export default Alarm

import mongoose from "mongoose";

const Schema = mongoose.Schema

const messageSchema = new mongoose.Schema({
    senderId: {
        type: String,
      },
      receiverId: {
        type: String,
      },
      text: {
        type: String,
      },
      date:{
        type:Date,
        default:Date.now
    }
})

const collection = mongoose.model('Message', messageSchema)

export default collection
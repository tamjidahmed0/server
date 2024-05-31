import mongoose from "mongoose";



const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Types.ObjectId,
        required: false
      },
      receiverId: {
        type: mongoose.Types.ObjectId,
        required: false
      },
      text: {
        type: String,
      },
      textFor:{
        type:mongoose.Types.ObjectId
      },
      senderText:{
        type:String
      },
      receiverText:{
        type:String
      },
      type:{
        type: String
      },
 
      date:{
        type:Date,
        default:Date.now
    }
})

const collection = mongoose.model('Message', messageSchema)

export default collection
import mongoose from "mongoose";



const conversationSchema = new mongoose.Schema({
    // name:{
    //     type:String
    // },
    // senderId:{
    //     type:String
    // },
    // receiverId:{
    //     type:String
    // }
    senderName:{
        type:String
    },
    receiverName:{
        type:String
    },
    Name:{
        type:String
    },
    text:{
        type:String
    },
    members:{
        type:Array
    },
    conversationFor: {
        type:mongoose.Types.ObjectId
    },
    // userId:{
    //     type:String
    // },
    date:{
        type:Date,
        default:Date.now
    }
})

const collection = mongoose.model('Conversation', conversationSchema)

export default collection
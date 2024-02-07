import mongoose from "mongoose";



const profileSchema = new mongoose.Schema({
   Id:{
    type:mongoose.Types.ObjectId
   },
   name:{
    type:String
   },
   username:{
    type:String
   },
   profilePic:{
    type:String
   },
   date:{
      type:Date,
      default:Date.now
  }
})

const collection = mongoose.model('Profile', profileSchema)

export default collection
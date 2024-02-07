import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
const schema = mongoose.Schema;


const UserSchema = new schema({
    profilePic:{
        type:String
    },
    name:{
        type:String,
        require:true
    },
    username:{
        type:String,
        require:true,
        // unique:true
    },
    email:{
        type:String,
        
    },
    password:{
        type:String,
        require:true
    },
    refreshToken:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    }
})


UserSchema.pre('save', async function (next){
const user = this

if(user.isModified('password')){
const salt = await bcrypt.genSalt(10)
user.password = await bcrypt.hash(user.password,salt)
next()
}
})


const collection = mongoose.model('user', UserSchema);

export default collection;
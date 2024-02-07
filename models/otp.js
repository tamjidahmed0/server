import mongoose from "mongoose"
import bcrypt from 'bcryptjs'
const schema = mongoose.Schema

const userOtp = new schema({
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
    date:{
        type:Date,
        default:Date.now
    },
    otp:{
        type:String
    },
    token:{
        type:String
    },
    // createdOn: {
    //     type: Date,
    // }
    

})


// userOtp.index({createdOn: 1}, {expireAfterSeconds: 60 * 6})


userOtp.pre('save', async function (next){
    const user = this
    
    if(user.isModified('password')){
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(user.password,salt)
    user.otp = await bcrypt.hash(user.otp, salt)

    next()
    }
    })


const collection = mongoose.model('otp', userOtp)

export default collection
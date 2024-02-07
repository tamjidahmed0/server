import  mongoose from 'mongoose'

import * as dotenv from 'dotenv' 
dotenv.config()
mongoose.set('strictQuery', true);
const URI = process.env.MONGO_URI

 const connectDB = async () => {
    try {
        mongoose.connect(URI  , {
            useNewUrlParser: true,
            UseUnifiedTopology: true
        })
       
    } catch (error) {
        console.log('not connected to database',error)
        process.exit(1)
    }


}





export default connectDB

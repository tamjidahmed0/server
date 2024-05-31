import jwt  from 'jsonwebtoken'
import userschema from '../models/user.js'


 

const authenticate = async (req, res, next) => {

let token

const {authorization, userid} = req.headers
const paramsId = req.params.userId 

const User = await userschema.findById(paramsId)
// console.log(User, 'checkuser')
const checkuser = User !== null




if(authorization ){
  try {

    token = authorization.split(' ')[1]
    const result = jwt.verify(token, process.env.JWT_SECRET)

   
console.log(result.id ===userid && paramsId === result.id, 'result')

if(result.id ===userid && paramsId === result.id && checkuser){
  next()
}else{
  res.status(401).send({'status': 'Unauthorized!'})
}
   

    // req.user = await userschema.findById(userID).select('-password')
   

  } catch (error) { 
    res.status(401).send({'status': 'invalid token'})
  }
  
}else{
  res.status(401).send({'status': 'please token provid'})
}



  };







export default authenticate;
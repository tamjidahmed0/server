import express  from "express"

import path from 'path'
import { fileURLToPath } from 'url';
import  {dirname}  from "path"
//import Db 
import connectDB from "./config/db.js"
//import router
import  router  from './router/routes.js'
//import dotenv
import * as dotenv from 'dotenv' 
dotenv.config()
//import session
import session from "express-session";
//import cors
import cors from 'cors'
//import bodyparser
import bodyParser from "body-parser"
//import cookie parser
import cookieParser from "cookie-parser"
import  IpFilter  from "express-ipfilter"
import { Server } from "socket.io";
import http from "http";
import recommendation from './recommendation/recommendation.js'
import lastActiveSchema from './models/lastActive.js'





import moment from "moment";
import messageSchema from "./models/message.js";
import userschema from "./models/user.js";
import onlineSchema from "./models/online.js";
import conversationSchema from "./models/conversation.js";
import profileSchema from "./models/profile.js";
import disableSchema from './models/disable.js'

import requestSchema from "./models/request.js";
import unReadMessageSchema from "./models/unReadMsg.js";
import notificationSchema from "./models/notification.js";
import inboxMedia from "./models/inboxMedia.js";
import userOtp from './models/otp.js'
import jwt  from 'jsonwebtoken'

import fs from 'fs'
import { type } from "os";


const { createHmac } = await import('crypto');
import crypto from 'crypto'



// // Generate a random encryption key with the desired length (256 bits / 32 bytes)
// const encryptionKey = crypto.randomBytes(32);

// // Encryption function
// function encryptMessage(message, key) {
//     const iv = crypto.randomBytes(16); // Generate Initialization Vector (IV)
//     const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
//     let encrypted = cipher.update(message, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return iv.toString('hex') + ':' + encrypted;
// }

// // Decryption function
// function decryptMessage(encryptedMessage, key) {
//     const parts = encryptedMessage.split(':');
//     const iv = Buffer.from(parts[0], 'hex');
//     const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
//     let decrypted = decipher.update(parts[1], 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// }

// // Example usage
// const message = 'Hello, world!ihiuhihouhuijhfgjhfvjhfgyugfuyfgkyufkuyfkuy';
// const encryptedMessage = encryptMessage(message, encryptionKey);
// console.log('Encrypted Message:', encryptedMessage);

// const decryptedMessage = decryptMessage(encryptedMessage, encryptionKey);
// console.log('Decrypted Message:', decryptedMessage);
 





const app = express()
//env for secret credentials
const port = process.env.PORT || 1000

app.use(cookieParser());

app.use(session({
  name:'session',
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie:{
    maxAge:2 * 60 * 1000,
   httpOnly:true,

  } 
}));   



const server = http.createServer(app);

const io = new Server(server, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials:true
  },
});


// app.use(cors({ credentials: true, origin: 'http://localhost:3000', methods: ["GET", "POST", "PUT", "DELETE"],}));

app.use(bodyParser.urlencoded({ extended: true }));



//json formate 
app.use(express.json())

//disable x-powered-by;
app.disable('x-powered-by');


const __dirname = dirname(fileURLToPath(import.meta.url))

// Serve your React app here
app.use(express.static(path.join(__dirname, 'public')));


// Specify the directory where the images are stored
app.use('/uploads', express.static('uploads'));
app.use('/media', express.static('media'));




app.use('/public', express.static('public'));

//api routes
app.use('/api', router )


recommendation() 



const otpTimeouts = {};

const scheduleTaskForUser = (email, remainingTime) => {
  // Clear existing timeout for this user, if any
  otpTimeouts[email] = setTimeout(() => {
    console.log(`Executing scheduled task for user with email ${email}...`);
    userOtp.findOneAndDelete({ email: email }, function (err, docs) {
      if (err) {
        console.log(err);
      } else { 
        console.log("Deleted User:", docs);
      }
    });
  }, remainingTime);
  console.log(otpTimeouts);
};

const restoreTimeoutsFromDatabase = async () => {
  try {
    // Create a streaming cursor to fetch users with OTPs from the database
    const cursor = userOtp.find().cursor();
    
    // Iterate over each user asynchronously
    for await (const user of cursor) {
      const currentTime = Date.now(); 
      const expirationTime = user.date.getTime(); // Assuming 'date' is a Date field in your schema
      const remainingTime = expirationTime - currentTime  
      console.log(remainingTime, 'expirationTime'); 
      if (remainingTime > 0) {
        scheduleTaskForUser(user.email, remainingTime); 
      } else { 
        console.log(`OTP for user with email ${user.email} has already expired.`);
    
        userOtp.findOneAndDelete({ email: user.email }, function (err, docs) {
          if (err) {
            console.log(err);     
          } else {
            clearTimeout(otpTimeouts[user.email]); // Fix this line to use user.email instead of undefined email
             console.log("Deleted User:", docs);
          }
        });
      } 
    }
  } catch (error) {
    console.error("Error restoring timeouts:", error);
  }
}; 

restoreTimeoutsFromDatabase();

 




//socket

let userData = [];

io.use(async(socket,  next) => {
  // do something


const {token} = socket.handshake.auth
const {userID} = socket.handshake.query
  
try {
  // Verify the JWT token
  const result = jwt.verify(token, process.env.JWT_SECRET);

  // Check if the token is valid and matches the user ID
  if (result.id === userID) {
    //  next();     // Proceed with the socket connection


     const {username, email} = await userschema.findById(result.id)


     const disable = await disableSchema.findOne({
                
         $or: [{ identifier: username, }, { email: email }],
       });


     if(disable !== null){
console.log('id disable')
     }else{
      next();
     }



  } else {
    throw new Error('Invalid token or user ID mismatch');
  }
} catch (error) {
  // Handle authentication errors 
  console.error('Authentication error:', error.message);
  next(error); // Pass the error to the next middleware or handler
}

});





io.on("connection", async (socket) => {
  //console log when user is connected
  console.log("a user connected", socket.id);


  
  //   socket.on('test' , async (data) =>{
  // console.log(data)
  //   })

  //push into empty array all connected users details
  // userData.push({socketId:socket.id, id:socket.handshake.query.userID, receiverId:socket.handshake.query.receiverId})

  try {
    const userFind = await onlineSchema.findOne({ id: socket.handshake.query.userID });

 
 

    if (userFind !== null) {
     
      // const lastActive = await lastActiveSchema.findOneAndDelete({Id: userFind.id})

    

      await onlineSchema.updateMany({ id: socket.handshake.query.userID }, { socketId: socket.id }, { new: true });
    } else {
      // console.log("no data");
      const online = new onlineSchema({
        socketId: socket.id,
        id: socket.handshake.query.userID,
      });

      online.save();


      socket.emit('userOnline', {
        active: 'online' ,
        Id:socket.handshake.query.userID
      })



    }



    await lastActiveSchema.findOneAndDelete({Id:socket.handshake.query.userID})
socket.on('activeStatus', async(data)=>{
  // console.log(data, 'activestatius')



  const activeStatus = await lastActiveSchema.findOne({Id: data.userId})



if(activeStatus !== null){
  console.log(activeStatus, '332 last active')

  socket.emit('lastactive', {
    active: activeStatus.lastActive
  })
  
}else{
  socket.emit('lastactive', {
    active: 'online' 
  })







}









})




  } catch (error) {
    console.log(error);
  }

  // console.log(userData, 'come from userData')

  //send and get message
  socket.on("sendMessage", async (body) => {

    
    const { name, profile, senderId, receiverId, text, socketId, Dates, types } = body;
    
    try {
      const Message = new messageSchema({
      receiverId,
      senderId,
      textFor: receiverId,
      receiverText: text,
        text,
        type:types,
      
      });
      const newMessage = new messageSchema({
        senderId,
        receiverId,
        senderText : text,
        textFor:senderId,
        text,
        type:types,
      });
      const success = await newMessage.save();
       const senderMessage =  await Message.save()

      // console.log(senderMessage, 'successs')


      if (success ) {

        const unreadmsgfind = await unReadMessageSchema.find({
          $and:[{senderId:senderId }, {receiverId:receiverId}]
        })

        if(unreadmsgfind.length === 0){
          const unread = await new unReadMessageSchema({
            senderId:senderId,
            receiverId:receiverId,
       
          }).save()
  
          // console.log(unread)
        }else{

          const updateUnread = await unReadMessageSchema.findOneAndUpdate({
            $and: [{senderId:senderId}, {receiverId:receiverId}]
          },{
            $inc: {count: 1}
           
          },{
            new:true
          })



          



        }



  
        


        const findUser = await userschema.find({
          $or: [{ _id: senderMessage.senderId }, { _id: success.receiverId }],
        });

      

        if (findUser) {
          const find = await conversationSchema.find({
            $and: [{ members: { $in: [senderMessage.senderId] } }, { members: { $in: [success.receiverId] } }],
          });

          if (Object.keys(find).length !== 0) {
            const originalText = success.text;
            const trimText = originalText.substring(0, 23);

            const filter = {
              $and: [{ conversationFor: senderMessage.senderId }, { For: success.receiverId }],
            };
            const filter2 = {
              $and: [{ conversationFor: success.receiverId }, { For: senderMessage.senderId }],
            };

            const conversationExistingSender = await conversationSchema.findOne({ For: senderId });
            const conversationExistingReceiver = await conversationSchema.findOne({ For: receiverId });

            //  console.log(conversationExistingSender)
            //  console.log(conversationExistingReceiver)

       

            //  console.log(conversationExistingSender, 'come fropm conversation existing')

            //////////////do not touch/////////////

            // if (findUser[0]._id.toString() === senderId) {
            //   console.log('line 271')
            //   await conversationSchema.findOneAndUpdate(filter, {
            //     $set: {
            //       text: trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`,
            //       date: new Date(),
            //     },
            //   });
            //   await conversationSchema.findOneAndUpdate(filter2, {
            //     $set: {
            //       text: `${trimText}`,
            //       date: new Date(),
            //     },
            //   });
            // } else {

            //   await conversationSchema.findOneAndUpdate(filter2, {
            //     $set: {
            //       text: `${trimText}.`,
            //       date: new Date(),
            //     },
            //   });
            //   await conversationSchema.findOneAndUpdate(filter, {
            //     $set: {
            //       text: trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`,
            //       date: new Date(),
            //     },
            //   });
            // }

            ////////do not touch /////////////

            if (findUser[0]._id.toString() === senderId) {
              console.log("line 271");
              await conversationSchema.findOneAndUpdate(filter, {
                $set: {
                  text: trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`,
                  date: new Date(),
                },
              });


         await conversationSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}`,
                  date: new Date(),
                },
              });

           


              await requestSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}`,
                  date: new Date(),
                },
              });

             



            } else {



                    await conversationSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}.`,
                  date: new Date(),
                },
              });

        
           




              await requestSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}.`,
                  date: new Date(),
                },
              });

              await conversationSchema.findOneAndUpdate(filter, {
                $set: {
                  text: trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`,
                  date: new Date(),
                },
              });
            }

            
          } else {
            ///////////////save code do not touch//////////////

            // const originalText = success.text;
            // const trimText = originalText.slice(0, 10);

            // const conversation = new conversationSchema({
            //   senderName: "",
            //   receiverName: "",
            //   text: "",
            //   conversationFor: "",
            //   For: "",
            //   members: [senderMessage.senderId, success.receiverId],
            // });

            // const newconversation = new conversationSchema({
            //   senderName: "",
            //   receiverName: "",
            //   text: "",
            //   conversationFor: "",
            //   For: "",
            //   members: [success.receiverId, senderMessage.senderId],
            // });

            // if (findUser[0]._id.toString() === senderId) {
            //   console.log(success.text);
            //   conversation.senderName = findUser[0].name;
            //   conversation.receiverName = findUser[1].name;
            //   conversation.text = success.text;

            //   conversation.conversationFor = findUser[0]._id;
            //   conversation.For = findUser[1]._id;

            //   newconversation.senderName = findUser[1].name;
            //   newconversation.receiverName = findUser[0].name;
            //   newconversation.text = success.text;

            //   newconversation.conversationFor = findUser[1]._id;
            //   newconversation.For = findUser[0]._id;
            // } else {
            //   console.log(success.text);
            //   conversation.senderName = findUser[1].name;
            //   conversation.receiverName = findUser[0].name;
            //   // conversation.text = success.text;
            //   conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;;
            //   conversation.conversationFor = findUser[1]._id;
            //   conversation.For = findUser[0]._id;

            //   newconversation.senderName = findUser[0].name;
            //   newconversation.receiverName = findUser[1].name;
            //   newconversation.text = success.text;

            //   newconversation.conversationFor = findUser[0]._id;
            //   newconversation.For = findUser[1]._id;
            // }

            // await conversation.save();
            // await newconversation.save();

            ////////////////save code end do not touch ///////




        

            const verified = await profileSchema.findOne({Id:success.receiverId})
            const verified2 = await profileSchema.findOne({Id:senderMessage.senderId})
            
 
            const originalText = success.text;
            const trimText = originalText.slice(0, 10);

            const conversation = new conversationSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              isVerified:verified.isVerified,
              For: "",
              members: [senderMessage.senderId, success.receiverId],
            });

            const newconversation = new requestSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              isVerified: verified2.isVerified,
              For: "",
              members: [success.receiverId, senderMessage.senderId],
            });

            if (findUser[0]._id.toString() === senderId) {
              console.log(success.text);
              conversation.senderName = findUser[0].name;
              conversation.receiverName = findUser[1].name;
              conversation.text = success.text;

              conversation.conversationFor = findUser[0]._id;
              conversation.For = findUser[1]._id;
              

              newconversation.senderName = findUser[1].name;
              newconversation.receiverName = findUser[0].name;
              newconversation.text = success.text;

              newconversation.conversationFor = findUser[1]._id;
              newconversation.For = findUser[0]._id;
            } else {
              console.log(success.text);
              conversation.senderName = findUser[1].name;
              conversation.receiverName = findUser[0].name;
              // conversation.text = success.text;
              conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;
              conversation.conversationFor = findUser[1]._id;
              conversation.For = findUser[0]._id;

              newconversation.senderName = findUser[0].name;
              newconversation.receiverName = findUser[1].name;
              newconversation.text = success.text;

              newconversation.conversationFor = findUser[0]._id;
              newconversation.For = findUser[1]._id;
            }

            await conversation.save(); //msg that i send
            const requestmsg = await newconversation.save(); // request box msg


       




            const userfindonline = await onlineSchema.find({ id: receiverId });
            const countrequest = await requestSchema.countDocuments({
              conversationFor:senderId,
            });

            if (requestmsg) {
             io.to(userfindonline.socketId).emit("messagerequest", {
                name: name,
                profile: profile,
                iSend: senderId,
                whoSend: receiverId,
                socketId: socketId,
                convText: `${text}`,
                Date: Dates,
              });

       
            
              console.log(countrequest)

              io.to(userfindonline.socketId).emit('requestCount', {
                count :countrequest
              })


            }



          }
        }
      }

      // const find = userData.find(obj =>obj.id === receiverId)
      const find = await onlineSchema.find({ id: receiverId });

      // console.log(find , 'come from find')

      if (find) {
        for (const item of find) {
          //send msg to specific client
          io.to(item.socketId).emit("receivermessage", {
            messageId: success._id,
            name: name,
            profile: profile,
            iSend: senderId,
            whoSend: receiverId,
            socketId: socketId,
            text: text,
            types: types,
            Date: Dates,
          });

          const checkSender = item.id.toString() === receiverId;
          if (checkSender) {
            io.to(item.socketId).emit("conversations", {
              name: name,
              profile: profile,
              iSend: senderId,
              whoSend: receiverId,
              socketId: socketId,
              convText: `${text}`,
              Date: Dates,
            });
          } else {
            console.log("you send");

            //  io.to(item.socketId).emit("conversations", {
            //   name: name,
            //   profile: profile,
            //   iSend: senderId,
            //   whoSend: receiverId,
            //   socketId: socketId,
            //   convText: `You: ${text}`,
            //   Date: Dates,
            // });
          }

          // io.to(item.socketId).emit("conversations", {
          //   name: name,
          //   profile: profile,
          //   iSend: senderId,
          //   whoSend: receiverId,
          //   socketId: socketId,
          //   convText: text,
          //   Date: Dates,
          // });
        }
      }

      



//msg that i send and sent to client side

if(find.length === 0){

   socket.emit("sendermsg", {
        iSend: senderId,
        text: text,
        Date: Dates,
        receiverId: receiverId,
        messageStatus: 'sent'
      });




}else{

 socket.emit("sendermsg", {
        iSend: senderId,
        text: text,
        Date: Dates,
        receiverId: receiverId,
        messageStatus: 'Deliverd'
      });


console.log('user is online')
}



 


      

  //  socket.emit("sendermsg", {
  //       iSend: senderId,

  //       text: text,
  //       Date: Dates,
  //       receiverId: receiverId,
  //     });
      


   

      socket.emit("convsendermsg", {
        name: name,
        profile: profile,
        iSend: senderId,
        whoSend: receiverId,
        socketId: socketId,
        convText: `${text}`,
        Date: Dates,
      });

      // if (find){
      // io.to(find.socketId).emit('conversations',{
      //     name:name,
      //     profile: profile,
      //     iSend:senderId,
      //     whoSend:receiverId,
      //     socketId:socketId,
      //     convText:text,
      //     Date:Dates
      //   })
      // }
    } catch (error) {
      // Handle error
      console.log(error);
    }

    try {
      // const find = userData.find(obj =>obj.id === receiverId)
      // console.log(find , 'come from find')
      // if(find){
      //    //send msg to specific client
      //    io.to(find.socketId).emit('receivermessage',{
      //     name:name,
      //     profile: profile,
      //     iSend:senderId,
      //     whoSend:receiverId,
      //     socketId:socketId,
      //     text:text,
      //     Date:Dates
      //   })
      // }
      // //msg that i send and sent to client side
      //   socket.emit('sendermsg',{
      //     iSend:senderId,
      //     text:text,
      //     Date:Dates,
      //     receiverId:receiverId,
      //   })
      // if (find){
      // io.to(find.socketId).emit('conversations',{
      //     name:name,
      //     profile: profile,
      //     iSend:senderId,
      //     whoSend:receiverId,
      //     socketId:socketId,
      //     convText:text,
      //     Date:Dates
      //   })
      // }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("accept", async (data) => {
    try {
      const messageReqData = await requestSchema.findOne({
        conversationFor: data.userId,
        For: data.requestId,
      });

      const {name} = await userschema.findById(data.userId)
  

      const notification = await new notificationSchema({
        senderId : data.userId,
        receiverId:data.requestId,
        text: `${name} accepted your message request.`
      }).save()

console.log(notification, 'notification')

      //  const messageReqData = await    requestSchema.aggregate([
      //         {
      //           $match: {
      //             $and: [
      //               { conversationFor: data.userId },
      //               { For: data.requestId }
      //             ]
      //           }
      //         },
      //         { $merge: { into: "Conversations" } }
      //       ]).exec()

      console.log(messageReqData);

      if (messageReqData) {
        // const verified = await profileSchema.findOne({Id:messageReqData.members[0]})
        const verified = await profileSchema.findOne({Id:data.requestId})
        console.log(verified, 'verified1055')
        const transferToConversation = await new conversationSchema({
          senderName: messageReqData.senderName,
          receiverName: messageReqData.receiverName,
          text: messageReqData.text,
          conversationFor: messageReqData.conversationFor,
          For: messageReqData.For,
          isVerified: verified.isVerified,
          members: [messageReqData.members[0], messageReqData.members[1]],
        }).save();

        if (transferToConversation) {
          //   const deleteReqMessage = requestSchema.findOneAndDelete({
          //     conversationFor: data.userId,
          //     For: data.requestId
          //   })

          // console.log(deleteReqMessage, 'delete')

          const deleteReqMessage = requestSchema
            .findOneAndDelete({
              conversationFor: data.userId,
              For: data.requestId,
            })
            .then((deletedDoc) => {
              if (deletedDoc) {
                console.log("Document deleted:", deletedDoc);
              } else {
                console.log("No matching document found for deletion.");
              }
            });

if(deleteReqMessage){

  const countrequest = await requestSchema.countDocuments({
    conversationFor:data.userId,
  });

  const onlineData = await onlineSchema.findOne({ id: data.requestId });


socket.emit('acceptRefresh', {
  count : countrequest
})



  io.to(onlineData.socketId).emit('acceptNotify', {
count : countrequest
  })
}
         
            




        }

        console.log(transferToConversation, "saved");
      } else {
        console.log("No matching data found for the given conditions.");
      }
    } catch (error) {
      console.error("Error in accept socket event:", error);
    }
  });

  socket.on("user:incomming", async(data) => {
    console.log(data, '1127');

    const onlineData = await onlineSchema.findOne({ id: data.requestForCalling });

    if(onlineData !== null){
      const callerSocketId = await onlineSchema.findOne({socketId:data.callerSocketId})
      const profileData = await profileSchema.findOne({Id:callerSocketId.id})
      
      // console.log(callerSocketId, 'onlibe')
  
  
      if (onlineData) {
        io.to(onlineData.socketId).emit("incommingoffer", {userId:data.id, name: profileData.name , profile:profileData.profilePic, peerOffer:data.peerOffer});
      }
    }else{
      //if user not online then save it on database for who called you
      console.log('line e nai') 
    }

   
  }); 


  socket.on('call:accepted', async(data)=>{
    const userFind = await onlineSchema.findOne({id:data.userId})

  console.log(data, 'accepted')
  if (userFind) {
    io.to(userFind.socketId).emit("call:accepted", {userId:data.userId,  peerAnswer:data.peerAnswer});
  }


  })



  ////////typing...
  socket.on("typing", async (data) => {
    const onlineData = await onlineSchema.findOne({ id: data.receiverId });
    // const find = userData.find(obj =>obj.id === data.receiverId)
    console.log(data);

    const count = data.msg.length;
    if (onlineData) {
      io.to(onlineData.socketId).emit("typingmsg", { ...data, count });
    }
  });

  socket.on("seen", (data) => {
    // const find = userData.find(obj =>obj.id === data.receiverId)

    // if(find){
    //   io.to(find.socketId).emit('seen', data)
    // }

    console.log(data);
  });



  const __dirname = path.dirname(fileURLToPath(import.meta.url));



    // Define the folder where you want to save the uploaded images
    const baseFolder = path.join(__dirname, `media`);
  
    // Create the uploads folder if it doesn't exist
    if (!fs.existsSync(baseFolder)) {
      fs.mkdirSync(baseFolder);
    } 


const fileSave = async( folder,  data, senderId, receiverId, type, profile) =>{



  const folderPath = path.join(baseFolder, folder);
    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true }); // recursive: true creates parent folders if they don't exist
    }
 
    const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
  
  
    // Create a writable stream to save the image data to a file
    const filePath = path.join(folderPath, filename);

    const parentFolder = path.basename(path.dirname(path.dirname(filePath)));

    const childFolder = path.basename(path.dirname(filePath));

    const writeStream = fs.createWriteStream(filePath);
  


const link =  `${parentFolder}/${childFolder}/${filename}`

    const insertData = await new messageSchema({
      senderId:senderId,
      receiverId:receiverId,
      text:link,
      type:type
    }).save()

      // Write the image data to the file 
      writeStream.write(Buffer.from(data));
      writeStream.end();

console.log(insertData, 'saved to inboxmedia')
  
    console.log('Image saved to:', `${parentFolder}/${childFolder}/${filename}`);


    const onlineData = await onlineSchema.findOne({ id: receiverId });


    io.to(onlineData.socketId).emit('imageReceive', {
     
      profile: profile,
      iSend: senderId,
      whoSend: receiverId, 
      text:link,
      socketId: socket.id,
      type:'image',
      
    })


    socket.emit('outgoingMedia', {
      iSend: senderId,
        text: link,
        socketId: socket.id,
        receiverId: receiverId,
        type:'image',
    })


 
}
 

//upload file in inbox
  socket.on('uploadImage', async(data)=>{
    console.log(data) 
   
console.log(data)

  if(data.type === 'image/jpeg'){
    fileSave(`images`, data.imageData, data.senderId, data.receiverId , 'image', data.profile )  
  }



  })


  socket.on('uploadAudio', async(data)=>{
    console.log(data)
    if(data.type === 'audio/mpeg'){



      const folderPath = path.join(baseFolder, 'audio');
      // Create the folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true }); // recursive: true creates parent folders if they don't exist
      }
   
      const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.mp3`;
    
    
      // Create a writable stream to save the image data to a file
      const filePath = path.join(folderPath, filename);
  
      const parentFolder = path.basename(path.dirname(path.dirname(filePath)));
  
      const childFolder = path.basename(path.dirname(filePath));
  
      const writeStream = fs.createWriteStream(filePath);
    
  
  
  const link =  `${parentFolder}/${childFolder}/${filename}`
  
      const insertData = await new messageSchema({
        senderId:data.senderId,
        receiverId:data.receiverId,
        text:link,
        type:'audio'
      }).save()
  
        // Write the image data to the file 
        writeStream.write(Buffer.from(data.audioData));
        writeStream.end();
  
        try {
          const onlineData = await onlineSchema.findOne({ id: data.receiverId });

          io.to(onlineData.socketId).emit('audioReceive', {
       
            profile: data.profile,
            iSend: data.senderId,
            whoSend: data.receiverId, 
            text:link,
            socketId: socket.id,
            type:'audio',
            audioName: data.name
            
          })
        } catch (error) {
          console.log(error)
        }

  


        socket.emit('outgoingAudioMedia', {
          iSend: data.senderId,
            text: link,
            socketId: socket.id,
            receiverId: data.receiverId,
            type:'audio',
        })




    }  
  })


  // socket.on('onScreen' , async(data)=>{
  //   console.log(data.receiverId, 'onscreen')

  //   try {
  //     const onlineData = await onlineSchema.findOne({ id: data.receiverId });



  //       io.to(onlineData.socketId).emit('onScreenReceive', {
  //         senderId:data.senderId,
  //         receiverId:data.receiverId,
  //         onscreen:true
  //       })
    


    
  //   } catch (error) {
  //     console.log('offline')
  //   }

  


  // })





  // if user disconnect
  socket.on("disconnect", async () => {
    console.log("a user disconnected", socket.id);

    const userRemove = await onlineSchema.findOneAndDelete({ socketId: socket.id });
   

    console.log(userRemove, 'user remove');

    if (userRemove) {
      console.log(userRemove.id, 'user removed');


      const checkActives = await lastActiveSchema.findOne({Id:userRemove.id})

console.log(checkActives, 'check actives')
if(checkActives === null){
  const lastActive = await new lastActiveSchema({
    Id : userRemove.id,

  }).save()
}
     
   
    
   
    
        // socket.emit('lastActive', {
        // id: 'kjj'
        // //  active : lastActive.lastActive
        // })
      






  } else {
      console.log('User with socket ID', socket.id, 'not found or already removed');
  }







    const userIdToRemove = socket.id;
    const indexToRemove = userData.findIndex((obj) => obj.socketId === userIdToRemove);

    if (indexToRemove !== -1) {
      userData.splice(indexToRemove, 1);
      console.log(`Object with userId ${userIdToRemove} removed`);
    } else {
      console.log(`No object found with userId ${userIdToRemove}`);
    }

    console.log(userData);
  });
});



















// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     // res.header('Access-Control-Allow-Credentials', 'true');
//     next();
//   });





// Define the catch-all route for all other requests
// app.get('*', (req, res) => {
//   res.status(404).sendFile(path.join(__dirname, 'public/error.html'));
// });




//use session for security
// app.use(session({
//     key: 'login', 
//     secret: process.env.SESSION_SECRET ,
//     resave: false,
//     saveUninitialized: true,
//     cookie:{secure:true, maxAge: 15*60*1000, httpOnly:true}
    
// }))


// use cors
// app.use(cors({
//   origin: 'http://localhost:3000',
//   methods:['GET', 'POST'],
//   credentials:true, 
  
// }))


// app.use(cors())

// app.get('/',(req, res)=>{
//   res.cookie('name', 'tamjid', {sameSite:'strict', path:'/', expires:new Date(new Date().getTime() + 1 * 60 * 1000)})
// })


// app.use((req, res, next) => {
//     console.log(req.ip)
//     next()
//   })
  




// app.use((req, res, next) => {
//     if (req.cookies.user_id && !req.session.user_id) {
//       res.clearCookie("login");
//     }
//     next();
//   });





//start express app
connectDB().then(()=>{
 server.listen(port, ()=>{
    console.log(`mongodb connected and server connected to port ${port}`)
   }) 
}).catch((error)=>{
    console.log('invalid port',error)
})

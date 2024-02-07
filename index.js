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






import moment from "moment";
import messageSchema from "./models/message.js";
import userschema from "./models/user.js";
import onlineSchema from "./models/online.js";
import conversationSchema from "./models/conversation.js";
import profileSchema from "./models/profile.js";

import requestSchema from "./models/request.js";
import unReadMessageSchema from "./models/unReadMsg.js";
import notificationSchema from "./models/notification.js";

import jwt  from 'jsonwebtoken'

import fs from 'fs'








const app = express()
//env for secret credentials
const port = process.env.PORT || 1000



app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie:{
    maxAge:2 * 60 * 1000,
   httpOnly:true
  } 
}));   



const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials:true
  },
});


app.use(cors({ credentials: true, origin: '*' }));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

//json formate
app.use(express.json())

//disable x-powered-by;
app.disable('x-powered-by');


const __dirname = dirname(fileURLToPath(import.meta.url))

// Serve your React app here
app.use(express.static(path.join(__dirname, 'public')));


// Specify the directory where the images are stored
app.use('/uploads', express.static('uploads'));

app.use('/public', express.static('public'));

//api routes
app.use('/api', router )










 

 







//socket

let userData = [];

io.use((socket,  next) => {
  // do something


const {token} = socket.handshake.auth
const {userID} = socket.handshake.query

const result = jwt.verify(token, process.env.JWT_SECRET)

// console.log(result)

if(result.id === userID){
next()
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
    const userFind = await onlineSchema.find({ id: socket.handshake.query.userID });

    console.log(socket.handshake.query, "socket.handshake.query");

    if (userFind.length !== 0) {
      console.log(userFind);

      await onlineSchema.updateMany({ id: socket.handshake.query.userID }, { socketId: socket.id }, { new: true });
    } else {
      console.log("no data");
      const online = new onlineSchema({
        socketId: socket.id,
        id: socket.handshake.query.userID,
      });

      online.save();
    }
  } catch (error) {
    console.log(error);
  }

  // console.log(userData, 'come from userData')

  //send and get message
  socket.on("sendMessage", async (body) => {


//image upload section






    console.log(body);
    const { name, profile, senderId, receiverId, text, socketId, Dates } = body;
    const newMessage = new messageSchema(body);
    try {
      const success = await newMessage.save();

      if (success) {

        const unreadmsgfind = await unReadMessageSchema.find({
          $and:[{senderId:senderId }, {receiverId:receiverId}]
        })

        if(unreadmsgfind.length === 0){
          const unread = await new unReadMessageSchema({
            senderId:senderId,
            receiverId:receiverId,
       
          }).save()
  
          console.log(unread)
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
          $or: [{ _id: success.senderId }, { _id: success.receiverId }],
        });

        if (findUser) {
          const find = await conversationSchema.find({
            $and: [{ members: { $in: [success.senderId] } }, { members: { $in: [success.receiverId] } }],
          });

          if (Object.keys(find).length !== 0) {
            const originalText = success.text;
            const trimText = originalText.substring(0, 23);

            const filter = {
              $and: [{ conversationFor: success.senderId }, { For: success.receiverId }],
            };
            const filter2 = {
              $and: [{ conversationFor: success.receiverId }, { For: success.senderId }],
            };

            const conversationExistingSender = await conversationSchema.findOne({ For: senderId });
            const conversationExistingReceiver = await conversationSchema.findOne({ For: receiverId });

            //  console.log(conversationExistingSender)
            //  console.log(conversationExistingReceiver)

            if (!conversationExistingSender) {
              console.log(conversationExistingSender, "conversation sender not exist");

              // const conversation = new conversationSchema({
              //   senderName: "",
              //   receiverName: "",
              //   text: "",
              //   conversationFor: "",
              //   For: "",

              //   members: [success.receiverId, success.senderId],
              // });

              // conversation.senderName = findUser[0].name;
              // conversation.receiverName = findUser[1].name;
              // conversation.text = success.text;
              // conversation.conversationFor = findUser[0]._id;
              // conversation.For = findUser[1]._id;

              // await conversation.save();

              // const newconversation = new conversationSchema({
              //   senderName: "",
              //   receiverName: "",
              //   text: "",
              //   conversationFor: "",
              //   For: "",
              //   members: [success.receiverId, success.senderId],
              // });

              // newconversation.senderName = findUser[1].name;
              // newconversation.receiverName = findUser[0].name;
              // newconversation.text = success.text;

              // newconversation.conversationFor = findUser[1]._id;
              // newconversation.For = findUser[0]._id;
              // await newconversation.save()

              //           const newconversation = new conversationSchema({
              //             senderName: "",
              //             receiverName: "",
              //             text: "",
              //             conversationFor: "",
              //             For: "",
              //             members: [success.receiverId, success.senderId],
              //           });

              //           if (findUser[0]._id.toString() === senderId) {

              //             newconversation.senderName = findUser[1].name;
              //             newconversation.receiverName = findUser[0].name;
              //             newconversation.text = success.text;

              //             newconversation.conversationFor = findUser[1]._id;
              //             newconversation.For = findUser[0]._id;

              //           }else if (findUser[0]._id.toString() === receiverId){
              //  newconversation.senderName = findUser[1].name;
              //             newconversation.receiverName = findUser[0].name;
              //             newconversation.text = success.text;

              //             newconversation.conversationFor = findUser[1]._id;
              //             newconversation.For = findUser[0]._id;
              //           }

              //           await newconversation.save();
            } else if (!conversationExistingReceiver) {
              console.log(conversationExistingReceiver, "conversation receiver not exist");

              // const newconversation = new conversationSchema({
              //   senderName: "",
              //   receiverName: "",
              //   text: "",
              //   conversationFor: "",
              //   For: "",
              //   members: [success.senderId, success.receiverId],
              // });

              // newconversation.senderName = findUser[1].name;
              // newconversation.receiverName = findUser[0].name;
              // newconversation.text = success.text;
              // newconversation.conversationFor = findUser[1]._id;
              // newconversation.For = findUser[0]._id;

              // await newconversation.save();

              // const conversation = new conversationSchema({
              //   senderName: "",
              //   receiverName: "",
              //   text: "",
              //   conversationFor: "",
              //   For: "",
              //   members: [success.senderId, success.receiverId],
              // });

              // const newconversation = new conversationSchema({
              //   senderName: "",
              //   receiverName: "",
              //   text: "",
              //   conversationFor: "",
              //   For: "",
              //   members: [success.receiverId, success.senderId],
              // });

              //   console.log(success.text);
              //   conversation.senderName = findUser[0].name;
              //   conversation.receiverName = findUser[1].name;
              //   conversation.text = success.text;

              //   conversation.conversationFor = findUser[0]._id;
              //   conversation.For = findUser[1]._id;

              // await conversation.save();

              //           const newconversation = new conversationSchema({
              //             senderName: "",
              //             receiverName: "",
              //             text: "",
              //             conversationFor: "",
              //             For: "",
              //             members: [success.senderId, success.receiverId],
              //           });

              //           if (findUser[0]._id.toString() === receiverId) {

              //             newconversation.senderName = findUser[0].name;
              //             newconversation.receiverName = findUser[1].name;
              //             newconversation.text = success.text;

              //             newconversation.conversationFor = findUser[0]._id;
              //             newconversation.For = findUser[1]._id;

              //           }else if (findUser[0]._id.toString() === senderId){
              //  newconversation.senderName = findUser[0].name;
              //             newconversation.receiverName = findUser[1].name;
              //             newconversation.text = success.text;

              //             newconversation.conversationFor = findUser[0]._id;
              //             newconversation.For = findUser[1]._id;
              //           }

              //           await newconversation.save();
            }

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
            //   members: [success.senderId, success.receiverId],
            // });

            // const newconversation = new conversationSchema({
            //   senderName: "",
            //   receiverName: "",
            //   text: "",
            //   conversationFor: "",
            //   For: "",
            //   members: [success.receiverId, success.senderId],
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

            const originalText = success.text;
            const trimText = originalText.slice(0, 10);

            const conversation = new conversationSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              For: "",
              members: [success.senderId, success.receiverId],
            });

            const newconversation = new requestSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              For: "",
              members: [success.receiverId, success.senderId],
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
        const transferToConversation = await new conversationSchema({
          senderName: messageReqData.senderName,
          receiverName: messageReqData.receiverName,
          text: messageReqData.text,
          conversationFor: messageReqData.conversationFor,
          For: messageReqData.For,
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



  io.to(data.socketId).emit('acceptNotify', {
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

  socket.on("offerSend", (data) => {
    console.log(data);

    // const find = userData.find(obj =>obj.id === data.receiverId)

    // console.log(find)

    if (find) {
      io.to(find.socketId).emit("incommingoffer", data);
    }
  });

  ////////typing...
  socket.on("typing", async (data) => {
    const onlineData = await onlineSchema.findOne({ id: data.receiverId });
    // const find = userData.find(obj =>obj.id === data.receiverId)
    console.log(data.receiverId);

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
  const uploadFolder = path.join(__dirname, 'inboxMedia');
  
  // Create the uploads folder if it doesn't exist
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
  }


  socket.on('uploadImage', (data)=>{
    console.log(data) 



    const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;

    // Create a writable stream to save the image data to a file
    const filePath = path.join(uploadFolder, filename);
    const writeStream = fs.createWriteStream(filePath);

    // Write the image data to the file
    writeStream.write(Buffer.from(data.imageData));
    writeStream.end();

    console.log('Image saved to:', filePath);



  })





  // if user disconnect
  socket.on("disconnect", async () => {
    console.log("a user disconnected", socket.id);

    const userRemove = await onlineSchema.findOneAndDelete({ socketId: socket.id });

    console.log(userRemove);

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

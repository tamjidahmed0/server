  //send and get message
  socket.on("sendMessage", async (body) => {

    console.log(body, 'from body');
    const { name, profile, senderId, receiverId, text, socketId, Dates, types } = body;
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



            const verified = await profileSchema.findOne({Id:success.receiverId})
            const verified2 = await profileSchema.findOne({Id:success.senderId})
            

            const originalText = success.text;
            const trimText = originalText.slice(0, 10);

            const conversation = new conversationSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              isVerified:verified.isVerified,
              For: "",
              members: [success.senderId, success.receiverId],
            });

            const newconversation = new requestSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              isVerified: verified2.isVerified,
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
// import fs from "fs";
// import userschema from "../models/user.js";
// import userOtp from '../models/otp.js'
// import jwt from "jsonwebtoken";
// import nodemailerConfig from "../config/node-mailer.js";
// import session from "express-session";

// // user Registration
// const register = async (req, res) => {
//   try {
//     const { name, email, username, password } = req.body;
//     //check username and email exist or not
//     userschema.findOne({ $or: [{ username: username }, { email: email }] }, async(err, user) => {
//       if (err) return res.send(err);
//       if (user) return res.status(409).json({ msg: user.email === req.body.email ? "Email aready exist" : "username already exist" });

//       //trim white space
//       if (!email.trim() || !username.trim() || !password.trim()) {
//         return res.status(400).json({ msg: "All fields are required and cannot be blank" });
//       } else {
//         //if username and email not exist then save to database
//         if (req.body) {
//           // generate random 6 digit code
//           const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
//           const otp = randomNumber;

//           // req.session.otp = otp
//           // req.session.name = name
//           // req.session.username = username
//           // req.session.email = email
//           // req.session.password = password

//           //jwt token sign
//           const token = jwt.sign(
//             {
//               username: username,
//             },
//             process.env.JWT_SECRET,
//             { expiresIn: "3min" }
//           );

//           userOtp.findOne({email:email}).then(async(result)=>{
//             if(result === null){
//          const userotp = new userOtp({
//             name: name,
//             username: username,
//             email: email,
//             password: password,
//             otp: otp,

//           }).save();
//             }else{
//                 const update = await userOtp.findOneAndUpdate({email:email}, {
//                   name: name,
//                   username: username,
//                   email: email,
//                   password: password,
//                   otp: otp,

//                 },
//                 { new: true }
//                 )

//                 console.log(update)

//             }
//           })

//           // // store all data to user otp collection
//           // const userotp = new userOtp({
//           //   name: name,
//           //   username: username,
//           //   email: email,
//           //   password: password,
//           //   otp: otp,
//           //   token: token,
//           // });

//           // // after add info save it for temporary
//           // userotp.save();

//           //mail details
//           const mailOptions = {
//             from: `Chat App <${process.env.GMAIL}>`,
//             to: `${email}`,
//             subject: "OTP for your account",
//           };
//           //custom email template
//           fs.readFile("./config/nodemailer-template/otp-template.html", "utf-8", (err, data) => {
//             if (err) {
//               console.error(err);
//               return;
//             }
//             //dynamic code replace in html template
//             mailOptions.html = data.replace(/{OTP}/g, otp).replace(/{NAME}/g, name);
//             //send mail
//             nodemailerConfig.transporter.sendMail(mailOptions, (error, info) => {
//               if (error) {
//                 console.log(error);
//               } else {
//                 console.log("Email sent: " + info.response);
//               }
//             });
//           });

// function scheduleTaskForUser() {

//   setTimeout(() => {
//       console.log(`Executing scheduled task for user ...`);
//       // Perform user-specific task here

//       userOtp.findOneAndDelete({ email:email }, function (err, docs) {
//         if (err){
//             console.log(err)
//         }
//         else{
//             console.log("Deleted User : ", docs);
//         }
//     });

//   }, 9000);
// }

// // Iterate through user data and schedule tasks for each user
// // userData.forEach(userData => {
// //     console.log(`Scheduling task for user ${userData.userId} with delay ${userData.delay}ms...`);
// //     scheduleTaskForUser(userData);
// // });

// scheduleTaskForUser();

// // const checkUerOtp = await userOtp.findOne({email})

//           res.status(201).send({ msg: "An OTP sent to your email!", otpPage: true, token: token , status: 201 });
//           console.log(otp);
//         } else {
//           res.status(401).send({ msg: "OTP not sent, something wrong!" });
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

// export default register;

import fs from "fs";
import userschema from "../models/user.js";
import userOtp from "../models/otp.js";
import jwt from "jsonwebtoken";
import nodemailerConfig from "../config/node-mailer.js";
import session from "express-session";
import crypto from "crypto";

// import scheduleTaskForUser from "../helper/scheduleTask.js";

// import {scheduleTaskForUser, otpTimeouts} from '../helper/scheduleTask.js'

// Dictionary to store timeouts for each user
const otpTimeouts = {};

// Function to send OTP
const sendOTP = (email, otp, name) => {
  const mailOptions = {
    from: `Chat App <${process.env.GMAIL}>`,
    to: `${email}`,
    subject: "OTP for your account",
  };
  // Read the HTML template file
  fs.readFile("./config/nodemailer-template/otp-template.html", "utf-8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    // Replace placeholders in the template with actual OTP and name
    mailOptions.html = data.replace(/{OTP}/g, otp).replace(/{NAME}/g, name);
    // Send mail
    nodemailerConfig.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  });
};

const scheduleTaskForUser = (email) => {
  clearTimeout(otpTimeouts[email]); // Clear existing timeout for this user, if any
  const timeoutId = setTimeout(() => {
    console.log(`Executing scheduled task for user with email ${email}...`);
    userOtp.findOneAndDelete({ email: email }, function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted User:", docs);
      }
    });
  }, 180000); // 3 min delay 180000

  otpTimeouts[email] = timeoutId; // Store the timeout ID
};

// user Registration
const register = async (req, res) => {
  const { name, email, password } = req.body;
  const username = req.body.username.toLowerCase();
  const usernameRegex = /^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$/;
  const NamePattern = /^\s*\S+(?:\s+\S+)*\s*$/;
  const whiteSpace = /^\s*$/;

  try {
    const data = fs.readFileSync("./badwords/badword.json", { encoding: "utf8" });

    // Parse the content and split into an array of bad words
    // const badWords = data.split('\n').map(word => word.trim());

    // // Function to check if a string contains bad words
    // const containsBadWord = (input) => {
    //   const words = input.toLowerCase().split(/\s+/);
    //   return words.some(word => badWords.includes(word));
    // };

    // // Example usage
    // const userInput = 'ass whole';

    const badwords = JSON.parse(data).find((value) => value.words === name || value.words === username);
    const RegexBadwords = badwords ? new RegExp(`^${badwords.words}`, "i") : null;

    console.log(RegexBadwords, "RegexBadwords");
    // JSON.parse(data).find((value)=> console.log( value.words === 'panti', 'value'))

    if (RegexBadwords !== null) {
      res.status(400).send({ msg: "You can't use inappropriate language. Restricted action." });

      console.log("User input contains bad word. Restrict action.");
    } else {
      console.log("User input is clean. Proceed.");
      // Proceed with the action

      if (whiteSpace.test(name && username && password)) {
        res.status(400).send({ msg: "Please enter name or username", status: 400 });
      } else {
        if ((username && name) === "" || !NamePattern.test(name)) {
          res.status(400).send({ msg: "Inavlid formate", status: 400 });
        } else {
          if (!usernameRegex.test(username)) {
            res.status(400).send({ msg: "Username must contain only letters, numbers.", status: 400 });
          } else {
            if (password.length < 6) {
              res.status(400).send({ msg: "Password must be longer than 6 characters.", status: 403 });
            } else {
              // Check if username or email already exist
              userschema.findOne({ $or: [{ username: username }, { email: email }] }, async (err, user) => {
                if (err) return res.send(err);
                if (user) return res.status(409).json({ msg: user.email === req.body.email ? "Email already exists" : "Username already exists" });

                // Generate random 6 digit code
                // const otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
                const otp = crypto.randomInt(100000, 999999);

                console.log(otp);

                // Save user data and OTP to the database
                // const newUserOtp = new userOtp({
                //   name: name,
                //   username: username,
                //   email: email,
                //   password: password,
                //   otp: otp,
                // });
                // await newUserOtp.save();

                userOtp.findOne({ email: email }).then(async (result) => {
                  if (result === null) {
                    const userotp = new userOtp({
                      name: name,
                      username: username,
                      email: email,
                      password: password,
                      otp: otp,
                    }).save();
                  } else {
                    const update = await userOtp.findOneAndUpdate(
                      { email: email },
                      {
                        name: name,
                        username: username,
                        email: email,
                        password: password,
                        otp: otp,
                        date: new Date(new Date().getTime() + 3 * 60000),
                      },
                      { new: true }
                    );

                    console.log(update);
                  }
                });

                // // store all data to user otp collection
                // const userotp = new userOtp({
                //   name: name,
                //   username: username,
                //   email: email,
                //   password: password,
                //   otp: otp,
                //   token: token,
                // });

                // // after add info save it for temporary
                // userotp.save();

                // // Function to schedule OTP deletion
                // const scheduleTaskForUser = (email) => {
                //   clearTimeout(otpTimeouts[email]); // Clear existing timeout for this user, if any
                //   otpTimeouts[email] = setTimeout(() => {
                //     console.log(`Executing scheduled task for user with email ${email}...`);
                //     userOtp.findOneAndDelete({ email: email }, function (err, docs) {
                //       if (err) {
                //         console.log(err);
                //       } else {
                //         console.log("Deleted User:", docs);
                //       }
                //     });
                //   }, 180000); // 3 min delay
                // };

                // Send OTP via email
                sendOTP(email, otp, name);

                // Schedule OTP deletion
                scheduleTaskForUser(email);

                // Generate JWT token
                const token = jwt.sign({ username: username }, process.env.JWT_SECRET, { expiresIn: "3min" });

                // Respond with success message and token
                res.status(201).json({ msg: "An OTP sent to your email!", otpPage: true, token: token, status: 201, otpExpire: 180 });
              });
            }
          }
        }
      }
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

export { scheduleTaskForUser, otpTimeouts };

export default register;

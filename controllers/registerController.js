import fs from "fs";
import userschema from "../models/user.js";
import userOtp from '../models/otp.js'
import jwt from "jsonwebtoken";
import nodemailerConfig from "../config/node-mailer.js";
import session from "express-session";


// user Registration
const register = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    //check username and email exist or not
    userschema.findOne({ $or: [{ username: username }, { email: email }] }, (err, user) => {
      if (err) return res.send(err);
      if (user) return res.status(409).json({ msg: user.email === req.body.email ? "Email aready exist" : "username already exist" });

      //trim white space
      if (!email.trim() || !username.trim() || !password.trim()) {
        return res.status(400).json({ msg: "All fields are required and cannot be blank" });
      } else {
        //if username and email not exist then save to database
        if (req.body) {
          // generate random 6 digit code
          const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
          const otp = randomNumber;

          req.session.otp = otp
          req.session.name = name
          req.session.username = username
          req.session.email = email
          req.session.password = password







          //jwt token sign
          const token = jwt.sign(
            {
              username: username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "3min" }
          );







          //store all data to user otp collection
          // const userotp = new userOtp({
          //   name: name,
          //   username: username,
          //   email: email,
          //   password: password,
          //   otp: otp,
          //   token: token,
          // });

          //after add info save it for temporary
          // userotp.save();

          //mail details
          const mailOptions = {
            from: `Chat App <${process.env.GMAIL}>`,
            to: `${email}`,
            subject: "OTP for your account",
          };
          //custom email template
          fs.readFile("./config/nodemailer-template/otp-template.html", "utf-8", (err, data) => {
            if (err) {
              console.error(err);
              return;
            }
            //dynamic code replace in html template
            mailOptions.html = data.replace(/{OTP}/g, otp).replace(/{NAME}/g, name);
            //send mail
            nodemailerConfig.transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log(error);
              } else {
                console.log("Email sent: " + info.response);
              }
            });
          });
          res.status(201).send({ msg: "An OTP sent to your email!", otpPage: true, token: token , status: 201 });
          console.log(otp);
        } else {
          res.status(401).send({ msg: "OTP not sent, something wrong!" });
        }
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

export default register;

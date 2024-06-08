import userschema from "../models/user.js";
import profileSchema from "../models/profile.js";
import disableSchema from "../models/disable.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from 'path'
import { fileURLToPath } from 'url';
import  {dirname}  from "path"
import maxmind from "maxmind"
import { Reader } from '@maxmind/geoip2-node';
import sendMail from "../mail/sendMail.js";
import useragent from "useragent";


//post request for login
const login = async (req, res) => {
  const domain = req.hostname;
  const forwarded = req.headers['x-forwarded-for'];
  const source = req.headers['user-agent'];
  const agent = useragent.parse(source);
  const ip = forwarded ? forwarded.split(',').shift() : req.ip;

  const __dirname = dirname(fileURLToPath(import.meta.url))

 
// Path to the GeoLite2 database file
const dbPath = path.join(__dirname, '../geolite/GeoLite2-City.mmdb');

// Open the GeoLite2 database
Reader.open(dbPath).then(reader => {
  console.log(reader.city('180.149.232.168'));
});

  try {
    //collect data from body
    const {identifier, username, email, password } = req.body;

    if (Object.keys(identifier && password).length !== 0) {
      //find username and email
      const user = await userschema.findOne({
        $or: [{ username: identifier }, { email: identifier }],
      });

      console.log(user, 'hh');

      if (user ) {
        const encPass = await bcrypt.compare(password, user.password);
        if (encPass) {
          const disable = await disableSchema.findOne({
            $or: [{ identifier: identifier }, { email: identifier }],
          });

          if (disable) {
            res.status(400).send({ title: disable.Title, text: disable.Text, status:400 });
          } else {

            const resendtoken = jwt.sign(
              {
                username: user.username,
                id: user._id,
              },
              process.env.JWT_SECRET,
              { expiresIn: "1y" }
            );

            const profile = await profileSchema.findOne({ Id: user._id });

            // const profilePic = profile ? profile.profilePic : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

            const profilePic = profile ? profile.profilePic : `${domain}/public/default.jpg`;

            // res.cookie( resendtoken , { maxAge: 900000, httpOnly: true })

            // sendOTP(user.email , 'security alert', './mail-template/security-alert.html', null ,user.name  )

      


            res.status(201).send({ id: user._id, profile: profilePic, name: `${user.name}`, username: user.username, email: user.email, token: resendtoken, requestedIp : ip, status: 201 });

            // res.status(201).cookie('token', resendtoken, {httpOnly: true, secure: false, sameSite:'none' }).cookie('c_user', user._id, {httpOnly: true, secure: false, sameSite:'none'})
            // .send({ id: user._id, profile: profilePic, name: `${user.name}`, username: user.username, email: user.email, token: resendtoken, status:201 })



         }
        } else {
          res.status(401).send({ msg: "username or password incorrect", status: 401 });
        }
      } else {
        res.status(401).send({ msg: "username or password incorrect", status: 401 });
      }
    } else {
      res.status(401).send({ msg: "Email and password should not be empty!", status: 401 });
    }
  } catch (error) {
    res.send(error);
  }
};

export default login;

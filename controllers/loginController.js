import userschema from "../models/user.js";
import profileSchema from "../models/profile.js";
import disableSchema from "../models/disable.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//post request for login
const login = async (req, res) => {
  const domain = req.hostname;
  try {
    //collect data from body
    const {identifier, username, email, password } = req.body;

    if (Object.keys(identifier && password).length !== 0) {
      //find username and email
      const user = await userschema.findOne({
        $or: [{ username: identifier }, { email: identifier }],
      });

      console.log(user);

      if (user) {
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

            res.status(201).send({ id: user._id, profile: profilePic, name: `${user.name}`, username: user.username, email: user.email, token: resendtoken, status: 201 });

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

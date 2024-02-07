import userschema from "../models/user.js";
import profileSchema from "../models/profile.js";

const otp = async (req, res) => {
  const { otp } = req.body;

  const otpInt = parseInt(otp);
  const domain = req.hostname;

console.log(req.body, 'otp')
  try {
    if (otpInt === req.session.otp) {
      const userData = new userschema({
        name: req.session.name,
        username: req.session.username,
        email: req.session.email,
        password: req.session.password,
      });

      const insertData = await userData.save();

      if (insertData) {
        const profile = new profileSchema({
          Id: insertData._id,
          profilePic: `public/default.jpg`,
          name: insertData.name,
          username: insertData.username,
        });

        profile.save();

        res.status(201).send({ msg: "verified", otpPage: false });
        req.session.destroy();
      }

      console.log(insertData);
    } else {
      res.status(400).send({ msg: "Otp not Match!" });
    }
  } catch (error) {
    console.log(error);
  }
};

export default otp;














































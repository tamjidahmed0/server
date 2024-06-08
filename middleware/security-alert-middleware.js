import { Reader } from '@maxmind/geoip2-node';
import useragent from "useragent";
import sendMail from "../mail/sendMail.js";
import path from 'path'
import { fileURLToPath } from 'url';
import  {dirname}  from "path"
 

const securityAlert = async (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const source = req.headers['user-agent'];
    const agent = useragent.parse(source);
    const ip = forwarded ? forwarded.split(',').shift() : req.ip;
  
    const __dirname = dirname(fileURLToPath(import.meta.url))
  
   
  // Path to the GeoLite2 database file
  const dbPath = path.join(__dirname, '../geolite/GeoLite2-City.mmdb');
  
//   // Open the GeoLite2 database
//   Reader.open(dbPath).then(reader => {
//     console.log(reader.city(ip));
//   });

  try {
  const reader = await Reader.open(dbPath)

  console.log(reader.city(ip).country.names.en)
  console.log(reader.city(ip).city.names.en)
  console.log(agent.device.toString())
  console.log(agent.toAgent())
 


//   sendMail({
//     email: user.email,
//     subject: 'We notice a new login',
//     template: './mail-template/security-alert.html',
//     name: user.name,
//     ip: '180.149.232.168',
//     os:'windows 10',
//     location: 'Bangladesh',
//     browser: 'chrome',
//     device: 'desktop',
//     time: '2 October 2024'
//   })


  } catch (error) {
    
  }
  


  };


export default securityAlert;
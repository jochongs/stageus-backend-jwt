const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    "accessKeyId": process.env.AWS_ACCESSKEYID,
    "secretAccessKey": process.env.AWS_SECRETACCESSKEY,
    "region": process.env.AWS_REGION
}
const dotenv = require('dotenv');
dotenv.config();

module.exports = process.env.JWT_SECRET_KEY;
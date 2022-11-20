const AWS = require('aws-sdk');
const aws_config = require('../config/aws_config');

AWS.config.update(aws_config);
const s3 = new AWS.S3();

module.exports = s3;
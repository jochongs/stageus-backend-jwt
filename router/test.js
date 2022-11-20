const router = require('express').Router();
const pgConfig = require('../config/pg_config');

const { Sequelize } = require('sequelize');
const sequelize = require('../module/sequelize');


(async ()=>{
    try{
        await sequelize.authenticate();
        console.log('Connection has been stablished successfully.');
    }catch(err){
    }
})();

module.exports = router;
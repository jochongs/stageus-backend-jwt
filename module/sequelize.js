const router = require('express').Router();
const pgConfig = require('../config/pg_config');

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(pgConfig.database,pgConfig.user,pgConfig.password,{
    host : 'localhost',
    dialect : 'postgres'
});

module.exports = sequelize;
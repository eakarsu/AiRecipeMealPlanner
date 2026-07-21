const express=require('express');
const {sequelize}=require('../models');
const auth=require('../middleware/auth');
const {createWorkflow}=require('./workflowCore');
const {createGovernedRouter}=require('./routerFactory');
const run=async(client,sql,params,transaction)=>{const [rows]=await client.query(sql,{bind:params,transaction});return rows;};
const db={query:(sql,params)=>run(sequelize,sql,params),transaction:work=>sequelize.transaction(transaction=>work((sql,params)=>run(sequelize,sql,params,transaction)))};
module.exports=createGovernedRouter({express,workflow:createWorkflow(require('./config')),auth,db});

const elastic = require('elasticsearch');
const { Client } = require('pg');
require('dotenv').config({path : '../.env'});
const pgConfig = {
    user : process.env.POSTGRE_USER,
    password : process.env.POSTGRE_PASSWORD,
    host : process.env.POSTGRE_HOST,
    database : process.env.POSTGRE_DATABASE,
    post : process.env.POSTGRE_POST
}

const saveCommentDataToEs = async () => {
    try{
        //CONNECT pg
        const pgClient = new Client(pgConfig);
        await pgClient.connect();

        //CONNECT es
        const esClient = new elastic.Client({
            node : "http://localhost:9200"
        });

        //SELECT 
        const selectCommentDataSql = 'SELECT * FROM backend.comment JOIN backend.account ON comment_author = account.id';
        const selectQueryResult = await pgClient.query(selectCommentDataSql);
        const commentDataArray = selectQueryResult.rows;

        for(let i = 0; i < commentDataArray.length; i++){
            //prepare data
            const commentData = commentDataArray[i];

            //POST data to elasticsearch
            const response = await esClient.index({
                index : 'comment',
                id : commentData.comment_idx,
                body : {
                    comment_idx : commentData.comment_idx,
                    post_idx : commentData.post_idx,
                    comment_contents : commentData.comment_contents,
                    comment_author : commentData.comment_author,
                    comment_date : new Date(commentData.comment_date).getTime(),
                    nickname : commentData.nickname
                }
            });

            console.log(response);
        }
    }catch(err){
        console.log(err);
    }
}

saveCommentDataToEs();
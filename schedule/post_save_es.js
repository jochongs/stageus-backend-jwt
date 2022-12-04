const elastic = require('elasticsearch');
const { Client } = require('pg');
require('dotenv').config({ path : '../.env'});
const pgConfig = {
    user : process.env.POSTGRE_USER,
    password : process.env.POSTGRE_PASSWORD,
    host : process.env.POSTGRE_HOST,
    database : process.env.POSTGRE_DATABASE,
    post : process.env.POSTGRE_POST
}



const savePostDataToEs = async () => {
    try{
        //CONNECT pg
        const pgClient = new Client(pgConfig);
        await pgClient.connect();

        //CONNECT es
        const esClient = new elastic.Client({
            node : "http://localhost:9200"
        });
        
        //SELECT 
        const selectPostDataSql = 'SELECT * FROM backend.post JOIN backend.account ON post.post_author = account.id';
        const selectQueryResult = await pgClient.query(selectPostDataSql);
        const postDataArray = selectQueryResult.rows;

        for(let i = 0; i < postDataArray.length; i++){
            //prepare data
            const postData = postDataArray[i];

            //SELECT mapping
            const selectImgPathSql = 'SELECT * FROM backend.post_img_mapping WHERE post_idx = $1';
            const imgPathArray = await pgClient.query(selectImgPathSql, [postData.post_idx]);

            //POST data to elasticsearch
            const response = await esClient.index({
                index : 'post',
                id : postData.post_idx,
                body : {
                    post_idx : postData.post_idx,
                    post_title : postData.post_title,
                    post_contents : postData.post_contents,
                    post_author : postData.post_author,
                    post_date : new Date(postData.post_date).getTime(),
                    post_img_path : imgPathArray.rows.map((imgPathData) => imgPathData.img_path),
                    nickname : postData.nickname
                }
            });

            console.log(response);
        }
    }catch(err){
        console.log(err);
    }
}

savePostDataToEs();
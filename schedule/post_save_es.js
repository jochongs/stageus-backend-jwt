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
        const selectPostDataSql = 'SELECT * FROM backend.post';
        const selectQueryResult = await pgClient.query(selectPostDataSql);
        const postDataArray = selectQueryResult.rows;

        for(let i = 0; i < postDataArray.length; i++){
            //prepare data
            const postData = postDataArray[i];

            //SELECT mapping
            const selectImgPathSql = 'SELECT * FROM backend.post_img_mapping WHERE post_idx = $1';
            const imgPathArray = await pgClient.query(selectImgPathSql, [postData.post_idx]);

            //SELECT commnet 
            const selectCommentSql = 'SELECT * FROM backend.comment WHERE post_idx = $1';
            const selectCommentQuery = await pgClient.query(selectCommentSql, [postData.post_idx]);
            const commentDataArray = selectCommentQuery.rows;

            console.log(commentDataArray.map((comment) => {return {comment_idx : comment.comment_idx, comment_author : comment.comment_author, comment_contents : comment.comment_contents, comment_date : comment.comment_date}}));

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
                    comment : commentDataArray.map((comment) => {return {comment_idx : comment.comment_idx, comment_author : comment.comment_author, comment_contents : comment.comment_contents, comment_date : comment.comment_date}})
                }
            });

            console.log(response);
        }
    }catch(err){
        console.log(err);
    }
}

savePostDataToEs();

const elastic = require('elasticsearch');
const elasticConfig = require('../config/elastic_config'); 
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const searchKeywordSave = require('../module/search_keyword_save');

//post 추가 함수
const postAdd = (postData) => {
    //prepare data
    const titleValue = postData.title;
    const contentsValue = postData.contents;
    const postAuthor = postData.author;
    const fileArray = postData.fileArray;

    return new Promise(async (resolve, reject) => {
        //CONNECT psql
        const pgClient = new Client(pgConfig);
        try{
            await pgClient.connect();
            
            //BEGIN
            await pgClient.query("BEGIN");

            //INSERT post data
            const sql = `INSERT INTO backend.post (post_title,post_contents,post_author) VALUES ($1,$2,$3) RETURNING post_idx`;
            const valueArray = [titleValue, contentsValue, postAuthor];
            const postData = await pgClient.query(sql, valueArray);
            const postIdx = postData.rows[0].post_idx;

            //INSERT post_img_path
            const sql2 = `INSERT INTO backend.post_img_mapping (post_idx,img_path) VALUES ($1,$2)`;
            for(let i = 0; i < fileArray.length; i++){
                await pgClient.query(sql2, [postIdx, fileArray[i].transforms[0].key]);
            }
            
            //COMMIT 
            await pgClient.query('COMMIT');

            //resolve
            resolve(1);
        }catch(err){
            console.log(err);

            //ROLLBACK
            pgClient.query('ROLLBACK');

            //reject
            reject({
                message : err.message
            });
        }
    })
}

//post 수정 함수
const postModify = (postIdx, requestUserData, postData) => {
    //prepare data
    const titleValue = postData.title;
    const contentsValue = postData.contents;

    return new Promise(async (resolve, reject) => {
        //CONNECT psql
        const pgClient = new Client(pgConfig);
        try{
            await pgClient.connect();

            //SELECT post_author query for login auth check
            const sql = `SELECT post_author FROM backend.post WHERE post_idx=$1`;
            const selectResult = await pgClient.query(sql, [postIdx]);

            //auth check
            if(selectResult.rows[0].post_author === requestUserData.id || requestUserData.authority === 'admin'){
                //UPDATE 
                const sql2 = 'UPDATE backend.post SET post_title=$1,post_contents=$2 WHERE post_idx=$3';
                await pgClient.query(sql2, [titleValue, contentsValue, postIdx]);

                //resolve
                resolve(1);
            }else{
                //reject
                reject({
                    auth : false,
                    message : "권한이 없습니다."
                });
            }
        }catch(err){
            //reject
            reject({
                auth : true,
                message : err.message
            });
        }
    })
}

module.exports = {
    postAdd : postAdd,
    postModify : postModify
}
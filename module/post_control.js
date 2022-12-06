const elastic = require('elasticsearch');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const s3 = require('../module/s3');
const axios = require('axios');

//게시글 검색하는 함수
const postSearch = async (keyword = "", option = { search : 'post_title', size : 30, from : 0 }) => {
    return new Promise(async (resolve, reject) => {
        try{
            //CONNECT es
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            })

            //EXSITS
            const exitsResult = await esClient.indices.exists({
                index : 'post',
            })
            if(!exitsResult || keyword === ""){
                resolve([])
            }
            
            //SEARCH
            const searchResult = await esClient.search({
                index : 'post',
                body : {
                    query : {
                        wildcard : {
                            [option.search] : `*${keyword}*`   
                        }
                    },
                    from : option.from * option.size,
                    size : option.size
                }
            })

            resolve(searchResult);
        }catch(err){
            reject({
                err : err,
                message : "es 에러 발생"
            });
        }
    })
}

//게시글 가져오는 함수
const postGetAll = (option = { from : 0, size : 30}) => {
    return new Promise(async (resolve, reject) => {
        try{
            console.log(option.from, option.size);
            //CONNECT es
            const esClient = new elastic.Client({
                node : "http://localhost:9200"
            });

            //EXIST
            const exitsResult = await esClient.indices.exists({
                index : 'post'
            })

            //check data
            if(exitsResult){
                //SEARCH post ( all )
                const searchResult = await esClient.search({
                    index : 'post',
                    body : {
                        query : {
                            match_all : {}
                        },
                        size : option.size,
                        from : option.from * option.size,
                        sort : [{
                            post_idx : 'desc'
                        }]
                    }
                })

                //resolve
                resolve({
                    data : searchResult.hits.hits.map((data) => {
                        return data._source
                    })
                })
            }else{
                resolve([]);
            }
        }catch(err){
            //reject
            reject({
                err : err,
                message : 'ES에러 발생'
            })
        }
    })
}

//게시글 추가 함수
const postAdd = (postData) => {
    //prepare data
    const titleValue = postData.title;
    const contentsValue = postData.contents;
    const postAuthor = postData.author;
    const fileArray = postData.fileArray;
    const date = new Date();
    date.setHours(date.getHours() + 9);

    return new Promise(async (resolve, reject) => {
        //CONNECT psql
        const pgClient = new Client(pgConfig);
        try{
            await pgClient.connect();
            
            //BEGIN
            await pgClient.query("BEGIN");
            
            //SELECT nickname
            const selectNicknameSql = 'SELECT nickname FROM backend.account WHERE id = $1';
            const selectNicknameResult = await pgClient.query(selectNicknameSql, [postAuthor]);
            const AuthorNickname = selectNicknameResult.rows[0].nickname;

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

            //INSERT post data to ES
            const esConnect = elastic.Client({
                node : "http://localhost:9200"
            });
            await esConnect.index({
                index : 'post',
                body : {
                    post_idx : postIdx,
                    post_title : titleValue,
                    post_contents : contentsValue,
                    post_author : postAuthor,
                    post_date : date.getTime(),
                    post_img_path : fileArray.map((file) => file.transforms[0].key),
                    nickname : AuthorNickname
                }
            })
            
            //COMMIT 
            await pgClient.query('COMMIT');

            //resolve
            resolve(1);
        }catch(err){
            //ROLLBACK
            pgClient.query('ROLLBACK');

            //reject
            reject({
                err : err,
                message : err.message
            });
        }
    })
}

//게시글 수정 함수
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
                err : err,
                auth : true,
                message : err.message
            });
        }
    })
}

//게시글 삭제 함수
const postDelete = (postIdx, requestUserData) => {
    return new Promise(async (resolve, reject) => {
        //CONNECT postgre
        const pgClient = new Client(pgConfig);
        try{
            await pgClient.connect();

            //SELECT post_author, img_path 
            const selectSql = `SELECT post_author, img_path FROM backend.post LEFT JOIN backend.post_img_mapping ON backend.post.post_idx = backend.post_img_mapping.post_idx WHERE backend.post.post_idx=$1`;
            const selectData = await pgClient.query(selectSql,[postIdx]);
            const postAuthor = selectData.rows[0].post_author;
            const imgPathArray = [];
            if(selectData.rows[0].img_path !== null){
                selectData.rows.map((row) => {
                    imgPathArray.push(row.img_path);
                })
            }

            //auth check
            if(postAuthor === requestUserData.id || requestUserData.authority === 'admin'){
                //BEGIN
                await pgClient.query('BEGIN');

                //DELETE post data
                const delPostSql = 'DELETE FROM backend.post WHERE post_idx = $1';
                await pgClient.query(delPostSql, [postIdx]);

                //DELETE post_img_mapping data
                const delPostImgMappingSql = 'DELETE FROM backend.post_img_mapping WHERE post_idx = $1';
                await pgClient.query(delPostImgMappingSql, [postIdx]);

                //DELETE post img ON s3
                for(const imgPath of imgPathArray){
                    await s3.deleteObject({
                        Bucket: 'jochong/post', 
                        Key: imgPath
                    }).promise();
                }

                //COMMIT
                await pgClient.query('COMMIT');

                //resolve
                resolve(1);
            }else{
                reject({
                    message : "권한이 없습니다.",
                    auth : false
                })
            }
        }catch(err){
            //ROLLBACK
            await pgClient.query('ROLLBACK');

            //reject
            reject({
                err : err,
                message : "DB에러가 발생했습니다.",
                auth : true
            })
        }
    })
}

module.exports = {
    postAdd : postAdd,
    postModify : postModify,
    postDelete : postDelete,
    postGetAll : postGetAll,
    postSearch : postSearch
}
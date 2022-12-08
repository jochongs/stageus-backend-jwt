const axios = require('axios');
const elastic = require('elasticsearch');
const { Client } = require('pg');
const userId = 'asdf1234';
const postNumber = 3000000; // 3,000,000 ( 300만 )
require('dotenv').config({ path : '../.env'});
const pgConfig = {
    user : process.env.POSTGRE_USER,
    password : process.env.POSTGRE_PASSWORD,
    host : process.env.POSTGRE_HOST,
    database : process.env.POSTGRE_DATABASE,
    post : process.env.POSTGRE_POST
}
const pgClient = new Client(pgConfig);
pgClient.connect();

//INSERT post data to ES
const esConnect = elastic.Client({
    node : "http://localhost:9200"
});


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
        try{
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
            await esConnect.index({
                index : 'post',
                id : postIdx,
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

const addTestPostData = async () => {
    for(let i = 0; i < postNumber; i++){
        try{
            //prepare data
            const response = await axios.post('https://hangul.thefron.me/api/generator');
            const contents = response.data.ipsum;
            const title = contents.split('.')[0]
    
            //ADD
            await postAdd({
                title : title.substr(0,31),
                contents : contents,
                author : userId,
                fileArray : []
            })
            console.log(`${i}. : data INSERT complete ||  "${title.substr(0,31)}"`)
        }catch(err){
            console.log(err);
            break;
            console.log(`${i}. : error occured`)
        }
    }

    for(let i = 0; i < postNumber; i++){
        try{
            //prepare data
            const response = await axios.post('http://guny.kr/stuff/klorem/gen.php');
            const contents = response.data;
            const postData = {
                title : contents.shorts[0].substr(0,31),
                contents : contents.lines[0],
                author : userId,
                fileArray : []
            }
    
            //ADD
            await postAdd(postData)
            console.log(`${i}. : data INSERT complete ||  "${postData.title}"`);
        }catch(err){
            console.log(`${i} : error occured`);
        }
    }
}

addTestPostData();
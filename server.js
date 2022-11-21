//모듈 import ==================================================================================================================================================
const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const fs = require('fs');
const https = require('https');
const logging = require('./module/logging');

const sessionApi = require('./router/session');
const pagesApi = require('./router/pages');
const accountApi = require('./router/account');
const postApi = require('./router/post');
const commentApi = require('./router/comment');
const authApi = require('./router/auth');
const logApi = require('./router/log');
const admin_auth_check = require('./module/admin_auth_check');
//const testApi = require('./router/test');

//설정 =========================================================================================================================================================
dotenv.config();
const PUBLIC_PATH = path.join(__dirname,'public');
const options = {
    "key" : fs.readFileSync('/etc/letsencrypt/live/backend.xn--289a320aihm.com/privkey.pem'),
    "cert" : fs.readFileSync('/etc/letsencrypt/live/backend.xn--289a320aihm.com/cert.pem'),
    "ca" : fs.readFileSync('/etc/letsencrypt/live/backend.xn--289a320aihm.com/fullchain.pem')
}

//전역 미들웨어 =====================================================================================================================================================
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({ 
    secret : "sadfklasdjfl", //대충 입력
    resave : false,
    saveUninitialized : true,
}));
app.use((req,res,next)=>{ //로깅 미들웨어
    const oldSend = res.send;
    req.date = new Date();
    res.send = (result)=>{
        if(typeof(result) === 'string' && req.originalUrl.split('/')[1] !== 'log'){
            logging(req,res,result);
        }else if(typeof(result) === 'string' && req.originalUrl.split('/')[1] === 'log'){
            logging(req,res,"hidden");
        }
        return oldSend.apply(res,[result]);
    }
    next();
});

app.use("/page",pagesApi);
app.use('/account',accountApi);
app.use('/session',sessionApi);
app.use('/post',postApi);
app.use('/comment',commentApi);
app.use('/auth',authApi);
app.use('/log', admin_auth_check, logApi);
//app.use('/test',testApi);


//페이지==========================================================================================================================================================
//https로 리다이렉트
app.get('*',(req,res,next)=>{
    const protocol = req.protocol;
    if(protocol === 'https'){
        next();
    }else{
        const des = "https://" + req.hostname + ":443" + req.url;
        console.log('리다이렉트 됨');
        res.redirect(des);
    }
})

//메인페이지
app.get('/',(req,res)=>{
    res.sendFile(path.join(PUBLIC_PATH,'html','index.html'));
});

//404에러 페이지
app.get('*',(req,res)=>{
    res.sendFile((path.join(PUBLIC_PATH,'html','error404.html')));
})

app.get('/favicon.ico',(req,res)=>{
    console.log('hihihisdaflkasdjfkldfsaj');
})

//listen
app.listen(process.env.PORT,'0.0.0.0',()=>{
    console.log(`web server on  PORT : ${process.env.PORT}`); 
});

https.createServer(options,app).listen(process.env.HTTPS_PORT,'0.0.0.0',()=>{
    console.log(`web server on PORT : ${process.env.HTTPS_PORT}`)
})
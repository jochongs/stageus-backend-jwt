const router = require('express').Router();
const path = require('path');
const loginAuthCheck =require('../module/login_auth_check');
const adminAuthCheck = require('../module/admin_auth_check');
const PUBLIC_PATH = path.join(__dirname,'..','public');

//로그인 페이지
router.get('/login', (req, res)=>{
    res.sendFile(path.join(PUBLIC_PATH,'html','login.html'));
});

//회원가입 페이지 
router.get('/signup', (req, res)=>{
    res.sendFile(path.join(PUBLIC_PATH,'html','signup.html'));
})

//에러 페이지
router.get('/error', (req, res)=>{
    res.sendFile(path.join(PUBLIC_PATH,'html','error.html'));
});

//게시글 디테일 페이지
router.get('/post/:postIdx', (req, res)=>{
    res.sendFile(path.join(PUBLIC_PATH,'html','post_detail.html'));
})

//모든 회원 정보 보기 페이지
router.get('/admin', adminAuthCheck,(req, res)=>{
    res.sendFile(path.join(PUBLIC_PATH,'html','account_admin.html'));
})

//회원 정보 보기 페이지
router.get('/account/:userId', loginAuthCheck,(req, res)=>{
    const loginUserId = req.session.userId;
    const userAuthority = req.session.authority;
    const requestUserId = req.params.userId;

    if(loginUserId === requestUserId || userAuthority === 'admin'){
        res.sendFile(path.join(PUBLIC_PATH,'html','account_detail.html'));
    }else{
        res.sendFile(path.join(PUBLIC_PATH,'html','index.html'));
    }
})       

//test페이지
router.get('/test', (req, res)=>{
    res.sendFile(path.join(PUBLIC_PATH,'html','test.html'));
})


module.exports = router;
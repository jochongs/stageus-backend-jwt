const router = require('express').Router();
const path = require('path');
const admin_auth_check = require('../module/admin_auth_check');
const PUBLIC_PATH = path.join(__dirname,'..','public');

//로그인 페이지
router.get('/login', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH,'html','login.html'));
});

//회원가입 페이지 
router.get('/signup', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH,'html','signup.html'));
})

//에러 페이지
router.get('/error', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH,'html','error.html'));
});

//게시글 디테일 페이지
router.get('/post/:postIdx', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH,'html','post_detail.html'));
})

//관리자 페이지
router.get('/admin', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH,'html','account_admin.html'));
})

//회원 정보 보기 페이지
router.get('/account/:userId', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH,'html','account_detail.html'));
})       

//test페이지
router.get('/test', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH,'html','test.html'));
})


module.exports = router;
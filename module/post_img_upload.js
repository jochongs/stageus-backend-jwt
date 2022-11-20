const multer = require('multer');
const multerS3 = require('multer-s3-transform');
const sharp = require('sharp');
const s3 = require('../module/s3');

//setting ==================================================================

const postImgUpload = multer({
    storage: multerS3({
        s3 : s3,
        bucket : "jochong/post",
        contentType : multerS3.AUTO_CONTENT_TYPE,
        shouldTransform: function (req, file, cb) {
            cb(null, /^image/i.test(file.mimetype)); //이미지 파일인지 아닌지 확인하는 정규표현식
        },
        transforms: [
            {
                id: 'post_img',
                key: function (req, file, cb) {
                    cb(null, Date.now().toString()+'.png');
                },
                transform: function (req, file, cb) {
                    cb(null, sharp().resize({width : 300}));
                }
            }
        ],
        acl : 'public-read',
        contentType : multerS3.AUTO_CONTENT_TYPE,
    }),
    fileFilter : (req, file, cb)=>{
        if(req.body.title.length !==0 && req.body.title.length <= 32 && req.body.contents.length !== 0){
            cb(null, true);
        }else{
            cb(null, false);
        }
    },
    limits : {
        fileSize: 1*1024*1024,
        files : 3
    }
})

module.exports = postImgUpload;
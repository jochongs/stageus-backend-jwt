const path = require('path');

module.exports = (req,res,next)=>{
    if(req.session.authority === 'admin'){
        next();
    }else{
        res.redirect('/');  
    }
}
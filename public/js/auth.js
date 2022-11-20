const router = require('express').Router();

router.get('/login',(req,res)=>{
    const result = {
        state : false
    }
    if(req.session.userId === undefined){
        res.send(result);
    }else{
        result.state = true;
        res.send(result);
    }
})

module.exports = router;

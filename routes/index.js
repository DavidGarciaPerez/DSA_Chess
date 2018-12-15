let express = require('express'),
    router = express();

/* GET home page. */
router.get("/",(req,res)=>{
    res.render("./index/index");
});

module.exports = router;

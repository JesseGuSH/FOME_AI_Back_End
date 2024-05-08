var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/api/upload-video", function (req, res, next) {
  res.send("respond with a resource");
});

module.exports = router;

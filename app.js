var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var formData = require("express-form-data");
// var os = require("os");
var videoUploading = require("./utils/VideoUploading");
const { transferFile } = require("./utils/videoUploading");

// var indexRouter = require("./routes/index");
// var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(formData.parse());

// app.use("/", indexRouter);
// app.use("/users", usersRouter);
app.post("/", async (req, res) => {
  // console.log("body: " + req.body.uri);
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    // Assuming you only expect one file to be uploaded
    const videoFile = req.files.video;

    // Use videoFile.tempFilePath to get the temporary file path
    const filePath = videoFile.path;
    console.log(filePath);

    // Assuming these variables are defined elsewhere
    const ip = "40.82.202.11";
    const port = 22;
    const username = "fome";
    const password = "fome12345678.";
    const remoteVideoPath = "/home/fome/data/INPUT";
    const combinedCommands = `cd /home/fome/anaconda3/bin; source activate; cd /home/fome/Cloud_Pose; python pose_main.py --video_path ${remoteVideoPath}/${videoFile.name} --action YOUR_ACTION`;

    await videoUploading.transferFile(
      ip,
      port,
      username,
      password,
      filePath,
      `${remoteVideoPath}/${videoFile.name}`,
      true
    );
    await videoUploading.executeCommands(
      ip,
      port,
      username,
      password,
      combinedCommands
    );
    // Continue with other operations
    res.send("Video UpvideoUploading completed");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

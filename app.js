var createError = require("http-errors");
var express = require("express");
const fs = require("fs");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var formData = require("express-form-data");
var videoUploading = require("./utils/VideoUploading");
var { transferFile } = require("./utils/VideoUploading");
const { exec } = require("child_process");
const { Client } = require("ssh2");

// var indexRouter = require("./routes/index");
// var jsonRouter = require("./routes/index");

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
// app.use("/json-data", jsonRouter);

function executeCommands(ip, port, username, password, commands) {
  const conn = new Client();
  conn
    .on("ready", () => {
      conn.exec(commands, (err, stream) => {
        if (err) throw err;
        stream
          .on("close", (code, signal) => {
            console.log("Commands executed successfully");
            conn.end();
          })
          .on("data", (data) => {
            console.log("STDOUT: " + data);
          })
          .stderr.on("data", (data) => {
            console.log("STDERR: " + data);
          });
      });
    })
    .connect({
      host: ip,
      port: port,
      username: username,
      password: password,
    });
}

app.post("/", async (req, res) => {
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
    const test_video_name = "testvideoQUT_plank.mp4";
    const action = "plank"; // Replace YOUR_ACTION with your desired action

    await videoUploading.transferFile(
      ip,
      port,
      username,
      password,
      filePath,
      `${remoteVideoPath}/${videoFile.name}`,
      true
    );

    // Command to execute on the remote server
    const command = `
      cd /home/fome/anaconda3/bin &&
      source activate &&
      cd /home/fome/Cloud_Pose &&
      python pose_main.py --video_path ${remoteVideoPath}/${test_video_name} --action ${action}
    `;

    // Execute the command on the server
    await executeCommands(ip, port, username, password, command);

    const jsonFilePath = path.join(
      "/home/fome/data/OUTPUT",
      test_video_name.split(".")[0] + ".json"
    );

    const localOutputPath = path.join(
      "/users/jesse/Desktop/0515_FOME_Demo_Result/",
      test_video_name.split(".")[0] + ".json"
    );

    videoUploading.transferFile(
      ip,
      port,
      username,
      password,
      localOutputPath,
      jsonFilePath,
      false
    );

    const pngFilePath = path.join(
      "/home/fome/data/OUTPUT",
      test_video_name.split(".")[0] + "_plank" + ".png"
    );

    const localpngOutputPath = path.join(
      "/users/jesse/Desktop/0515_FOME_Demo_Result/",
      test_video_name.split(".")[0] + "_plank" + ".png"
    );

    videoUploading.transferFile(
      ip,
      port,
      username,
      password,
      localpngOutputPath,
      pngFilePath,
      false
    );

    const errorPngFilePath = path.join(
      "/home/fome/data/OUTPUT",
      test_video_name.split(".")[0] + "_plank_error" + ".png"
    );

    const localErrorPngOutputPath = path.join(
      "/users/jesse/Desktop/0515_FOME_Demo_Result/",
      test_video_name.split(".")[0] + "_plank_error" + ".png"
    );

    videoUploading.transferFile(
      ip,
      port,
      username,
      password,
      localErrorPngOutputPath,
      errorPngFilePath,
      false
    );

    // Assuming the processing is done and you want to send some response
    res.status(200).send("File uploaded and processed successfully.");
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

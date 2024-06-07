const fs = require("fs");
const { Client } = require("ssh2");
const path = require("path");
const { exec } = require("child_process");

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

function transferFile(
  ip,
  port,
  username,
  password,
  localPath,
  remotePath,
  upload
) {
  const conn = new Client();
  conn
    .on("ready", () => {
      conn.sftp((err, sftp) => {
        if (err) throw err;
        if (upload) {
          sftp.fastPut(localPath, remotePath, (err) => {
            if (err) throw err;
            console.log(`Uploaded ${localPath} to ${remotePath}`);
            conn.end();
          });
        } else {
          sftp.fastGet(remotePath, localPath, (err) => {
            if (err) throw err;
            console.log(`Downloaded ${remotePath} to ${localPath}`);
            conn.end();
          });
        }
      });
    })
    .connect({
      host: ip,
      port: port,
      username: username,
      password: password,
    });
}

if (require.main === module) {
  const args = require("minimist")(process.argv.slice(2));
  const testedActions = ["pushup", "plank"];

  if (testedActions.includes(args.action) && isVideoReadable(args.video_path)) {
    // Server connection details
    const ip = "40.82.202.11";
    const port = 22;
    //Fill in Fome account and password for Azure virtual machine
    const username = "xxxx";
    const password = "xxxxxxxxx";
    const localVideoPath = args.video_path;
    const testVideoName = path.basename(localVideoPath);
    const remoteVideoPath = path.join("/home/fome/data/INPUT", testVideoName);

    // Commands
    const commands = `
            cd /home/fome/anaconda3/bin &&
            source activate &&
            cd /home/fome/Cloud_Pose &&
            python pose_main.py --video_path ${remoteVideoPath} --action ${args.action}
        `;

    // Upload the video file
    transferFile(
      ip,
      port,
      username,
      password,
      localVideoPath,
      remoteVideoPath,
      true
    );

    // Execute the command on the server
    executeCommands(ip, port, username, password, commands);

    // Download the video result file (.json)
    const remoteOutputPath = path.join(
      "/home/fome/data/OUTPUT",
      path.parse(testVideoName).name + ".json"
    );
    const localOutputPath = path.join(
      "/media/xins/xinS1/Cloud_Compution/Test_Data/Result",
      path.parse(testVideoName).name + ".json"
    );
    transferFile(
      ip,
      port,
      username,
      password,
      localOutputPath,
      remoteOutputPath,
      false
    );

    // Read JSON
    fs.readFile(localOutputPath, "utf8", (err, data) => {
      if (err) throw err;
      const loadedState = JSON.parse(data);
      console.log(loadedState.result);
    });

    // Download analysis and pose video if needed
    if (args.download_analysis) {
      const remotePath = "/home/fome/data/OUTPUT";
      const localPath = "/media/xins/xinS1/Cloud_Compution/Test_Data/Result";

      // Download analysis img
      const analysisImgName =
        path.parse(testVideoName).name + "_" + args.action + ".png";
      transferFile(
        ip,
        port,
        username,
        password,
        path.join(localPath, analysisImgName),
        path.join(remotePath, analysisImgName),
        false
      );

      // Download analysis pose video
      const poseVideoName =
        path.parse(testVideoName).name + "_" + args.action + "_pose.mp4";
      transferFile(
        ip,
        port,
        username,
        password,
        path.join(localPath, poseVideoName),
        path.join(remotePath, poseVideoName),
        false
      );

      // Download error image
      if (loadedState.error_idx !== -1) {
        const errorImgName =
          path.parse(testVideoName).name + "_" + args.action + "_error.png";
        transferFile(
          ip,
          port,
          username,
          password,
          path.join(localPath, errorImgName),
          path.join(remotePath, errorImgName),
          false
        );
      }
    }
  } else {
    if (!testedActions.includes(args.action)) {
      console.log("Please select action from", testedActions.join(", "));
    }
    if (!isVideoReadable(args.video_path)) {
      console.log("Please check video path.");
    }
  }
}

module.exports = { transferFile };

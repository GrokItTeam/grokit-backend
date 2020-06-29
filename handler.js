const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "grokit"
});

// projects table

app.get("/projects", function (req, res) {
  const userIdValue = req.query.userId;
  const queryGet = "SELECT * FROM projects WHERE userId = ?;";
  connection.query(queryGet, userIdValue, function (error, data) {
    if (error) {
      console.log("Error fetching projects", error);
      res.status(500).json({
        error: error
      })
    }
    else {
      res.status(200).json({
        projects: data
      })
    }
  })
});

app.put("/projects/:projectId", function (req, res) {
  const projectIdValue = req.params.projectId;
  const nameValue = req.body.name;
  const userIdValue = req.body.userId;  
  const queryUpdate = "UPDATE projects SET name = ?, userId = ? WHERE projectId = ?;";
  connection.query(queryUpdate, [nameValue, userIdValue, projectIdValue], function (error, data) {
    if (error) {
      console.log("Error updating projects", error);
      res.status(500).json({
        error: error
      })
    }
    else {
      res.sendStatus(200)
    }
  })
});


// skills table

app.get("/skills", function (req, res) {
  const projectId = req.query.projectId;
  const queryGet = "SELECT * FROM skills WHERE projectId = ?;";
  connection.query(queryGet, projectId, function (error, data) {
    if (error) {
      console.log("Error fetching skills", error);
      res.status(500).json({
        error: error
      })
    }
    else {
      res.status(200).json({
        skills: data
      })
    }
  })
});

app.put("/skills/:skillId", function (req, res) {
  const skillIdValue = req.params.skillId;
  const nameValue = req.body.name;
  const lastGap0Value = req.body.lastGap0;
  const lastGap1Value = req.body.lastGap1;
  const startedValue = req.body.started;
  const projectIdValue = req.body.projectId;  
  const queryUpdate = "UPDATE skills SET name = ?, lastGap0 = ?, lastGap1 = ?, started = ?, projectId = ? WHERE skillId = ?;";
  connection.query(queryUpdate, [nameValue, lastGap0Value, lastGap1Value, startedValue, projectIdValue, skillIdValue], function (error, data) {
    if (error) {
      console.log("Error updating skills", error);
      res.status(500).json({
        error: error
      })
    }
    else {
      res.sendStatus(200)
    }
  })
});

module.exports.projects = serverless(app);
module.exports.skills = serverless(app);
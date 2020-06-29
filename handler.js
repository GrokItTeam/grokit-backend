const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const moment = require("moment");

const {skillChooser} = require('./skillChooser');
const {markAsPractised} = require('./markAsPractised');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "grokit"
});

// PROJECTS TABLE

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

//get skill to do by projectId
app.get("/projects/:projectId/skillToDo", function (req, res) {
  const projectIdValue = req.params.projectId;
  const queryGet = "SELECT * FROM skills WHERE projectId = ?;";
  connection.query(queryGet, projectIdValue, function (error, data) {
    if (error) {
      console.log("Error fetching skills", error);
      res.status(500).json({
        error: error
      })
    }
    else {
      let skillToDo = skillChooser(data,moment());
      res.status(200).json({
        skillToDo
      })
    }
  })
});


// SKILLS TABLE

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

app.put("skills/:skillId/markAsPractised", function (req, res) {
  console.log(req.query);
});



module.exports.projects = serverless(app);
module.exports.skills = serverless(app);
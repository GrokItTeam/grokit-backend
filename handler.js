const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const moment = require("moment");

const { skillChooser } = require("./skillChooser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "grokit",
});

// get projects

app.get("/projects", function (req, res) {
  const userIdValue = req.query.userId;
  const queryGet = "SELECT * FROM projects WHERE userId = ?;";
  connection.query(queryGet, userIdValue, function (error, data) {
    if (error) {
      console.log("Error fetching projects", error);
      res.status(500).json({
        error: error,
      });
    } else {
      res.status(200).json({
        projects: data,
      });
    }
  });
});

app.post("/projects", function (req, res) {
  const projectAdd = "INSERT INTO projects (name, userId, datePractised) VALUES (?, ?, ?);";
  const querySelect = "SELECT * FROM projects where projectId = ?";

  connection.query(projectAdd, [req.body.name, req.body.userId, req.body.datePractised], function (error, data) {
    if (error) {
      console.log("Error adding a project", error);
      res.status(500).json({
        error: error,
      });
    } else {
      connection.query(querySelect, [data.insertId], function (error, data) {
        if (error) {
          console.log("Error adding a project", error);
          res.status(500).json({
            error: error,
          });
        } else {
          res.status(200).json({
            projects: data,
          });
        }
      });
    }
  });
});

//get skill to do by projectId
app.get("/projects/:projectId/skillToDo", function (req, res) {
  const projectIdValue = req.params.projectId;
  const queryGet = "SELECT * FROM skills WHERE projectId = ?;";
  connection.query(queryGet, projectIdValue, function (error, data) {
    if (error) {
      console.log("Error fetching skills", error);
      res.status(500).json({
        error: error,
      });
    } else {
      let skillToDo = skillChooser(data, moment());
      res.status(200).json({
        skillToDo,
      });
    }
  });
});

// skills table

app.get("/skills", function (req, res) {
  const projectId = req.query.projectId;
  const queryGet = "SELECT * FROM skills WHERE projectId = ?;";
  connection.query(queryGet, projectId, function (error, data) {
    if (error) {
      console.log("Error fetching skills", error);
      res.status(500).json({
        error: error,
      });
    } else {
      res.status(200).json({
        skills: data,
      });
    }
  });
});

app.post("/skills", function (req, res) {
  const skillAdd = "INSERT INTO skills (name, projectId) VALUES (?, ?);";
  const addedSkill = "SELECT * FROM skills where skillId = ?";

  connection.query(skillAdd, [req.body.name, req.body.projectId], function (error, data) {
    if (error) {
      console.log("Error adding a skill", error);
      res.status(500).json({
        error: error,
      });
    } else {
      connection.query(addedSkill, [data.insertId], function (error, data) {
        if (error) {
          console.log("Error adding a skill", error);
          res.status(500).json({
            error: error,
          });
        } else {
          res.status(200).json({
            skill: data[0],
            message: `You successfully added skill ${req.body.name}`,
          });
        }
      });
    }
  });
});

module.exports.projects = serverless(app);
module.exports.skills = serverless(app);

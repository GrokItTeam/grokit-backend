const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const moment = require("moment");

const { skillChooser } = require('./skillChooser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "grokit"
});

// get projects and skills

app.get("/projects", function (req, res) {
  const userIdValue = req.query.userId;
  const queryGetProjects = "SELECT * FROM projects WHERE userId = ?;";
  const queryGetSkills = "SELECT * FROM skills WHERE projectId IN (?);";

  connection.query(queryGetProjects, [userIdValue], function (error, projectData) {
    if (error) {
      console.log("Error fetching projects", error);
      res.status(500).json({
        error: error
      })
    }
    else {
      let projectIds = projectData.map(project => project.projectId);
      console.log(projectIds);
      connection.query(queryGetSkills, [projectIds], function (error, skillData) {
        if (error) {
          console.log("Error fetching skills", error);
          res.status(500).json({
            error: error,
          });
        }
        else {
          const data = projectData.map((project) => {
            const skills = skillData.filter((skill) => skill.projectId === project.projectId);
            project.skills = skills;
            return project;
          });
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
        error: error
      })
    }
    else {
      let skillToDo = skillChooser(data, moment());
      res.status(200).json({
        skillToDo
      })
    }
  })
});

module.exports.projects = serverless(app);
module.exports.skills = serverless(app);
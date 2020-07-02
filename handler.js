const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const moment = require("moment");

const { skillChooser } = require('./skillChooser');
const { markAsPractised } = require('./markAsPractised');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "grokit",
});

// PROJECTS ROUTE

app.get("/projects", function (req, res) {
  const userIdValue = req.query.userId;
  const queryGetProjects = "SELECT * FROM projects WHERE userId = ?;";
  const queryGetSkills = "SELECT * FROM skills WHERE projectId IN (?);";

  connection.query(queryGetProjects, [userIdValue], function (error, projectData) {
    if (error) {
      console.log("Error fetching projects", error);
      res.status(500).json({
        error: error,
      });
    } else {
      const projectIds = projectData.map((project) => project.projectId);
      connection.query(queryGetSkills, [projectIds], function (error, skillData) {
        if (error) {
          console.log("Error fetching skills", error);
          res.status(500).json({
            error: error,
          });
        } else {
          const data = projectData.map((project) => {
            const skills = skillData.filter((skill) => skill.projectId === project.projectId);
            project.skills = skills;
            project.skillToDo = skillChooser(skills, moment()) ? skillChooser(skills, moment()).skillId : false;
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

// SKILLS ROUTE

app.post("/skills", function (req, res) {
  const skillAdd = "INSERT INTO skills (name, projectId, started) VALUES (?, ?, ?);";
  const addedSkill = "SELECT * FROM skills where skillId = ?";

  connection.query(skillAdd, [req.body.name, req.body.projectId, 0], function (error, data) {
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

app.delete("/skills/:skillId", function (req, res) {
  const skillId = req.params.skillId;

  connection.query("DELETE FROM skills WHERE skillId = ?;", [skillId], function (error,data) {
    if (error) {
      console.log("Error deleting skill", error);
      res.status(500).json({
        error: error,
      });
    } else {
      res.sendStatus(200)
    }
  })

});

app.put("/skills/:skillId/markAsPractised", function (req, res) {
  const practisedSkill = markAsPractised(req.body, moment());
  const skillIdValue = req.params.skillId;

  const queryUpdateSkills = "UPDATE skills SET ? WHERE skillId = ?;";
  connection.query(queryUpdateSkills, [practisedSkill, skillIdValue], function (error, skillData) {
    if (error) {
      console.log("Error updating skills", error);
      res.status(500).json({
        error: error
      })
    }
    else {
      const queryUpdateProjects = "UPDATE projects SET datePractised = NOW() WHERE projectId = ?;";
      connection.query(queryUpdateProjects, [practisedSkill.projectId], function (error, projectData) {
        if (error) {
          console.log("Error updating project", error);
          res.status(500).json({
            error: error
          })
        }
        else {
          res.status(200).json({
            practisedSkill
          })
        }
      });
    }
  });
});



module.exports.projects = serverless(app);
module.exports.skills = serverless(app);

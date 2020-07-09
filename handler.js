const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const moment = require("moment");

const { skillChooser } = require("./skillChooser");
const { markAsPractised } = require("./markAsPractised");
const { produceLineChartData, produceProjectsData } = require("./formatDataFromDatabase");
const { produceSchedule } = require("./produceSchedule");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "grokit",
  multipleStatements: true,
});

// PROJECTS ROUTE

app.get("/projects", function (req, res) {
  const userIdValue = req.query.userId;
  const query = "SELECT skillId, nextDate, skills.name skillName, lastGap0, lastGap1, started, projects.projectId, projects.name projectName, datePractised FROM projects LEFT JOIN skills ON skills.projectID = projects.projectId WHERE userId = ?;";

  connection.query(query, [userIdValue], function (error, data) {
    if (error) {
      console.log("Error fetching projects", error);
      res.status(500).json({
        error,
      });
    }
    else {
      const projects = produceProjectsData(data);
      projects.map(project => {
        project.skillToDo = skillChooser(project.skills, moment())
          ? skillChooser(project.skills, moment()).skillId
          : false;
          return project;
      })
      res.status(200).json({
        projects,
      })
    }
  });
});

app.post("/projects", function (req, res) {
  const projectAdd =
    "INSERT INTO projects (name, userId, datePractised) VALUES (?, ?, ?);";
  const querySelect = "SELECT * FROM projects where projectId = ?";

  connection.query(
    projectAdd,
    [req.body.name, req.body.userId, req.body.datePractised],
    function (error, data) {
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
    }
  );
});

app.delete("/projects/:projectId", function (req, res) {
  const projectId = req.params.projectId;
  connection.query(
    "DELETE FROM projects WHERE projectId = ?;",
    [projectId],
    function (error, data) {
      if (error) {
        console.log("Error deleting project", error);
        res.status(500).json({
          error: error,
        });
      } else {
        res.sendStatus(200);
      }
    });
});

app.put("/projects/:projectId", function (req, res) {
  connection.query("UPDATE projects SET name = ? WHERE projectId = ?;", [req.body.name, req.params.projectId], function (error, data) {
    if (error) {
      console.log("Error updating project", error);
      res.status(500).json({
        error
      });
    }
    else {
      res.sendStatus(200);
    }
  });
});

// SKILLS ROUTE

app.post("/skills", function (req, res) {
  const skillAdd =
    "INSERT INTO skills (name, projectId, started) VALUES (?, ?, ?);";
  const addedSkill = "SELECT * FROM skills where skillId = ?";

  connection.query(skillAdd, [req.body.name, req.body.projectId, 0], function (
    error,
    data
  ) {
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
  connection.query(
    "DELETE FROM skills WHERE skillId = ?;",
    [skillId],
    function (error, data) {
      if (error) {
        console.log("Error deleting skill", error);
        res.status(500).json({
          error: error,
        });
      } else {
        res.sendStatus(200);
      }
    });
});

// Mark skill as practised and add to linechart data

app.put("/skills/markAsPractised/:difficulty", function (req, res) {
  const isFirstPractice = !req.body.started;
  const linechartItem = req.body;

  const practisedSkill = markAsPractised(req.body, moment(), req.params.difficulty);
  const skillIdValue = req.body.skillId;

  const queryUpdate = "UPDATE skills SET ? WHERE skillId = ?; UPDATE projects SET datePractised = NOW() WHERE projectId = ?;";
  connection.query(queryUpdate, [practisedSkill, skillIdValue, practisedSkill.projectId], function (
    error,
    updateData
  ) {
    if (error) {
      console.log("Error updating skills and projects", error);
      res.status(500).json({
        error: error,
      });
    }
    else {
      if (isFirstPractice) {
        const queryAddNewLineChartData = "INSERT INTO linechart (dateFirstPractised, day, lastGap0, lastGap1, skillId) VALUES (NOW(), 0, ?, ?,?);";
        connection.query(queryAddNewLineChartData, [linechartItem.lastGap0, linechartItem.lastGap1, skillIdValue], function (error, data) {
          if (error) {
            console.log("Error posting linechart data for new skill practise", error);
            res.status(500).json({
              error: error,
            });
          }
          else {
            res.status(200).json({
              practisedSkill
            });
          }
        });
      }
      else {
        connection.query("SELECT dateFirstPractised FROM linechart WHERE skillId = ?;", [skillIdValue], function (error, dateFirstPractisedData) {
          if (error) {
            console.log("Error selecting date first practised", error);
            res.status(500).json({
              error: error,
            });
          }
          else {
            const dateFirstPractised = moment(dateFirstPractisedData[0].dateFirstPractised).format("YYYY-MM-DD");
            const days = moment().diff(moment(dateFirstPractised), "days");
            const queryAddLineChartData = "INSERT INTO linechart (dateFirstPractised, day, lastGap0, lastGap1, skillId) VALUES (?, ?, ?, ?,?);";
            connection.query(queryAddLineChartData, [dateFirstPractised, days, linechartItem.lastGap0, linechartItem.lastGap1, skillIdValue], function (error, data) {
              if (error) {
                console.log("Error posting linechart data for repeated skill practise", error);
                res.status(500).json({
                  error: error,
                });
              }
              else {
                res.status(200).json({
                  practisedSkill
                });
              }
            });
          }
        });
      }
    }
  });
});

app.put("/skills/:skillId", function (req, res) {
  connection.query(
    "UPDATE skills SET name = ? WHERE skillId = ?;",
    [req.body.name, req.params.skillId],
    function (error, data) {
      if (error) {
        console.log("Error updating skill", error);
        res.status(500).json({
          error,
        });
      } else {
        res.sendStatus(200);
      }
    }
  );
});

app.get("/skills/schedule/:projectId/:datePractised", function (req,res) {
  const projectIdValue = req.params.projectId;
  const datePractisedValue = req.params.datePractised;
  const endDateValue = req.query.endDate;
  connection.query("SELECT * FROM skills WHERE projectId = ?", [projectIdValue], function (error, skillData) {
    if (error) {
      console.log("Error getting skills", error);
      res.status(500).json({
        error
      });
    }
    else {
      const schedule = produceSchedule(moment(),endDateValue,datePractisedValue,skillData);
      res.status(200).json({
        schedule
      });
    }
  });
});

// Update new user/s
app.post("/users", function (req, res) {
  // get user data,
  const user = req.body;
  const query = "INSERT INTO users (name, userId) VALUES (?,?)";
  connection.query(query, [user.name, user.userId], (error, data) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.status(201).send("New user added");
    }
  });
});

// LINECHART

app.get("/linechart", function (req, res) {
  const userId = req.query.userId;
  const queryGetLinechartData = "SELECT dateFirstPractised, day, linechart.lastGap0, linechart.lastGap1, linechart.skillId, projects.name projectName, skills.name skillName FROM linechart INNER JOIN skills ON skills.skillId = linechart.skillId INNER JOIN projects ON projects.projectId = skills.projectId WHERE userId = ?;";
  connection.query(queryGetLinechartData, [userId], function (error, data) {
    if (error) {
      res.status(500).json({
        error,
      });
    }
    else {
      const formattedData = produceLineChartData(data);
      res.status(200).json({
        linechartData: formattedData,
      })
    }
  })
})


module.exports.projects = serverless(app);
module.exports.skills = serverless(app);
module.exports.users = serverless(app);
module.exports.linechart = serverless(app);
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

module.exports.projects = serverless(app);
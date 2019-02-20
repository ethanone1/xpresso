const express = require("express");
const employeesRouter = express.Router();

const sqlite3 = require("sqlite3");
// const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const db = new sqlite3.Database("./database.sqlite");

const bodyParser = require("body-parser");
employeesRouter.use(bodyParser.json());

employeesRouter.param("employeeId", (req, res, next, employeeId) => {
  const qs = `SELECT * FROM Employee WHERE id = ${employeeId}`;
  db.get(qs, (error, row) => {
    if (error) {
      next(error);
    } else if (row) {
      req.employee = row;
      req.employeeId = employeeId;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// Reroute timesheet requests
const timesheetsRouter = require("./timesheets.js");
employeesRouter.use("/:employeeId/timesheets", timesheetsRouter);

employeesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE is_current_employee = 1",
    (err, rows) => {
      if (err) {
        next(err);
      } else {
        console.log(rows);
        res.status(200).json({ employees: rows });
      }
    }
  );
});

employeesRouter.get("/:employeeId", (req, res, next) => {
  res.status(200).json({ employee: req.employee });
});

const validateEmployee = (req, res, next) => {
  const inputEmployee = req.body.employee;
  if (!inputEmployee.name || !inputEmployee.position || !inputEmployee.wage) {
    return res.sendStatus(400);
  }
  next();
};

employeesRouter.post("/", validateEmployee, (req, res, next) => {
  const inputEmployee = req.body.employee;
  //console.log(inputEmployee);
  db.run(
    "INSERT INTO Employee (name, position, wage) VALUES ($name, $pos, $wage)",
    {
      $name: inputEmployee.name,
      $pos: inputEmployee.position,
      $wage: inputEmployee.wage
    },
    function(err) {
      if (err) {
        next(err);
        // return res.sendStatus(500);
      } else {
        db.get(
          `Select * from Employee where id = ${this.lastID}`,
          (err, row) => {
            // if (!row) {
            //     return res.sendStatus(500);
            // }
            res.status(201).send({ employee: row });
          }
        );
      }
    }
  );
});

employeesRouter.put("/:employeeId", validateEmployee, (req, res, next) => {
  const employeeID = req.params.employeeId;
  const updateEmployee = req.body.employee;
  const qs = `UPDATE Employee SET name = '${
    updateEmployee.name
  }', position = '${updateEmployee.position}', wage = '${
    updateEmployee.wage
  }' WHERE id = ${employeeID}`;
  db.run(qs, err => {
    if (err) {
      console.log(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${employeeID}`, (err, row) => {
        if (!row) {
          return res.sendStatus(500);
        }
        res.status(200).json({ employee: row });
      });
    }
  });
});

employeesRouter.delete("/:employeeId", (req, res, next) => {
  const employeeID = req.params.employeeId;
  const qs = `UPDATE Employee SET is_current_employee = 0 WHERE id = ${employeeID}`;
  db.run(qs, err => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${employeeID}`, (err, row) => {
        if (!row) {
          return res.sendStatus(500);
        }
        res.status(200).json({ employee: row });
      });
    }
  });
});

module.exports = employeesRouter;

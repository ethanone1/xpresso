const express = require('express');
const timesheetRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
    const qs = `SELECT * FROM Timesheet WHERE id = ${timesheetId}`;
    db.get(qs, (error, row) => {
      if (error) {
        next(error);
      } else if (row) {
        req.timesheetId = timesheetId;
        next();
      } else {
        res.sendStatus(404);
      }
    });
});

timesheetRouter.get('/', (req, res, next) => {
    const qs = 'SELECT * FROM Timesheet WHERE employee_id = $employeeId';
    const values = { $employeeId: req.params.employeeId};
    db.all(qs, values, (error, rows) => {
      if (error) {
        next(error);
      } else {
        res.status(200).json({timesheets: rows});
      }
    });
});

const validateTimeSheet = (req, res, next) => {
    const inputTimesheet = req.body.timesheet;
    const employeeId = req.employeeId;
    if (!inputTimesheet.hours || !inputTimesheet.rate || !inputTimesheet.date || !employeeId) {
        return res.sendStatus(400);
    }
    next();
}

timesheetRouter.post('/', validateTimeSheet, (req, res, next) => {
    // console.log(req.body.timesheet);
    // console.log(req.employeeId);
    const inputTimesheet = req.body.timesheet;
    const employeeId = req.employeeId;
    const qs = `INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES (${inputTimesheet.hours}, ${inputTimesheet.rate}, ${inputTimesheet.date}, ${employeeId})`;

    db.run(qs, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, (err, row) => {
                res.status(201).json({timesheet: row});
            });
        }
    });
});

timesheetRouter.put('/:timesheetId', validateTimeSheet, (req, res, next) => {
    const updateTimesheet = req.body.timesheet;
    const employeeId = req.employeeId;
    const qs = `UPDATE Timesheet SET hours = ${updateTimesheet.hours}, rate = ${updateTimesheet.rate}, date = ${updateTimesheet.date}, employee_id = ${employeeId} WHERE id = ${req.timesheetId}`;

    db.run(qs, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${req.timesheetId}`, (err, row) => {
                res.status(200).json({timesheet: row});
            });
        }
    });

});

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
    const qs = `DELETE FROM Timesheet WHERE id = ${req.timesheetId}`;
    db.run(qs, (err) => {
        if (err) {
            next(err);
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = timesheetRouter;
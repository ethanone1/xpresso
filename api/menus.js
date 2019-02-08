const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const bodyParser = require('body-parser');
menusRouter.use(bodyParser.json());

menusRouter.param('menuId', (req, res, next, menuId) => {
    const qs = `SELECT * FROM Menu WHERE id = ${menuId}`;
    db.get(qs, (error, row) => {
      if (error) {
        next(error);
      } else if (row) {
        req.menu = row;
        req.menuId = menuId;
        next();
      } else {
        res.sendStatus(404);
      }
    });  
});

// Reroute Menu Item requests
const menuItemRouter = require('./menuitems.js');
menusRouter.use('/:menuId/menu-items', menuItemRouter);

menusRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Menu',
      (err, rows) => {
        if (err) {
          next(err);
        } else {
          res.status(200).json({menus: rows});
        }
      });
  });

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
});  

const validateMenu = (req, res, next) => {
    const inputMenu = req.body.menu;
    if (!inputMenu.title) {
        return res.sendStatus(400);
    }
    next();
}

menusRouter.post('/', validateMenu, (req, res, next) => {
    const inputMenu = req.body.menu;
    // console.log(inputMenu);
    db.run(`INSERT INTO Menu (title) VALUES ('${inputMenu.title}')`,
        function(err) {
            if (err){
                return res.sendStatus(500);
            }
            db.get(`Select * from Menu where id = ${this.lastID}`, (err, row) => {
                if (!row) {
                    return res.sendStatus(500);
                }
                res.status(201).send({menu: row});
            });
    });
});

menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
    const menuID = req.params.menuId;
    const updateMenu = req.body.menu;
    const qs = `UPDATE Menu SET title = '${updateMenu.title}' WHERE id = ${menuID}`;
    db.run(qs, (err) => {
        if (err){
            console.log(err)
        } else {
            db.get(`SELECT * FROM Menu WHERE id = ${menuID}`, (err, row) => {
                if (!row){
                    return res.sendStatus(500);
                }
                res.status(200).json({menu: row});
            })
        }
    });
});

menusRouter.delete('/:menuId', (req, res, next) => {
    const menuID = req.menuId;
    const checkQS = `SELECT * from MenuItem WHERE menu_id = ${menuID}`;
    const delQS = `DELETE FROM Menu WHERE id = ${menuID}`;
    db.get(checkQS, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            res.sendStatus(400);
        } else {
            db.run(delQS, (err) => {
                if (err) {
                    next(err);
                } else {
                    res.sendStatus(204);
                }
            });
        }
    });
});

module.exports = menusRouter;

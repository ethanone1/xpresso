const express = require('express');
const menuItemRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemRouter.param('menuItemId', (req, res, next, menuItemId) => {
    const qs = `SELECT * FROM MenuItem WHERE id = ${menuItemId}`;
    db.get(qs, (error, row) => {
      if (error) {
        next(error);
      } else if (row) {
        req.menuItemId = menuItemId;
        next();
      } else {
        res.sendStatus(404);
      }
    });
});

menuItemRouter.get('/', (req, res, next) => {
    const qs = 'SELECT * FROM MenuItem WHERE menu_id = $menuId';
    const values = { $menuId: req.params.menuId};
    db.all(qs, values, (error, rows) => {
      if (error) {
        next(error);
      } else {
        res.status(200).json({menuItems: rows});
      }
    });
});

const validateMenuItem = (req, res, next) => {
    const inputMenuItem = req.body.menuItem;
    const menuId = req.menuId;
    if (!inputMenuItem.name || !inputMenuItem.inventory || !inputMenuItem.price || !menuId) {
        return res.sendStatus(400);
    }
    next();
}

menuItemRouter.post('/', validateMenuItem, (req, res, next) => {
    // console.log(req.body.menuItem);
    // console.log(req.menuId);
    const inputMenuItem = req.body.menuItem;
    const menuId = req.menuId;
    const qs = `INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ('${inputMenuItem.name}', '${inputMenuItem.description}', ${inputMenuItem.inventory}, ${inputMenuItem.price}, ${menuId})`;

    db.run(qs, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (err, row) => {
                res.status(201).json({menuItem: row});
            });
        }
    });
});

menuItemRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
    const updateMenuItem = req.body.menuItem;
    const menuId = req.menuId;
    const qs = `UPDATE MenuItem SET name = '${updateMenuItem.name}', description = '${updateMenuItem.description}', inventory = ${updateMenuItem.inventory}, price = ${updateMenuItem.price}, menu_id = ${menuId} WHERE id = ${req.menuItemId}`;

    db.run(qs, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${req.menuItemId}`, (err, row) => {
                res.status(200).json({menuItem: row});
            });
        }
    });

});

menuItemRouter.delete('/:menuItemId', (req, res, next) => {
    const qs = `DELETE FROM MenuItem WHERE id = ${req.menuItemId}`;
    db.run(qs, (err) => {
        if (err) {
            next(err);
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = menuItemRouter;
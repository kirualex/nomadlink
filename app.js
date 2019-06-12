"use strict";

/**
 * Module dependencies.
 */
const app = require('./config');
app.locals.moment = require('moment');
const dotenv = require('dotenv').config();

function render404(req, res) {
      res.status(404);
      res.render('404');
}

app.locals.moment = require('moment');

app.listen(process.env.PORT, () => {
    process.stdout.write(`Point your browser to: http://localhost:${process.env.PORT}\n`);
});

/*
 * -------------- Routes --------------
 */

const MAX_MONTH = 12;
var nomadController = require('./nomadController');
var api = new nomadController();

// Route for the homepage
app.route('/').get(function(req, res) {
    var today = new Date();
    var monthValue =  today.getMonth()+"-"+today.getFullYear()
    res.redirect('/month/' + monthValue);
});

// Route that catches any other url and renders the 404 page
app.route('/month/:month').get(function(req, res) {

    var today = new Date();

    var dateArr = req.params.month.split("-"); 
    var selectedDate = new Date(dateArr[1], dateArr[0], 1);

    var months = [];
    for (var i=0; i<MAX_MONTH; i++) {
        let month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        var selected = (selectedDate.getFullYear() == month.getFullYear()) && (selectedDate.getMonth() == month.getMonth())
        months.push({"month" : month, "selected" : selected});
    }

    api.getReservations(selectedDate, function(data) {
        res.render('home', {"data" : data, "months":months});
    });
});

// Route that catches any other url and renders the 404 page
app.route('/:url').get(function(req, res) {
    render404(req, res);
});


"use strict";

/**
 * Module dependencies.
 */
const app = require('./config');
const PORT = app.get('port');

function render404(req, res) {
  res.status(404);
  res.render('404');
}

app.listen(PORT, () => {
  process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`);
});

/*
 * -------------- Routes --------------
 */

// Route for the homepage
app.route('/').get(function(req, res) {
  res.render('home', {});
});

// Route that catches any other url and renders the 404 page
app.route('/:url').get(function(req, res) {
  render404(req, res);
});


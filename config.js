/**
 * Module dependencies.
 */
var express = require('express'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  errorHandler = require('errorhandler'),
  path = require('path'),
  lessMiddleware = require('less-middleware'),
  minify = require('express-minify');
  
module.exports = function() {
  var app = express();

  // all environments
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  app.use(logger('dev'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(errorHandler());
  
  app.use(lessMiddleware(__dirname + '/public', {force: true, compress: true, optimization: 2}));
  app.use(minify());
  app.use(express.static(__dirname + '/public'));

  return app;
}();

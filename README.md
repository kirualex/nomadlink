## Nomadlink

Source for Happy Hours [Nomadlink](nomadlink.herokuapp.com) interface

#### Getting started

```
$ npm install
$ npm install -g nodemon
$ nodemon
```

#### Deployment on Heroku

An easy way to deploy your Node.js website is to use [Heroku](http://www.heroku.com). Just follow these few simple steps once you have successfully [signed up](https://id.heroku.com/signup/www-header) and [installed the Heroku toolbelt](https://toolbelt.heroku.com/):

Commit your code to the Git repository and deploy it to Heroku:

```
$ git add .
$ git commit -am "make it better"
$ git push heroku master
```

Ensure you have at least one node running:

```
$ heroku ps:scale web=1
```

You can now browse your application online:

```
$ heroku open
```
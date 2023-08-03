"use strict";

/**
 * Module dependencies.
 */
const express = require('express'); // Add this line
const bodyParser = require('body-parser');


const app = require('./config');
const PORT = process.env.PORT || 3000;

const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '204812694051-91bud7uc0p6a450g7tllqj1hnk9iru0q.apps.googleusercontent.com';
const CLIENT_SECRET = 'loIU7lsNAsxRP6-ABcEYK0GH';
const REDIRECT_URI = 'https://nomadlink.onrender.com/auth/callback';
const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.locals.moment = require('moment');
const dotenv = require('dotenv').config();

function render404(req, res) {
    res.status(404);
    res.render('404');
}

app.locals.moment = require('moment');
app.use(express.urlencoded({ extended: true }));
app.listen(PORT, () => {
    process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`);
});

const MAX_MONTH = 12;
var nomadController = require('./nomadController');
var api = new nomadController();

/*
 * -------------- Routes --------------
 */

// Route for the homepage
app.route('/').get(function (req, res) {
    var today = new Date();
    var monthValue = today.getMonth() + "-" + today.getFullYear();
    res.redirect('/month/' + monthValue);
});

app.post('/add-reservation', (req, res) => {
    const name = req.body.name;
    const date = req.body.date;

    console.log('Received name:', name);
    console.log('Received date:', date);

    // Check if the user is authenticated
    if (!oAuth2Client.credentials || !oAuth2Client.credentials.access_token) {
        // User is not authenticated, redirect to the authentication page
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.events'],
            state: JSON.stringify({ name, date }), // Pass reservation data as state
        });
        return res.redirect(authUrl);
    }

    api.addReservation(oAuth2Client.credentials, name, date, (error) => {
        if (error) {
            res.status(500).send('Error adding reservation.');
        } else {
            res.redirect('/'); // Redirect to the homepage after adding reservation
        }
    });
});

// Route that catches any other url and renders the 404 page
app.route('/month/:month').get(function (req, res) {
    var today = new Date();
    var dateArr = req.params.month.split("-");
    var selectedDate = new Date(dateArr[1], dateArr[0], 1);

    var months = [];
    for (var i = -1; i < MAX_MONTH; i++) {
        let month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        var selected = (selectedDate.getFullYear() == month.getFullYear()) && (selectedDate.getMonth() == month.getMonth());
        months.push({ "month": month, "selected": selected });
    }

    api.getReservations(selectedDate, function (data) {
        res.render('home', { "data": data, "months": months });
    });

});

// Route that catches any other url and renders the 404 page
app.route('/:url').get(function (req, res) {
    render404(req, res);
});

// Auth

app.get('/auth', (req, res) => {
    // Construct the authorization URL with required parameters
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // Access type set to offline to obtain refresh token
        scope: ['https://www.googleapis.com/auth/calendar.events'], // Request access to calendar events
        state: JSON.stringify({ name, date }),
    });

    // Redirect the user to the authorization URL
    res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;

    try {
        // Exchange the authorization code for an access token
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Retrieve the reservation data from the state parameter
        const state = JSON.parse(req.query.state);
        const name = state.name;
        const date = state.date;

        // Use the access token to add the reservation
        api.addReservation(tokens, name, date, (error) => {
            if (error) {
                res.status(500).send('Error adding reservation.');
            } else {
                res.redirect('/'); // Redirect to the homepage after adding reservation
            }
        });
    } catch (error) {
        console.error('Error retrieving access token:', error);
        res.status(500).send('Error retrieving access token');
    }
});


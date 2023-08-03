const { google } = require("googleapis");
const { OAuth2Client } = require('google-auth-library');
const moment = require("moment-timezone");
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

const cal_id = process.env.CALENDAR_ID;
const api_key = process.env.API_KEY;

const CLIENT_ID = '204812694051-91bud7uc0p6a450g7tllqj1hnk9iru0q.apps.googleusercontent.com';
const CLIENT_SECRET = 'loIU7lsNAsxRP6-ABcEYK0GH';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Google Calendar API with the API key directly
const calendar = google.calendar({
  version: "v3",
  auth: api_key,
});

module.exports = function () {
    
    const calendar = google.calendar({
        version: "v3",
        auth: api_key, // Use the API key directly
    });

    function getNumberOfDaysOfItem(firstDay, lastDay, item) {
        var start = getStartDateOfItem(item);
        start = start > firstDay ? start : firstDay;
        var end = getEndDateOfItem(item);
        end = end < lastDay ? end : lastDay;
        let diff = Math.floor((Date.parse(start) - Date.parse(end)) / 86400000);
        return Math.abs(diff);
    }

    function getStartDateOfItem(item) {
        var start = item.start || item.originalStartTime;
        var date = start.date || start.dateTime;
        var start = new Date(date);
        return moment(start).utc();
    }

    function getEndDateOfItem(item) {
        var end = item.end;
        var date = end.date || end.dateTime;
        var end = new Date(date);
        return moment(end).utc();
    }

    this.addReservation = function (credentials, name, date, callback) {

        const startDateTime = moment(date).startOf('day');
        const endDateTime = moment(date).startOf('day').add(1, 'days');
        const startFormatted = startDateTime.format('YYYY-MM-DD');
        const endFormatted = endDateTime.format('YYYY-MM-DD');
        
        const authClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        authClient.setCredentials(credentials);

        const event = {
            'summary': name,
            'location': "Happy Hours, 2 rue Victor Hugo, 35000 RENNES",
            'description': "Réservation de " + name,
            'start': {
                'date': startFormatted,
                'timeZone': 'Europe/Paris', // Paris timezone
            },
            'end': {
                'date': endFormatted,
                'timeZone': 'Europe/Paris', // Paris timezone
            },
            'transparency': 'transparent',
        };

        console.log(event)
        
        calendar.events.insert(
            {
            version: "v3",
            auth: authClient,
            calendarId: cal_id,
            resource: event,
            },
            function (err, event) {
            if (err) {
                console.log("There was an error contacting the Calendar service: " + err);
                callback(err);
                return;
            }
            console.log("Event created: %s", event.data.htmlLink);
            callback(null);
            }
        );
    };
      

  this.getReservations = function (month, callback) {
    moment.locale("fr");

    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayFormatted = `${nextDay.getFullYear()}-${(nextDay.getMonth() + 1).toString().padStart(2, '0')}-${nextDay.getDate().toString().padStart(2, '0')}`;

    var nomadsArray = [];
    var firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    var lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    var timeMin = moment(firstDay).utc().toISOString();
    var timeMax = moment(lastDay).utc().toISOString();

    console.log(firstDay);
    console.log(lastDay);
    console.log(timeMin);
    console.log(timeMax);

    calendar.events.list(
      {
        calendarId: cal_id,
        orderBy: "updated",
        showDeleted: false,
        singleEvents: true,
        timeMin: timeMin,
        timeMax: timeMax,
      },
      (err, response) => {
        if (err) {
          callback({ error: err.message });
          return;
        }

        var sortedItems = response.data.items.sort(function (a, b) {
          var eventA = getStartDateOfItem(a);
          var eventB = getStartDateOfItem(b);
          return eventB - eventA;
        });

        console.log(sortedItems);

        var count = 0;
        for (let index in sortedItems) {
          let item = sortedItems[index];

          // Only consider items with 'confirmed' status
          if (item.status !== "confirmed" && item.status !== "tentative") continue;

          // Allow reservations spanning multiple days
          var nbDays = getNumberOfDaysOfItem(firstDay, lastDay, item);

          // Reverse addition of multiple-day reservations
          for (let i = nbDays - 1; i >= 0; i--) {
            var reservation = getStartDateOfItem(item);
            reservation.add(i, "d");
            // Handle undefined summary
            if (item.summary == undefined) {
              break;
            }

            // Populate nomadsDict
            // Remove mention of chosen desk via split
            var name = item.summary.split(" (")[0];
            var found = nomadsArray.find(function (nomad) {
              if (nomad.name == name) {
                nomad.reservations.push(reservation);
                return true;
              }
              return false;
            });

            if (!found) {
              var nomad = { name: name, reservations: [reservation] };
              nomadsArray.push(nomad);
            }
            count++;
          }
        }

        // Formating
        var finalArray = [];
        nomadsArray.forEach((nomad) => {
          var dates = nomad.reservations
            .reverse()
            .map(function (date) {
              return moment(date).utc().format("dddd Do").capitalize();
            });
          finalArray.push({
            name: nomad.name,
            reservations: dates.join(", "),
            count: nomad.reservations.length,
          });
        });

        finalArray = finalArray.sort(function (a, b) {
          return b.count - a.count;
        });

        var finalData = {nextDayFormatted:nextDayFormatted, nbDays: count, nomads: finalArray };

        callback(finalData);
      }
    );
  };
};


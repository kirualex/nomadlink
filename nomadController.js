const request = require("request");
const moment = require('moment');

const cal_id = process.env.CALENDAR_ID;
const api_key = process.env.API_KEY;

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = function () {

    function getNumberOfDaysOfItem(firstDay, lastDay, item) {
        var start = getStartDateOfItem(item);
        start = start > firstDay ? start : firstDay;
        var end = getEndDateOfItem(item);
        end = end < lastDay ? end : lastDay;
        let diff =  Math.floor(( Date.parse(start) - Date.parse(end) ) / 86400000);
        return Math.abs(diff);
    }

    function getStartDateOfItem(item) {
        var start =  item.start || item.originalStartTime;
        var date =  start.date || start.dateTime;
        return new Date(date);
    }

    function getEndDateOfItem(item) {
        var end =  item.end;
        var date =  end.date || end.dateTime;
        return new Date(date);
    }

    this.getStatistics = function(month, callback){   
        var fromDate = moment(month);
        var labels = [];
        var data = [];
        var nbMonths = 12;
        for (var i=0; i<nbMonths; i++) {
            var prevMoment = fromDate.subtract(1, 'months')
            var month = prevMoment.toDate()
            this.getReservations(month, function(reservations) {
                labels.push(month);
                data.push(reservations["nbDays"]);
                if (data.length == 12) {
                    callback({"labels": labels, "data": data})
                }
            });
        }      
    }

    this.getReservations = function(month, callback){        

        moment.locale('fr');

        var nomadsArray = new Array();
        var firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
        var lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 1);
        var timeMin = encodeURIComponent(firstDay.toISOString())
        var timeMax = encodeURIComponent(lastDay.toISOString())

        const url = "https://www.googleapis.com/calendar/v3/calendars/" + cal_id 
        + "/events?orderBy=updated&key=" + api_key
        + "&showDeleted=" + false
        + "&singleEvents=" + true
        + "&timeMin="+timeMin
        + "&timeMax="+timeMax;

        request.get(url, (error, response, body) => {
            var data = JSON.parse(body);

            var sortedItems = data.items.sort(function(a, b) {
                var eventA = getStartDateOfItem(a);
                var eventB = getStartDateOfItem(b);
                return eventB.getDate() - eventA.getDate();
            })

            var count = 0;
            for (index in sortedItems) {
                let item = data.items[index];

                // Only consider items with 'confirmed' status
                if (item.status != 'confirmed' && item.status != 'tentative') continue;

                // Allow reservations spanning multiple days
                var nbDays = getNumberOfDaysOfItem(firstDay, lastDay, item);

                // Reverse addition of multiple-day reservations
                for (var i=nbDays-1; i>=0; i--) {
                    var reservation = getStartDateOfItem(item);
                    reservation.setDate(reservation.getDate() + i);

                    // Handle undefined summary
                    if (item.summary == undefined) {
                        break;
                    }

                    // Populate nomadsDict
                    // Remove mention of chosen desk via split
                    var name = item.summary.split(' (')[0];
                    var found = nomadsArray.find(function(nomad) {
                        if(nomad.name == name) {
                           nomad.reservations.push(reservation);
                           return true;
                       }
                       return false;
                   });

                    if (!found){
                        var nomad = {"name" : name, "reservations": [reservation]};
                        nomadsArray.push(nomad);
                    }
                    count ++;
                }
            }

            // Formating
            var finalArray = [];
            nomadsArray.forEach( (nomad) => {
                var dates = nomad.reservations.reverse().map(function(date) {
                    return moment(date).format("dddd Do").capitalize();
                });
                finalArray.push({"name" : nomad.name, "reservations" : dates.join(", "), "count" : nomad.reservations.length})
            });

            finalArray = finalArray.sort(function(a, b) {
                return b.count - a.count;
            });

            var finalData = {"nbDays" : count,
            "nomads": finalArray}

            callback(finalData);
        });
    }
}
const request = require("request");

const cal_id = "dg601thskc03amhtlmr8lb541k@group.calendar.google.com";
const api_key = "AIzaSyCg0rx4GDvIYWPNU7QdRtMwXQpAumSR8hg";

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = function () {

    function getDateOfItem(item) {
        var start =  item.start || item.originalStartTime;
        var date =  start.date || start.dateTime;
        return new Date(date);
    }

    this.getReservations = function(month, callback){        

        var nomadsArray = new Array();

        var firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
        var lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        var timeMin = encodeURIComponent(firstDay.toISOString())
        var timeMax = encodeURIComponent(lastDay.toISOString())

        const url = "https://www.googleapis.com/calendar/v3/calendars/" + cal_id 
        + "/events?orderBy=updated&key=" + api_key
        + "&timeMin="+timeMin
        + "&timeMax="+timeMax;

        request.get(url, (error, response, body) => {
            var data = JSON.parse(body);

            var sortedItems = data.items.sort(function(a, b) {
                var eventA = getDateOfItem(a);
                var eventB = getDateOfItem(b);
                return eventB.getDate() - eventA.getDate();
            })

            var count = 0;
            for (index in sortedItems) {
                let item = data.items[index];

                // Only consider items with 'confirmed' status
                if (item.status != 'confirmed') continue;

                var reservation = getDateOfItem(item);

                if (reservation < firstDay) continue;

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

            // Formating
            var finalArray = [];
            nomadsArray.forEach( (nomad) => {
                var dates = nomad.reservations.reverse().map(function(date) {
                    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' }).capitalize();
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
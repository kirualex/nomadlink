// On document load
$( document ).ready(function() {

    // Const
    const MAX_MONTH = 6;

    // API
    var cal_id = "dg601thskc03amhtlmr8lb541k@group.calendar.google.com";
    var api_key = "AIzaSyCg0rx4GDvIYWPNU7QdRtMwXQpAumSR8hg";

    // Logic
    var today = new Date();
    var table = $("table#reservations");
    var monthSelector = $("select#month");
    var countLabel = $("#count");
    var months = [];

    for (var i=0; i<MAX_MONTH; i++) {
        let month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(month);
        var dateOptions = { year: 'numeric', month: 'long' };
        var option = month.toLocaleDateString('fr-FR', dateOptions);
        monthSelector.append($('<option>', {value:i, text:option}));
    }

    // Changed month selection
    monthSelector.change(function(){
        var index = monthSelector.val();
        var month = months[index];
        console.log(month);
        getReservationsFor(month);
    });

    function getDateOfItem(item) {
        var start =  item.start || item.originalStartTime;
        var date =  start.date || start.dateTime;
        return new Date(date);
    }

    function getReservationsFor(month) {

        var nomadsArray = new Array();
        countLabel.text('Loading...');
        table.empty();

        var firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
        var lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        var timeMin = encodeURIComponent(firstDay.toISOString())
        var timeMax = encodeURIComponent(lastDay.toISOString())

        $.ajax({
        url:"https://www.googleapis.com/calendar/v3/calendars/" + cal_id + "/events?orderBy=updated&key=" + api_key+ "&timeMin="+timeMin+"&timeMax="+timeMax,
        success: function(data) {

            var sortedItems = data.items.sort(function(a, b) {
                var eventA = getDateOfItem(a);
                var eventB = getDateOfItem(b);
                return eventA.getDate() < eventB.getDate();
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

            var dateOptions = { weekday: 'long', day: 'numeric' };
            var nomadCount = 0;

            console.log(nomadsArray);
            nomadsArray = nomadsArray.sort((a, b) => a.reservations.length < b.reservations.length);
            nomadsArray.forEach( (nomad) => {

                table.append("<tr><td class='nomad'>"+nomad.name+"</td><td>"+ nomad.reservations.length +"</td></tr>");
                var dates = nomad.reservations.reverse().map(function(date) {
                    return date.toLocaleDateString('fr-FR', dateOptions);
                });
                table.append("<tr><td colspan='2'>"+dates.join(", ")+"</td></tr>");
                nomadCount ++;
            });

            countLabel.text(nomadCount + " nomades ont réservé un total de " + count + " jours");
            }
        });
    }

    getReservationsFor(today);
    
});
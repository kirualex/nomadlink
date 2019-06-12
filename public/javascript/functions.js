// On document load
$( document ).ready(function() {

    var monthSelector = $("select#month");
    var table = $("table#reservations");
    var countLabel = $("#count");

    // Changed month selection
    monthSelector.change(function(){
        table.empty();
        countLabel.text("Loading...");
        window.location.href = "/month/" + monthSelector.val();
    });
});
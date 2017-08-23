function convertRideTime(ride_time) {
    console.log("===============ride_timeride_timeride_timeride_timeride_timeride_timeride_timeride_timeride_timeride_timeride_timeride_timeride_timeride_time");

    var totalSec = parseInt(ride_time * 60);


    var hours = parseInt(totalSec / 3600) % 24;
    var minutes = parseInt(totalSec / 60) % 60;
    var seconds = totalSec % 60;

    var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);

    console.log(result);
    return result;


}
exports.convertRideTime =convertRideTime;

convertTimeIntoLocal = function(date, timezone) {

    console.log(date, timezone)
    console.log("date, timezone")

    if (timezone == undefined || date == '0000-00-00 00:00:00') {
        return "N/A";
    } else {
        var newDate = new Date(date);

        var millies = timezone * 1000;
        if (timezone < 0) {
            newDate.setTime(newDate.getTime() - millies)
        } else {
            newDate.setTime(newDate.getTime() + millies)
        }

        return newDate;
    }
}
exports.convertTimeIntoLocal = convertTimeIntoLocal;


function getDate(date) {
    if (date == "0000-00-00 00:00:00") {
        return 'N.A.';
    }

    var dtOb = new DateObject(date);


    return dtOb;
}
exports.getDate =getDate;



function DateObject(date) {

    this.date = new Date(date);

    this.dateString = this.date.toString();
    this.dateStringArr = this.dateString.split(" ");
    this.hour = appendZero(this.date.getHours() % 12);
    this.hour = this.hour == '00' ? '12' : this.hour;
    this.second = appendZero(this.date.getSeconds());
    this.minute = appendZero(this.date.getMinutes());
    this.amPm = this.date.getHours() > 12 ? 'PM' : 'AM';
    this.dayName = this.dateStringArr[0];
    this.monthName = this.dateStringArr[1];
    this.headerDate = this.date.getDate() + " " + this.monthName + "," + this.date.getFullYear();

    this.time = this.hour + ":" + this.minute + " " + this.amPm;

    this.date = this.date.getDate() + "/" + this.date.getMonth() + "/" + this.date.getFullYear();

    console.log(this);


}
exports.DateObject =DateObject;

function appendZero(num) {
    return num < 10 ? '0' + num : num;

}

exports.appendZero = appendZero;
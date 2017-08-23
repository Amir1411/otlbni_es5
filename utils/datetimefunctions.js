/**
 *
 * @param date1
 * @param date2
 * @returns {Number}
 */


//var timeZoneOffset = -4.5;
var timeZoneOffset = 5.5;
exports.timeDifferenceInDays = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/86400000);
};

/**
 *
 * @param date1
 * @param date2
 * @returns {Number}
 */

exports.timeDifferenceInHours = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/3600000);
};


/**
 *
 * @param date1
 * @param date2
 * @returns {Number}
 */

exports.timeDifferenceInMinutes = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/60000);
};

/**
 *
 * @param date1
 * @param date2
 * @returns {Number}
 */
exports.timeDifferenceInSeconds = function(date1, date2){
    var t1 = new Date(date1);
    var t2 = new Date(date2);
    return parseInt((t2-t1)/1000);
};

/**
 *
 * @param date
 * @returns {string}
 */
exports.changeTimezoneFromIstToUtc = function(date){
    var temp = new Date(date);
    return new Date(temp.getTime() - (3600000 * timeZoneOffset)).toISOString();
};

/**
 *
 * @param date
 * @returns {string}
 */
exports.changeTimezoneFromUtcToIst = function(date){
    var temp = new Date(date);
    return new Date(temp.getTime() + (3600000 * timeZoneOffset)).toISOString();
};

/**
 *
 * @param jsDate
 * @returns {string}
 */
exports.getMysqlStyleDateString = function(jsDate){
    var year = jsDate.getFullYear().toString();
    var month = (jsDate.getMonth() + 1).toString();
    month = month.length == 1 ? '0' + month : month;
    var date = jsDate.getDate().toString();
    date = date.length == 1 ? '0' + date : date;
    return year + '-' + month + '-' + date;
}

/**
 *
 * @param time
 * @param flag
 * @returns {number}
 */
exports.getTimeDifferenceInMinutes = function(time, flag)
{
    var today = new Date();

    if (flag == 1){
        var diffMs = (time - today); // milliseconds between post date & now
    }
    else{
        var diffMs = (today - time); // milliseconds between now & post date
    }

    var minutes = Math.floor(0.000016667 * diffMs);

    return minutes;
}
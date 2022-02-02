const { DateTime } = require('luxon');

exports.clean = function (date) {
    const matches = /\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/.exec(date);
    if (matches && matches.length > 0 && matches[0] === date) {
        const dateParsed = DateTime.fromISO(date);
        if (dateParsed.invalid) {
            return date;
        }
        return dateParsed.toLocaleString(DateTime.DATE_HUGE);
    }
    return date;
}
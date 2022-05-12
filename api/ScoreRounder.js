exports.round = function (score, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(score * multiplier) / multiplier;
};

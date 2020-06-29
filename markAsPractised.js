const moment = require('moment');

function markAsPractised(skill,today) {
    const updatedSkill = Object.assign({},skill);
    if (!updatedSkill.started) {
        updatedSkill.lastGap0 = 0;
        updatedSkill.lastGap1 = 1;
        updatedSkill.started = 1;
    }
    let nextGap = updatedSkill.lastGap0 + updatedSkill.lastGap1;
    updatedSkill.nextDate = moment(today).add(nextGap, "days").format("YYYY-MM-DD");
    updatedSkill.lastGap0 = updatedSkill.lastGap1;
    updatedSkill.lastGap1 = nextGap;
    return updatedSkill;
}

module.exports = {
    markAsPractised
};
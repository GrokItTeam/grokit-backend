const moment = require('moment');

function markAsPractised(skill,today) {
    const updatedSkill = Object.assign({},skill);
    let nextGap = updatedSkill.lastGap0 + updatedSkill.lastGap1;
    updatedSkill.nextDate = moment(today).add(nextGap, "days");
    updatedSkill.lastGap0 = updatedSkill.lastGap1;
    updatedSkill.lastGap1 = nextGap;
    return updatedSkill;
}

module.exports = {
    markAsPractised
};
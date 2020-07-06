const moment = require('moment');

function markAsPractised(skill,today,difficulty) {
    const updatedSkill = Object.assign({},skill);
    if (!updatedSkill.started) {
        updatedSkill.lastGap0 = 0;
        updatedSkill.lastGap1 = 1;
        updatedSkill.started = 1;
    }

    switch(difficulty) {
        case "easy":
            loops = 2;
            break;
        case "medium":
            loops = 1;
            break;
        case "hard":
            loops = 0;
    }

    for (let i = 0; i<loops; i++) {
        nextGap = updatedSkill.lastGap0 + updatedSkill.lastGap1;
        updatedSkill.lastGap0 = updatedSkill.lastGap1;
        updatedSkill.lastGap1 = nextGap;
    }
    updatedSkill.nextDate = moment(today).add(updatedSkill.lastGap1, "days").format("YYYY-MM-DD");
    
    return updatedSkill;
}

module.exports = {
    markAsPractised
};
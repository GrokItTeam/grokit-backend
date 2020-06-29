const moment = require('moment');

function skillChooser(skills, today) {
    // find skills that need to be practiced
    let todaySkills = skills.filter(skill => moment(skill.nextDate).isBefore(today));
    // if there are none, start a new skill
    if (todaySkills.length === 0) {
        startNewSkill = skills.find(skill => !skill.started);
        // if there are no practices at all
        if (!startNewSkill) { return }
        else return startNewSkill;
    }
    return lowestGap(todaySkills);
}

function lowestGap(skillArray) {
    if (skillArray) return skillArray.reduce((bestSkill, skill) => {
        if (bestSkill.lastGap0 + bestSkill.lastGap1 > skill.lastGap0 + skill.lastGap1) { return skill }
        else return bestSkill
    }, { lastGap0: Infinity, lastGap1: Infinity });
}

module.exports = {
    skillChooser
  };
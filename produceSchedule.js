const moment = require('moment');

const { skillChooser } = require("./skillChooser");
const { markAsPractised } = require("./markAsPractised");

function produceSchedule(today,endDate,datePractised,skills) {    
    const schedule = [];
    if (moment(datePractised).isSame(moment(today), "day")) {
        schedule.push({date: moment().format("YYYY-MM-DD"), skill: "Done for today"});
        today = moment(today).add(1,"days").format("YYYY-MM-DD");
    }
    while (moment(today).isBefore(endDate)) {  
        let skillToDo = skillChooser(skills, today);
        if (skillToDo) {
            schedule.push({ date: today, skill: skillToDo.name })
            let updatedSkill = markAsPractised(skillToDo,today,"medium");
            let updatedSkills = skills.filter(skill => skill.skillId !== skillToDo.skillId);
            skills = [...updatedSkills,updatedSkill];
        }
        else schedule.push({ date: today, skill: "No skill" });
        today = moment(today).add(1, "days").format("YYYY-MM-DD");
    }
    return schedule;
}

module.exports = {
    produceSchedule
}
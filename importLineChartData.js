function produceFormattedBackendData(data) {
    return data.reduce((structure, {dateFirstPractised, day, lastGap0, lastGap1, skillId, projectName, skillName}) => {
      let projectIndex = structure.findIndex(p => p.projectName === projectName);
      let practisedData = {day: day, lastGap0: lastGap0, lastGap1: lastGap1};
      if (projectIndex === -1) {
        structure.push(
          {
            projectName,
            skills: [{skillName, skillId, dateFirstPractised, practisedData: [practisedData]}]
            }
            )}
      else {
        let skillIndex = structure[projectIndex].skills.findIndex(p => p.skillId === skillId);
        if (skillIndex === -1) {
          structure[projectIndex].skills.push({skillName, skillId, dateFirstPractised, practisedData: [practisedData]});
        }
        else {
          structure[projectIndex].skills[skillIndex].practisedData.push(practisedData);
        }
      }
      return structure;
    },[])
  };

module.exports = {
    produceFormattedBackendData
};
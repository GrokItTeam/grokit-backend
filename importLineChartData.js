function produceFormattedBackendData(rawBackendData) {
    const {dateFirstPractised} = rawBackendData[0];
    let formattedBackedData = {dateFirstPractised, data: []};
    formattedBackedData.data = rawBackendData.map(({day, lastGap0, lastGap1}) => {
        return {day, lastGap0, lastGap1}
    });
    return formattedBackedData;
};

module.exports = {
    produceFormattedBackendData
};
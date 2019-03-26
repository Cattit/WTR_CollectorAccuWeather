const getData = require("./data/AccuWeather.js");
const dal = require("wtr-dal");
// const source = "AccuWeather"
const id_source = 2
const dateNow = new Date()
dateNow.setHours(0, 0, 0, 000)

async function startDataСollection() {
  let id_forecast = await dal.saveForecast(id_source, dateNow); // сохранить ячейку
  const masLocation = await dal.getAllLocationCodeId()  // массив городов (лат, лон)
  const url_api = await dal.getUrlApi(id_source)
  for (var i = 0; i < masLocation.length; i++) {
    let code_location = masLocation[i].code_accuweather
    let id_location = masLocation[i].id
    let dataForecast = await getData.getforecast(url_api, code_location, id_source)
    await dataForecast.map(forecast => dal.saveForecastData(forecast, id_forecast, id_location));
  }
}

startDataСollection()

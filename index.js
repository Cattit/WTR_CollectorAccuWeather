let getData = require("./data/AccuWeather.js");
let dal = require("wtr-dal");

async function startDataСollection() {
  let code_location = 2515263
  const dataForecast = await getData.getforecast(code_location);
  const id_forecast = await dal.saveForecast(dataForecast[0].source, dataForecast[0].date.now);
  const id_location = await dal.getIdLocationByCode(code_location)
  await dataForecast.map(forecast => dal.saveForecastData(forecast, id_forecast, id_location));
}

startDataСollection()

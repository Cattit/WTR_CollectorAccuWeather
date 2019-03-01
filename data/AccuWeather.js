const axios = require("axios");
let dal = require("wtr-dal");
let source = "AccuWeather"
const dateNow = new Date()
dateNow.setHours(0, 0, 0, 000)

function dateDay(amount_day) {
    return {
        now: dateNow,
        date_start: new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate() + amount_day, 12),
        date_end: new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate() + amount_day, 23, 59, 59, 999),
        type_day: "day"
    }
}

function dateNight(amount_day) {
    return {
        now: dateNow,
        date_start: new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate() + amount_day, 00),
        date_end: new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate() + amount_day, 11, 59, 59, 999),
        type_day: "night"
    }
}

function rainfall(forecast_snow, forecast_rain, forecast_grad, forecast_storm, wind, temperature, amount_rainfall) {  // не возвращает инфу о яп, только о дожде, снеге, граде и снеге с дождем
    return {
        snow: (forecast_snow !== 0 && forecast_rain === 0) ? 1 : 0,
        rain: (forecast_rain !== 0 && forecast_snow === 0) ? 1 : 0,
        sand: null,
        squall: null,
        mist: null,
        storm: forecast_storm !== 0 ? 1 : 0,
        drizzle: null,
        rainsnow: (forecast_rain !== 0 && forecast_snow !== 0) ? 1 : 0,
        grad: forecast_grad !== 0 ? 1 : 0,
        hard_wind: wind >= 15 ? 1 : 0,
        hard_heat: (dateNow.getMonth() >= 3 && dateNow.getMonth() <= 8 && temperature >= 40) ? 1 : 0,
        hard_frost: ((dateNow.getMonth() >= 9 || dateNow.getMonth() <= 2) && temperature <= -35) ? 1 : 0,
        hard_rainfall: (((forecast_snow !== 0 || forecast_grad !== 0) && forecast_rain === 0 && amount_rainfall >= 7) || amount_rainfall >= 15) ? 1 : 0 // если снега не менее 7 мм или осадков не менее 15 мм
    }
}

async function analyzeData(code_location, { DailyForecasts }) {
    let dataAll = [];
    for (let dd = 1; dd < 4; dd += 2) {

        let temperature = DailyForecasts[dd].Temperature.Maximum.Value,
            wind_speed_from = DailyForecasts[dd].Day.Wind.Speed.Value * 10 / 36,    //перевод в м/с
            wind_speed_to = DailyForecasts[dd].Day.Wind.Speed.Value * 10 / 36,
            wind_gust = DailyForecasts[dd].Day.WindGust.Speed.Value * 10 / 36,
            amount_rainfall = DailyForecasts[dd].Day.Rain.Value + DailyForecasts[dd].Day.Ice.Value + 10 * DailyForecasts[dd].Day.Snow.Value // переводим снег в мм

        dataAll.push(
            {
                code_location: code_location,
                source,
                depth_forecast: dd,
                date: dateDay(dd),
                temperature: temperature,
                wind_speed: {
                    from: wind_speed_from,
                    to: wind_speed_to
                },
                wind_gust: wind_gust,
                amount_rainfall: amount_rainfall,
                rainfall: rainfall(DailyForecasts[dd].Day.Snow.Value, DailyForecasts[dd].Day.Rain.Value, DailyForecasts[dd].Day.Ice.Value, DailyForecasts[dd].Day.ThunderstormProbability, Math.max(wind_speed_from, wind_speed_to, wind_gust), temperature, amount_rainfall),
            })

        temperature = DailyForecasts[dd].Temperature.Minimum.Value
        wind_speed_from = DailyForecasts[dd].Night.Wind.Speed.Value * 10 / 36
        wind_speed_to = DailyForecasts[dd].Night.Wind.Speed.Value * 10 / 36
        wind_gust = DailyForecasts[dd].Night.WindGust.Speed.Value * 10 / 36
        amount_rainfall = DailyForecasts[dd].Night.Rain.Value + DailyForecasts[dd].Night.Ice.Value + 10 * DailyForecasts[dd].Night.Snow.Value

        dataAll.push(
            {
                code_location: code_location,
                source,
                depth_forecast: dd,
                date: dateNight(dd),
                temperature: temperature,
                wind_speed: {
                    from: wind_speed_from,
                    to: wind_speed_to
                },
                wind_gust: wind_gust,
                amount_rainfall: amount_rainfall,
                rainfall: rainfall(DailyForecasts[dd].Night.Snow.Value, DailyForecasts[dd].Night.Rain.Value, DailyForecasts[dd].Night.Ice.Value, DailyForecasts[dd].Night.ThunderstormProbability, Math.max(wind_speed_from, wind_speed_to, wind_gust), temperature, amount_rainfall),
            })

    }

    // console.log(dataAll)
    return dataAll
}

function getforecast(code_location) {
    return axios({
        method: "get",
        url: "http://dataservice.accuweather.com/forecasts/v1/daily/5day/" + code_location,
        params: {
            apikey: "q3xTmbHKf0OEbYLAtvAPvhXurloxQroN",
            details: true,
            metric: true
        }
    })
        .then(res => {
            // console.log(res.data);
            return analyzeData(code_location, res.data);
        })
        .catch(err => console.log(err));
}

module.exports.getforecast = getforecast;
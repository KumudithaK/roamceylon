import assert from "node:assert/strict";
import test from "node:test";
import {describeWeatherSymbol,parseMetForecast} from "../lib/weather/met-norway.ts";

const entry=(time:string,temperature:number,symbol:string,rain:number,humidity=72,wind=3)=>({time,data:{instant:{details:{air_temperature:temperature,relative_humidity:humidity,wind_speed:wind}},next_1_hours:{summary:{symbol_code:symbol},details:{probability_of_precipitation:rain}}}});

test("MET forecast is grouped into traveller-friendly Sri Lanka days",()=>{
  const forecast=parseMetForecast({properties:{timeseries:[
    entry("2026-08-02T00:00:00Z",27,"partlycloudy_day",20),
    entry("2026-08-02T06:00:00Z",31,"clearsky_day",5),
    entry("2026-08-02T12:00:00Z",28,"rainshowers_day",55),
    entry("2026-08-03T06:00:00Z",30,"rain_day",70)
  ]}},new Date("2026-08-02T01:00:00Z"));
  assert(forecast);
  assert.equal(forecast.temperature,27);
  assert.equal(forecast.windSpeed,11);
  assert.equal(forecast.days[0]?.label,"Today");
  assert.equal(forecast.days[0]?.minimum,27);
  assert.equal(forecast.days[0]?.maximum,31);
  assert.equal(forecast.days[0]?.precipitationProbability,55);
  assert.equal(forecast.days[1]?.label,"Tomorrow");
});

test("weather symbols are translated without exposing provider codes",()=>{
  assert.equal(describeWeatherSymbol("heavyrainandthunder_day"),"Thunderstorms");
  assert.equal(describeWeatherSymbol("clearsky_day"),"Clear");
});

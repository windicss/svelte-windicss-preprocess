<script>
  let date = new Date();
  let city = 'london';
  let geoLocation = getCoordinates(city);
  let currentCity;
  async function update() {
    if (city == '' || city == undefined) return;
    geoLocation = await getCoordinates(city);
    weather = await getWeather(geoLocation);
  }

  let weather = update();

  async function getCoordinates(city) {
    let geocode = await fetch(`https://geocode.xyz/${city}?json=1`).then(res => res.json());
    if (geocode.success == false) {
      currentCity = 'rate limit';
      return { lat: 0, lon: 0 };
    } else {
      currentCity = geocode?.standard?.city;
      return { lat: geocode.latt, lon: geocode.longt };
    }
  }
  async function getWeather(geoLocation) {
    let weather = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/?lat=${geoLocation.lat}&lon=${geoLocation.lon}`
    ).then(res => res.json());
    return weather;
  }

  function convertDirection(degrees) {
    if (degrees > 348.75) return 'N';
    if (degrees > 326.25) return 'NNW';
    if (degrees > 303.75) return 'NW';
    if (degrees > 281.25) return 'WNW';
    if (degrees > 258.75) return 'W';
    if (degrees > 236.25) return 'WSW';
    if (degrees > 213.75) return 'SW';
    if (degrees > 191.25) return 'SSW';
    if (degrees > 168.75) return 'S';
    if (degrees > 146.25) return 'SSE';
    if (degrees > 123.75) return 'SE';
    if (degrees > 101.25) return 'ESE';
    if (degrees > 78.75) return 'E';
    if (degrees > 56.25) return 'ENE';
    if (degrees > 33.75) return 'NE';
    if (degrees > 11.25) return 'NNE';
    if (degrees > 0) return 'N';
  }
</script>

<div>
  {#await weather}
    <pre>loading weather</pre>
  {:then data}
    <div
      class="flex flex-col justify-between p-5 shadow-md rounded-3xl bg-gradient-to-br from-fuchsia-400 to-indigo-600 w-500px h-500px"
    >
      <div class="flex flex-row items-center justify-between flex-grow-1">
        <div>
          <input
            bind:value={city}
            on:change={update}
            type="text"
            placeholder="paris or berlin"
            class="p-2 text-white placeholder-gray-100 bg-transparent border-2 border-white rounded "
          />
        </div>
        <div class="flex flex-col items-center select-none">
          <span class="text-base text-white">current data: {currentCity}</span>
          <time class="text-2xl semibold-white">{date.toLocaleTimeString()}</time>
        </div>
      </div>
      <div class="flex flex-row items-center justify-center font-extrabold text-white select-none text-8xl flex-grow-2">
        <div class="flex flex-col items-center gap-5px">
          <span>
            {data.properties.timeseries[0].data.instant.details.air_temperature}
            {data.properties.meta.units.air_temperature == 'celsius' ? '°C' : '°F'}
          </span>
          <span class="text-base">temperature</span>
        </div>
      </div>
      <div
        class="grid grid-cols-2 col-auto grid-rows-2 row-auto text-4xl font-bold text-white select-none flex-grow-1 place-items-center h-200px"
      >
        <div class="flex flex-col items-center gap-5px">
          <span>
            {data.properties.timeseries[0].data.instant.details.relative_humidity}
            {data.properties.meta.units.relative_humidity}
          </span>
          <span class="text-sm">realative Humidity</span>
        </div>
        <div class="flex flex-col items-center gap-5px">
          <span>
            {data.properties.timeseries[0].data.instant.details.ultraviolet_index_clear_sky}
          </span>
          <span class="text-sm">UV Index</span>
        </div>
        <div class="flex flex-col items-center gap-5px">
          <span>
            {convertDirection(data.properties.timeseries[0].data.instant.details.wind_from_direction)}
          </span>
          <span class="text-sm">wind direction</span>
        </div>
        <div class="flex flex-col items-center gap-5px">
          <span>
            {data.properties.timeseries[0].data.instant.details.wind_speed}
            {data.properties.meta.units.wind_speed}
          </span>
          <span class="text-sm">wind speed</span>
        </div>
      </div>
    </div>
  {/await}
</div>

<style>
  .semibold-white {
    @apply text-white font-semibold;
  }
</style>

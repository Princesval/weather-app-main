// Pegar o button e o input
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('search-input');

// Container HTML
const banner = document.getElementById('section-banner');
const grid4 = document.getElementById('section-grid-4');
const grid7 = document.getElementById('section-grid-7');
const sideBar = document.getElementById('container-card-next-hour');

// Formatar data 
function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Função icon do clima

function getWeatherIcon(code) {
    switch (code) {
        case 0:
            return 'assets/images/weather/icon-sunny.webp';

        case 1:
        case 2:
            return 'assets/images/weather/icon-partly-cloudy.webp';

        case 3:
            return 'assets/images/weather/icon-overcast.webp';

        case 45:
        case 48:
            return 'assets/images/weather/icon-fog.webp';

        case 51:
        case 53:
        case 55:
            return 'assets/images/weather/icon-drizzle.webp';

        case 61:
        case 63:
        case 65:
        case 80:
        case 81:
        case 82:
            return 'assets/images/weather/icon-rain.webp';

        case 66:
        case 67:
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
            return 'assets/images/weather/icon-snow.webp';

        case 95:
        case 96:
        case 99:
            return 'assets/images/weather/icon-storm.webp';

        default:
            return 'assets/images/weather/icon-overcast.webp';
    }
}

// Pegar latitude e longitude, nome, páis
async function getLocation(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=pt&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if(!data.results) {
        alert('Cidade não encontrada');
        return null
    }

    return data.results[0];
    
}

// Pegar dados do clima com base na localização passada
async function getWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weathercode&daily=weathercode,temperature_2m_min,temperature_2m_max&hourly=weathercode,temperature_2m&forecast_days=7&timezone=auto`;

    const response = await fetch(url)
    return await response.json();
    
}

function bannerHTML(cityName, countryName, data) {
    const weather = data.current;
    const formattedDate = formatDate(weather.time);
    const icon = getWeatherIcon(weather.weathercode)
    banner.innerHTML = '';

    banner.innerHTML = `
        <div id="city-date">
            <span><strong>${cityName}, ${countryName}</strong></span>
            <span>${formattedDate}</span>
        </div>
        <div id="temperature-now">
            <img src=${icon} alt="Weather icon">
            <span>${weather.temperature_2m} C°</span>
        </div>
    `;
}

function grid4HTML(data) {
    const weather = data.current
    grid4.innerHTML = ''
    grid4.innerHTML = `
        <div class="card">
            <h3>Feels like</h3>
            <span>${weather.apparent_temperature}°</span>
        </div>

        <div class="card">
            <h3>Humidity</h3>
            <span>${weather.relative_humidity_2m}%</span>
        </div>

        <div class="card">
            <h3>Wind</h3>
            <span>${weather.wind_speed_10m} km/h</span>
        </div>

        <div class="card">
            <h3>Precipitation</h3>
            <span>${weather.precipitation} mm</span>
        </div>
    `;
}

// Pegar o dia da semana abreviado (Fri, Mon, Sun...)
function getWeekDay(dateStr) {
    const [year, month, day] = dateStr.split('-');

    const date = new Date (
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    return date.toLocaleDateString('en-US',{
        weekday: 'short'
    });
}

function grid7HTML(data){
    const dailyWeather = data.daily;
    grid7.innerHTML = ''

    for (let i = 0; i < 7; i++) {
        const day = getWeekDay(dailyWeather.time[i]);
        const icon = getWeatherIcon(dailyWeather.weathercode[i]);
        const max = Math.round(dailyWeather.temperature_2m_max[i]);
        const min = Math.round(dailyWeather.temperature_2m_min[i]);
        grid7. innerHTML += `
            <div class="card">
                <span>${day}</span>
                <img src="${icon}" alt="Weather icon">
                <div>
                    <span>${max}°</span>
                    <span>${min}°</span>
                </div>
            </div>
        `;
    }
}

// Formatar hora para AM e PM
function formatHour(dateStr) {
  const date = new Date(dateStr);
  let hour = date.getHours();
  const period = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;

  return `${hour} ${period}`;
}

function roundHourDown(dateStr) {
  const date = new Date(dateStr);
  date.setMinutes(0, 0, 0); // zera minutos, segundos e ms
  return date.getTime();
}

function sideBarHTML(data) {
    const currentTime = data.current.time;
    sideBar.innerHTML = '';

    // arredondar hora atual para baixo
    const nowRounded = new Date(data.current.time);
    nowRounded.setMinutes(0, 0, 0);

    // achar índice no hourly
    const startIndex = data.hourly.time.findIndex(time =>
        new Date(time).getTime() === nowRounded.getTime()
    );

    if (startIndex === -1) return;

    // próximas 8 horas
    for (let i = startIndex; i < startIndex + 8; i++) {
        const hour = formatHour(data.hourly.time[i]);
        const temp = Math.round(data.hourly.temperature_2m[i]);
        const icon = getWeatherIcon(data.hourly.weathercode[i]);

        sideBar.innerHTML += `
        <div class="card-next-hour">
            <div>
            <img src="${icon}" alt="Weather icon">
            <span>${hour}</span>
            </div>
            <div>
            <span>${temp}°</span>
            </div>
        </div>
        `;
    }
}

// Pegar o click no botão
searchBtn.addEventListener('click', async() => {
    const city = cityInput.value;
    if(!city) {
        alert('Insira um nome de cidade');
        return
    }

    // Latitude e Longitude
    const cityData = await getLocation(city);
    if (!cityData) return;
    // Pegar clima usando a localização
    const weatherData = await getWeather(cityData.latitude, cityData.longitude);
    bannerHTML(cityData.name, cityData.country, weatherData);
    grid4HTML(weatherData);
    grid7HTML(weatherData);
    sideBarHTML(weatherData);
})
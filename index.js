// API для получения данных погоды (Open-Meteo - бесплатный API без ключа)
const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// Элементы DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContainer = document.getElementById('weatherContainer');
const errorMessage = document.getElementById('errorMessage');
const quickButtons = document.querySelectorAll('.quick-btn');

// События
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const country = btn.getAttribute('data-country');
        getWeatherByCountry(country);
    });
});

// Функция для получения погоды по городу
async function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Пожалуйста, введите название города или страны');
        return;
    }

    await getWeather(city);
    cityInput.value = '';
}

// Функция для получения координат города
async function getCityCoordinates(city) {
    try {
        const response = await fetch(
            `${BASE_URL}?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`
        );

        if (!response.ok) {
            showError('Город не найден. Пожалуйста, проверьте название.');
            return null;
        }

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            showError('Город не найден. Попробуйте другое название.');
            return null;
        }

        return data.results[0];
    } catch (error) {
        console.error('Ошибка при поиске города:', error);
        showError('Ошибка подключения. Проверьте интернет.');
        return null;
    }
}

// Функция для получения погоды по координатам
async function getWeatherByCoords(latitude, longitude, cityName, country) {
    try {
        const response = await fetch(
            `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,visibility&timezone=auto`
        );

        if (!response.ok) {
            showError('Ошибка при получении данных о погоде.');
            return;
        }

        const data = await response.json();
        displayWeather(data, cityName, country, latitude, longitude);
    } catch (error) {
        console.error('Ошибка при получении погоды:', error);
        showError('Ошибка подключения. Проверьте интернет.');
    }
}

// Функция для получения погоды
async function getWeather(city) {
    try {
        hideError();
        weatherContainer.innerHTML = '<div class="loading">⏳ Загрузка данных...</div>';

        const cityData = await getCityCoordinates(city);
        if (!cityData) {
            weatherContainer.innerHTML = '';
            return;
        }

        await getWeatherByCoords(
            cityData.latitude,
            cityData.longitude,
            cityData.name,
            cityData.country
        );
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Ошибка при обработке запроса.');
        weatherContainer.innerHTML = '';
    }
}

// Функция для получения погоды по стране (столица)
async function getWeatherByCountry(country) {
    const capitalCities = {
        'Russia': 'Moscow',
        'USA': 'Washington',
        'China': 'Beijing',
        'Japan': 'Tokyo',
        'Germany': 'Berlin',
        'France': 'Paris',
        'Canada': 'Ottawa',
        'Australia': 'Canberra',
        'India': 'New Delhi',
        'Brazil': 'Brasília'
    };

    const city = capitalCities[country] || country;
    await getWeather(city);
}

// Функция для отображения погоды
function displayWeather(data, cityName, country, lat, lon) {
    weatherContainer.innerHTML = '';

    const current = data.current;
    const weatherCode = current.weather_code;

    // Определяем иконку погоды
    const weatherIcon = getWeatherIcon(weatherCode);
    const description = getWeatherDescription(weatherCode);

    // Создаем карточку
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.innerHTML = `
        <div class="weather-header">
            <div class="city-info">
                <h2>${cityName}</h2>
                <p>${country}</p>
            </div>
            <div class="weather-icon">${weatherIcon}</div>
        </div>

        <div class="temperature">${Math.round(current.temperature_2m)}°C</div>
        <div class="weather-description">${description}</div>

        <div class="weather-details">
            <div class="detail-item">
                <div class="detail-icon">💧</div>
                <div class="detail-info">
                    <h4>Влажность</h4>
                    <p>${current.relative_humidity_2m}%</p>
                </div>
            </div>

            <div class="detail-item">
                <div class="detail-icon">💨</div>
                <div class="detail-info">
                    <h4>Ветер</h4>
                    <p>${Math.round(current.wind_speed_10m)} км/ч</p>
                </div>
            </div>

            <div class="detail-item">
                <div class="detail-icon">🌡️</div>
                <div class="detail-info">
                    <h4>Ощущается</h4>
                    <p>${Math.round(current.apparent_temperature)}°C</p>
                </div>
            </div>

            <div class="detail-item">
                <div class="detail-icon">🔽</div>
                <div class="detail-info">
                    <h4>Давление</h4>
                    <p>${Math.round(current.pressure_msl)} мб</p>
                </div>
            </div>

            <div class="detail-item">
                <div class="detail-icon">👁️</div>
                <div class="detail-info">
                    <h4>Видимость</h4>
                    <p>${Math.round(current.visibility / 1000)} км</p>
                </div>
            </div>

            <div class="detail-item">
                <div class="detail-icon">💧</div>
                <div class="detail-info">
                    <h4>Осадки</h4>
                    <p>${current.precipitation} мм</p>
                </div>
            </div>
        </div>

        <div style="margin-top: 15px; font-size: 12px; color: #999;">
            Координаты: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°
        </div>
    `;

    weatherContainer.appendChild(card);
}

// Функция для получения эмодзи иконки погоды и описания
function getWeatherIcon(code) {
    // WMO Weather interpretation codes
    if (code === 0) return '☀️'; // Clear sky
    if (code === 1 || code === 2) return '⛅'; // Mainly clear, partly cloudy
    if (code === 3) return '☁️'; // Overcast
    if (code === 45 || code === 48) return '🌫️'; // Foggy
    if (code === 51 || code === 53 || code === 55) return '🌧️'; // Drizzle
    if (code === 61 || code === 63 || code === 65) return '🌧️'; // Rain
    if (code === 71 || code === 73 || code === 75) return '❄️'; // Snow
    if (code === 77) return '❄️'; // Snow grains
    if (code === 80 || code === 81 || code === 82) return '🌧️'; // Rain showers
    if (code === 85 || code === 86) return '🌨️'; // Snow showers
    if (code === 95 || code === 96 || code === 99) return '⛈️'; // Thunderstorm
    
    return '🌤️'; // Default
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Ясно',
        1: 'Преимущественно ясно',
        2: 'Частично облачно',
        3: 'Облачно',
        45: 'Туман',
        48: 'Иней',
        51: 'Легкая морось',
        53: 'Морось',
        55: 'Сильная морось',
        61: 'Небольшой дождь',
        63: 'Дождь',
        65: 'Сильный дождь',
        71: 'Небольшой снег',
        73: 'Снег',
        75: 'Сильный снег',
        77: 'Снежная крупа',
        80: 'Небольшие дождевые ливни',
        81: 'Дождевые ливни',
        82: 'Сильные дождевые ливни',
        85: 'Небольшие ливни со снегом',
        86: 'Ливни со снегом',
        95: 'Грозовой дождь',
        96: 'Грозовой дождь с градом',
        99: 'Грозовой дождь с сильным градом'
    };
    
    return descriptions[code] || 'Неизвестная погода';
}

// Функция для показания ошибки
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// Функция для скрытия ошибки
function hideError() {
    errorMessage.classList.remove('show');
}

// Загружаем погоду для текущего местоположения при загрузке страницы
window.addEventListener('load', () => {
    // Пытаемся получить локацию пользователя
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Получили координаты - получаем погоду
                const { latitude, longitude } = position.coords;
                weatherContainer.innerHTML = '<div class="loading">⏳ Загрузка данных...</div>';
                getWeatherByCoords(latitude, longitude, 'Ваше местоположение', 'Определяется...');
            },
            () => {
                // Если нет доступа к геолокации, загружаем погоду для Москвы по умолчанию
                getWeather('Moscow');
            }
        );
    } else {
        // Если геолокация не поддерживается, загружаем погоду для Москвы
        getWeather('Moscow');
    }
});

// Функция для получения геоположения (не используется больше)
async function getWeatherByCoordinatesOld(lat, lon) {
    try {
        hideError();
        weatherContainer.innerHTML = '<div class="loading">⏳ Загрузка данных...</div>';

        const response = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,visibility&timezone=auto`
        );

        if (response.ok) {
            const data = await response.json();
            displayWeather(data, 'Ваше местоположение', '', lat, lon);
        } else {
            // Если ошибка, загружаем Москву
            getWeather('Moscow');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        // Если ошибка, загружаем Москву
        getWeather('Moscow');
    }
}

// Стиль для загрузки
const style = document.createElement('style');
style.textContent = `
    .loading {
        text-align: center;
        color: white;
        font-size: 18px;
        padding: 40px 20px;
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
`;
document.head.appendChild(style);

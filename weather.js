// weather.js — uses OpenWeather API and browser geolocation
const OPENWEATHER_API_KEY = "OPENWEATHER_API_KEY"; // replace with your key

async function getLocalWeatherText(){
  try{
    if(!navigator.geolocation) return 'Geolocation not supported by your browser.';
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }));
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    if(!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'OPENWEATHER_API_KEY') return 'OpenWeather key not configured.';
    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    if(!resp.ok) return 'Weather fetch failed.';
    const data = await resp.json();
    let advice = '';
    if(data.main.temp > 30) advice += 'Hot weather — protect seedlings from sun. ';
    if((data.weather[0].main || '').toLowerCase().includes('rain')) advice += 'Rain expected — protect harvest and avoid field work. ';
    if(data.wind && data.wind.speed > 8) advice += 'Windy — stake tall crops. ';
    if(!advice) advice = 'No immediate weather actions needed.';
    return `Weather: ${data.name} — ${data.weather[0].description}, ${data.main.temp}°C. Advice: ${advice}`;
  } catch(err){
    console.error('weather err', err);
    return 'Unable to get local weather. Allow location or try again.';
  }
}
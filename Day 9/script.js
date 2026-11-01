"use strict";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

// Footer year
$("#year").textContent = new Date().getFullYear();

// Weather elements
const searchForm = $("#searchForm");
const cityInput = $("#cityInput");
const searchButton = $("#searchButton");
const statusElement = $("#status");
const weatherCard = $("#weatherCard");

// WMO weather codes returned by Open-Meteo
function getWeatherInfo(code, isDay) {
    if (code === 0) {
        return {
            description: "Clear sky",
            icon: isDay ? "☀️" : "🌙"
        };
    }

    if (code === 1) {
        return {
            description: "Mainly clear",
            icon: isDay ? "🌤️" : "🌙"
        };
    }

    if (code === 2) {
        return {
            description: "Partly cloudy",
            icon: "⛅"
        };
    }

    if (code === 3) {
        return {
            description: "Overcast",
            icon: "☁️"
        };
    }

    if ([45, 48].includes(code)) {
        return {
            description: "Foggy",
            icon: "🌫️"
        };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return {
            description: "Drizzle",
            icon: "🌦️"
        };
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return {
            description: "Rain",
            icon: "🌧️"
        };
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return {
            description: "Snow",
            icon: "❄️"
        };
    }

    if ([95, 96, 99].includes(code)) {
        return {
            description: "Thunderstorm",
            icon: "⛈️"
        };
    }

    return {
        description: "Unknown conditions",
        icon: "🌡️"
    };
}

// Update the status message
function setStatus(message, type = "") {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.className = `status ${type}`.trim();
}

// Fetch JSON and reject unsuccessful HTTP responses
async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
}

// Find the city coordinates using Open-Meteo geocoding
async function getCityCoordinates(city) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

    url.search = new URLSearchParams({
        name: city,
        count: "1",
        language: "en",
        format: "json"
    });

    const data = await fetchJSON(url);

    if (!data.results || data.results.length === 0) {
        throw new Error(
            "City not found. Check the spelling and try again."
        );
    }

    return data.results[0];
}

// Fetch weather using the city's latitude and longitude
async function getWeather(latitude, longitude) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");

    url.search = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        ].join(","),
        daily: "temperature_2m_max,temperature_2m_min",
        timezone: "auto",
        forecast_days: "1"
    });

    return fetchJSON(url);
}

// Display weather data in the interface
function displayWeather(location, data) {
    const current = data.current;
    const daily = data.daily;

    const weatherInfo = getWeatherInfo(
        current.weather_code,
        current.is_day
    );

    $("#cityName").textContent = location.name;

    $("#countryName").textContent = [
        location.admin1,
        location.country
    ].filter(Boolean).join(", ");

    $("#weatherIcon").textContent = weatherInfo.icon;
    $("#temperature").textContent = Math.round(current.temperature_2m);
    $("#feelsLike").textContent = Math.round(current.apparent_temperature);

    $("#weatherDescription").textContent = weatherInfo.description;

    $("#humidity").textContent = current.relative_humidity_2m;
    $("#windSpeed").textContent = Math.round(current.wind_speed_10m);

    $("#temperatureRange").textContent =
        `${Math.round(daily.temperature_2m_min[0])} / ` +
        `${Math.round(daily.temperature_2m_max[0])}`;

    $("#updatedTime").textContent =
        `Weather data time: ${current.time.replace("T", " ")} ` +
        `(${data.timezone})`;

    weatherCard.hidden = false;
}

// Handle the search form
if (searchForm) {
    searchForm.addEventListener("submit", async event => {
        event.preventDefault();

        const city = cityInput.value.trim();

        if (!city) {
            setStatus("Please enter a city name.", "error");
            return;
        }

        searchButton.disabled = true;
        searchButton.textContent = "Loading...";
        weatherCard.hidden = true;

        setStatus(`Searching for ${city}...`);

        try {
            const location = await getCityCoordinates(city);

            setStatus("Location found. Loading weather...");

            const weather = await getWeather(
                location.latitude,
                location.longitude
            );

            displayWeather(location, weather);
            setStatus(`Weather loaded successfully for ${location.name}.`, "success");
        } catch (error) {
            console.error("Weather app error:", error);
            setStatus(error.message || "Something went wrong. Try again.", "error");
        } finally {
            searchButton.disabled = false;
            searchButton.textContent = "Search";
        }
    });
}

// Back to top button functionality
const backToTop = $("#backToTop");

if (backToTop) {
    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    window.addEventListener("scroll", () => {
        backToTop.classList.toggle("show", window.scrollY > 300);
    });
}
// Mobile navigation & dropdown toggle
const menuToggle = $("#menuToggle");
const navMenu = $("#navMenu");

if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.textContent = isOpen ? "✕" : "☰"; // Switches between cross and lines
    });

    // Close the menu automatically when clicking a navigation link
    navMenu.querySelectorAll("a:not(.nav-dropdown-menu a)").forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.textContent = "☰"; // Resets back to three lines
        });
    });
}
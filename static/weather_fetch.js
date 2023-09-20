document.addEventListener("DOMContentLoaded", function () {
  const citySelect = document.getElementById("city-select");
  const forecastDiv = document.getElementById("forecast");
  const switchToXMLButton = document.getElementById("switch-to-XML-button");

  // Define separate arrays to store data for each city
  let forecastData = {
    Aarhus: [],
    Horsens: [],
    Copenhagen: [],
  };
  let predictionsData = {
    Aarhus: [],
    Horsens: [],
    Copenhagen: [],
  };

  let cityName = "";

  switchToXMLButton.addEventListener("click", function () {
    window.location.href = "index.html";
  });

  citySelect.addEventListener("change", function () {
    cityName = citySelect.value;
    showForecast(cityName);
  });

  // Fetch data for all cities when the page loads
  fetchWeatherForecast("Aarhus");
  fetchWeatherForecast("Horsens");
  fetchWeatherForecast("Copenhagen");
  fetchPredictions();

  async function fetchWeatherForecast(city) {
    try {
      const response = await fetch(`/forecast/${city}`);
      if (response.ok) {
        const data = await response.json();
        forecastData[city] = data.map((item) => ({
          type: item.type,
          from: item.from,
          to: item.to,
          unit: item.unit,
          time: new Date(item.time),
          place: item.place,
        }));
        showForecast(cityName);
      } else {
        console.error(`Failed to fetch weather data for ${city}.`);
      }
    } catch (error) {
      console.error(
        `An error occurred while fetching weather data for ${city}:`,
        error
      );
    }
  }

  async function fetchPredictions() {
    try {
      const response = await fetch("/warnings");
      if (response.ok) {
        const data = await response.json();
        data.warnings.forEach((warning) => {
          const prediction = warning.prediction;
          const predictionObject = {
            id: warning.id,
            severity: warning.severity,
            prediction: {
              from: prediction.from,
              to: prediction.to,
              directions: prediction.directions,
              type: prediction.type,
              unit: prediction.unit,
              time: new Date(prediction.time),
              place: prediction.place,
            },
          };
          predictionsData[warning.prediction.place].push(predictionObject);
        });
        showForecast(cityName);
      } else {
        console.error("Failed to fetch predictions data.");
      }
    } catch (error) {
      console.error(
        "An error occurred while fetching predictions data:",
        error
      );
    }
  }

  function showForecast(city) {
    const hourlyForecastHtml = getHourlyForecast(predictionsData[city]);
    const latestMeasurementsHtml = getLatestMeasurements(forecastData[city]);
    const minimumTemperatureHtml = getMinimumTemperatureLastDay(
      predictionsData[city]
    );
    const maximumTemperatureHtml = getMaximumTemperatureLastDay(
      predictionsData[city]
    );
    const totalPrecipitationHtml = getTotalPrecipitationLastDay(
      forecastData[city]
    );
    const averageWindSpeedHtml = getAverageWindSpeedLastDay(forecastData[city]);

    // Display the generated HTML content in your page
    forecastDiv.innerHTML = "";
    forecastDiv.innerHTML = `${hourlyForecastHtml}${latestMeasurementsHtml}${minimumTemperatureHtml}${maximumTemperatureHtml}${totalPrecipitationHtml}${averageWindSpeedHtml}`;
  }

  function getHourlyForecast(predictions) {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
    const data = predictions;
    const hourlyForecast = data
      .filter(
        (prediction) =>
          prediction.prediction.time > now &&
          prediction.prediction.time <= next24Hours &&
          prediction.prediction.place === cityName
      )
      .map(
        (prediction) =>
          `${formatTime(prediction.prediction.time)}: ${
            prediction.prediction.type
          }: from ${prediction.from} to ${prediction.prediction.to} ${
            prediction.prediction.unit
          }`
      )
      .join("<br>");

    return `<h3>Hourly Forecast for the Next 24 Hours</h3>${hourlyForecast}`;
  }

  function getLatestMeasurements(forecastData) {
    const data = forecastData;
    const latestMeasurements = {};

    data.forEach((measurement) => {
      if (measurement.place === cityName) {
        const key = `${measurement.place}-${measurement.type}`;
        if (
          !latestMeasurements[key] ||
          measurement.time > latestMeasurements[key].time
        ) {
          latestMeasurements[key] = measurement;
        }
      }
    });

    const latestMeasurementsHtml = Object.values(latestMeasurements)
      .map(
        (measurement) =>
          `${measurement.type} in ${measurement.place}: ${
            (measurement.from + measurement.to) / 2
          } ${measurement.unit}`
      )
      .join("<br>");

    if (latestMeasurementsHtml.length > 0) {
      return `<h3>All Data for the Latest Measurement of Each Kind</h3>${latestMeasurementsHtml}`;
    } else {
      return `<h3>All Data for the Latest Measurement of Each Kind</h3>NO DATA`;
    }
  }

  function getMinimumTemperatureLastDay(predictions) {
    const data = predictions;
    let minimumTemperaturePrediction;
    data.forEach((prediction) => {
      if (prediction.prediction.place === cityName) {
        minimumTemperaturePrediction = prediction.prediction.from;
      }
    });

    if (minimumTemperaturePrediction === undefined) {
      return `<h3>Minimum Temperature for the Last Day</h3>NO DATA`;
    } else {
      return `<h3>Minimum Temperature for the Last Day</h3>${minimumTemperaturePrediction} °C`;
    }
  }

  function getMaximumTemperatureLastDay(predictions) {
    const data = predictions;
    let maximumTemperatureLastDay;

    data.forEach((prediction) => {
      if (prediction.prediction.place === cityName) {
        maximumTemperatureLastDay = prediction.prediction.to;
      }
    });

    if (maximumTemperatureLastDay === undefined) {
      return `<h3>Maximum Temperature for the Last Day</h3>NO DATA`;
    } else {
      return `<h3>Maximum Temperature for the Last Day</h3>${maximumTemperatureLastDay} °C`;
    }
  }

  function getTotalPrecipitationLastDay(forecastData) {
    let totalPrecipitationLastDay;
    const data = forecastData;
    data.forEach((forecast) => {
      if (forecast.type === "precipitation") {
        if (forecast.place === cityName) {
          totalPrecipitationLastDay = forecast.from;
        }
      }
    });

    if (
      totalPrecipitationLastDay === undefined ||
      totalPrecipitationLastDay === 0
    ) {
      return `<h3>Total Precipitation for the Last Day</h3>NO DATA`;
    } else {
      return `<h3>Total Precipitation for the Last Day</h3>${totalPrecipitationLastDay} mm`;
    }
  }

  function getAverageWindSpeedLastDay(forecastData) {
    const data = forecastData;
    let averageWindSpeedLastDay;
    data.forEach((forecast) => {
      if (forecast.place === cityName) {
        if (forecast.type === "wind speed") {
          averageWindSpeedLastDay = forecast.from;
        }
      }
    });
    const windSpeedPredictions = data.filter(
      (forecast) =>
        forecast.type === "wind speed" && forecast.place === cityName
    );

    if (windSpeedPredictions.length === 0) {
      return `<h3>Average Wind Speed for the Last Day</h3>NO DATA`;
    }

    const totalWindSpeed = windSpeedPredictions.reduce(
      (total, forecast) => total + forecast.from,
      0
    );
    const averageWindSpeed = totalWindSpeed / windSpeedPredictions.length;

    return `<h3>Average Wind Speed for the Last Day</h3>${averageWindSpeed.toFixed(
      2
    )} m/s`;
  }

  function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
});

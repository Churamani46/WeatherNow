const apiKey = "b1abf6004b2aa7cfcd4d93390f860505"; // ⚠ Replace this with your OpenWeatherMap API key

    // Clock updater
    function updateTime() {
      const now = new Date();
      document.getElementById('current-time').textContent =
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    setInterval(updateTime, 1000);
    updateTime();

    // Update weather metrics
    async function fetchWeatherData(city) {
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const data = await response.json();

        document.querySelector('#temperature-desc').nextElementSibling.innerHTML =
          `${data.main.temp.toFixed(1)} <small>°C</small>`;
        document.querySelector('#windspeed-desc').nextElementSibling.innerHTML =
          `${data.wind.speed} <small>m/s</small>`;
        document.querySelector('#humidity-desc').nextElementSibling.innerHTML =
          `${data.main.humidity} <small>%</small>`;
      } catch (error) {
        alert("Could not fetch weather data for " + city);
      }
    }

    // Map update
    function updateMap(city) {
      document.getElementById("map-frame").src =
        `https://maps.google.com/maps?q=${encodeURIComponent(city)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    }

    // City switch
    const cityButtons = document.querySelectorAll('.city-card');
    const locationDisplay = document.querySelector('#location-display span');

    cityButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        cityButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const city = btn.dataset.city;
        locationDisplay.textContent = city;
        updateMap(city);
        fetchWeatherData(city);
        updateChart(city);
      });
    });

    // Form search
    document.getElementById("city-form").addEventListener("submit", e => {
      e.preventDefault();
      const city = document.getElementById("city-input").value.trim();
      if (!city) return;
      locationDisplay.textContent = city;
      updateMap(city);
      fetchWeatherData(city);
      updateChart(city);
      cityButtons.forEach(b => b.classList.remove('selected'));
    });

    // Chart
    const tempChartCtx = document.getElementById('tempChart').getContext('2d');
    const tempChart = new Chart(tempChartCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Temperature (°C)',
          data: [],
          borderColor: '#58a0ff',
          tension: 0.3,
          fill: false,
          borderWidth: 3,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 40,
            ticks: { stepSize: 5, color: "#444" },
            grid: { color: "#eee" }
          },
          x: {
            ticks: { color: "#444" },
            grid: { color: "#f0f0f0" }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // Update chart with forecast data
    async function updateChart(city) {
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
        const data = await response.json();
        // Group by date, get average temp per day
        const tempsByDate = {};
        data.list.forEach(item => {
          const date = item.dt_txt.split(' ')[0];
          if (!tempsByDate[date]) tempsByDate[date] = [];
          tempsByDate[date].push(item.main.temp);
        });
        const dateKeys = Object.keys(tempsByDate).slice(0, 5);
        const labels = dateKeys.map(date => {
          const d = new Date(date);
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });
        const temps = Object.values(tempsByDate).slice(0, 5).map(arr => {
          const sum = arr.reduce((a, b) => a + b, 0);
          return (sum / arr.length).toFixed(1);
        });
        tempChart.data.labels = labels;
        tempChart.data.datasets[0].data = temps;
        tempChart.update();
        // Update chart description to match date range
        if (labels.length > 0) {
          const desc = `Line chart showing temperature trend over 5 days from ${labels[0]} to ${labels[labels.length-1]}`;
          const chartDesc = document.getElementById('chart-desc');
          if (chartDesc) chartDesc.innerHTML = desc;
        }
      } catch (error) {
        // fallback: clear chart
        tempChart.data.labels = [];
        tempChart.data.datasets[0].data = [];
        tempChart.update();
      }
    }

    // Load default
    window.onload = () => {
      fetchWeatherData("Kolkata");
      updateChart("Kolkata");
    };
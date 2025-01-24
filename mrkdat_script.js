const config = {
    refreshInterval: 60000,
    alphaVantageEndpoint: 'https://www.alphavantage.co/query',
    apiKey: 'FP2GQPMOEWKAE19J', // Alpha Vantage API Key
    bistSymbol: 'XU100.IS', // Replace with the correct symbol for BIST 100
    glrmkSymbol: 'GLRMK.IS', // Replace with the correct symbol for GLRMK
    retryAttempts: 3,
    retryDelay: 5000
};

function formatCurrency(number, currency = '₺', decimals = 2) {
    return `${currency}${Number(number).toFixed(decimals)}`;
}

function updateTimestamp() {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    document.getElementById('lastUpdate').textContent = 
        `Last updated: ${new Date().toLocaleTimeString('tr-TR', options)}`;
}

async function fetchWithRetry(url, attempts = config.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i === attempts - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        }
    }
}

async function fetchMarketData() {
    try {
        // Fetch BIST 100 data
        const bistData = await fetchWithRetry(
            `${config.alphaVantageEndpoint}?function=TIME_SERIES_INTRADAY&symbol=${config.bistSymbol}&interval=1min&apikey=${config.apiKey}`
        );
        const bistLastValue = Object.values(bistData['Time Series (1min)'])[0]['4. close'];
        document.querySelector('.widget .header:contains("BIST 100") + .value-group .value').textContent = 
            formatCurrency(bistLastValue);

        // Fetch GLRMK data
        const glrmkData = await fetchWithRetry(
            `${config.alphaVantageEndpoint}?function=TIME_SERIES_INTRADAY&symbol=${config.glrmkSymbol}&interval=1min&apikey=${config.apiKey}`
        );
        const glrmkLastValue = Object.values(glrmkData['Time Series (1min)'])[0]['4. close'];
        document.querySelector('.widget .header:contains("GLRMK") + .value-group .value').textContent = 
            formatCurrency(glrmkLastValue);
    } catch (error) {
        console.error('Error fetching market data:', error);
    }
}

async function fetchForexRates() {
    try {
        const usdData = await fetchWithRetry(
            `${config.alphaVantageEndpoint}?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TRY&apikey=${config.apiKey}`
        );
        const eurData = await fetchWithRetry(
            `${config.alphaVantageEndpoint}?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=TRY&apikey=${config.apiKey}`
        );

        document.getElementById('usdtry').textContent = formatCurrency(
            usdData['Realtime Currency Exchange Rate']['5. Exchange Rate'],
            '₺',
            4
        );
        document.getElementById('eurtry').textContent = formatCurrency(
            eurData['Realtime Currency Exchange Rate']['5. Exchange Rate'],
            '₺',
            4
        );

        updateTimestamp();
    } catch (error) {
        console.error('Error fetching forex rates:', error);
    }
}

// Initialize
function initializeDashboard() {
    fetchForexRates();
    fetchMarketData();

    setInterval(fetchForexRates, config.refreshInterval);
    setInterval(fetchMarketData, config.refreshInterval);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(fetchForexRates);
            clearInterval(fetchMarketData);
        } else {
            fetchForexRates();
            fetchMarketData();
        }
    });
}

initializeDashboard();

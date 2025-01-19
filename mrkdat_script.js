// Configuration
const config = {
    refreshInterval: 60000,
    frankfurterEndpoint: 'https://api.frankfurter.app/latest',
    retryAttempts: 3,
    retryDelay: 5000
};

// Utility Functions
function formatCurrency(number, decimals = 2) {
    return `₺${Number(number).toFixed(decimals)}`;
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

function setLoadingState(isLoading) {
    const elements = ['usdtry', 'eurtry'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (isLoading) {
            element.textContent = 'Loading...';
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    });
}

// API Functions
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

async function fetchForexRates() {
    setLoadingState(true);
    try {
        const [eurData, usdData] = await Promise.all([
            fetchWithRetry(`${config.frankfurterEndpoint}?from=EUR&to=TRY`),
            fetchWithRetry(`${config.frankfurterEndpoint}?from=USD&to=TRY`)
        ]);

        const usdElement = document.getElementById('usdtry');
        const eurElement = document.getElementById('eurtry');

        usdElement.textContent = formatCurrency(usdData.rates.TRY, 4);
        eurElement.textContent = formatCurrency(eurData.rates.TRY, 4);

        if (usdElement.dataset.previousValue) {
            const previousUsd = parseFloat(usdElement.dataset.previousValue);
            const currentUsd = usdData.rates.TRY;
            usdElement.classList.toggle('rate-up', currentUsd > previousUsd);
            usdElement.classList.toggle('rate-down', currentUsd < previousUsd);
        }
        usdElement.dataset.previousValue = usdData.rates.TRY;

        updateTimestamp();
    } catch (error) {
        console.error('Error fetching forex rates:', error);
        const errorMessage = error.message.includes('HTTP error') 
            ? 'Service unavailable' 
            : 'Network error';
        
        document.getElementById('usdtry').textContent = errorMessage;
        document.getElementById('eurtry').textContent = errorMessage;
    } finally {
        setLoadingState(false);
    }
}

// Mock data functions for demonstration
function populateMarketData() {
    const stockMarkets = document.getElementById('stockMarkets');
    const commodities = document.getElementById('commodities');
    const crypto = document.getElementById('crypto');

    // Example data - replace with real API calls
    stockMarkets.innerHTML = `
        <div class="market-item">
            <span>DOW JONES</span>
            <span class="rate-up">+1.2%</span>
        </div>
        <div class="market-item">
            <span>NASDAQ</span>
            <span class="rate-down">-0.5%</span>
        </div>
    `;

    commodities.innerHTML = `
        <div class="market-item">
            <span>Gold</span>
            <span class="rate-up">$1,890.50</span>
        </div>
        <div class="market-item">
            <span>Oil (Brent)</span>
            <span class="rate-down">$75.30</span>
        </div>
    `;

    crypto.innerHTML = `
        <div class="market-item">
            <span>Bitcoin</span>
            <span class="rate-up">$42,150</span>
        </div>
        <div class="market-item">
            <span>Ethereum</span>
            <span class="rate-up">$2,890</span>
        </div>
    `;
}

// Navigation smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('

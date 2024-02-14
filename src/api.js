const API_KEY =
    'f42f70491d367d88ea7e00ce9b56f44145b8f1cccc603476eed2c9edd3c3acfc'

export const loadTicker = (tickers) =>
    fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${tickers.join(',')}&api_key=${API_KEY}`,
    ).then((response) => response.json())

export const loadAllCoins = () =>
    fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
        .then((response) => response.json())
        .then((coins) => Object.values(coins.Data))

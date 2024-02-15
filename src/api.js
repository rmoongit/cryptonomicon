const API_KEY =
    'f42f70491d367d88ea7e00ce9b56f44145b8f1cccc603476eed2c9edd3c3acfc'

const tickersHandlers = new Map()

//Получение конкретного тикера из массива в который добавили
const loadTickers = () => {
    if (tickersHandlers.size === 0) {
        return
    }

    fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD&api_key=${API_KEY}`,
    )
        .then((response) => response.json())
        .then((rawData) => {
            const updatedPrices = Object.fromEntries(
                Object.entries(rawData).map(([key, value]) => [
                    key,
                    1,
                    value.USD,
                ]),
            )

            Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
                const handlers = tickersHandlers.get(currency) ?? []
                handlers.forEach((fn) => fn(newPrice))
            })
        })
}

//Получение всех монет
export const loadAllCoins = () =>
    fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
        .then((response) => response.json())
        .then((coins) => Object.values(coins.Data))

//Используем ВЕБсокеты

export const subscribeToTicker = (ticker, callback) => {
    const subscribers = tickersHandlers.get(ticker) || []
    tickersHandlers.set(ticker, [...subscribers, callback])
}

export const unsubscribeFromTicker = (ticker) => {
    tickersHandlers.delete(ticker)
}

setInterval(loadTickers, 5000)

const API_KEY =
    'bf17aea97ceea9b0c7b3eb970ed642408bc1685b89f2620347a8ed32b0e33c7e'

const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`,
)
const tickersHandlers = new Map() // {}
const AGGREGATE_INDEX = '5'

//Получение всех монет
export const loadAllCoins = () =>
    fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
        .then((response) => response.json())
        .then((coins) => Object.values(coins.Data))

//Используем Websocket
socket.addEventListener('message', (event) => {
    const {
        TYPE: type,
        FROMSYMBOL: currency,
        PRICE: newPrice,
    } = JSON.parse(event.data)

    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return
    }

    const handlers = tickersHandlers.get(currency) ?? []
    handlers.forEach((fn) => fn(newPrice))
})
//Отправляет сокет
function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message)

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage)
        return
    }

    socket.addEventListener(
        'open',
        () => {
            socket.send(stringifiedMessage)
        },
        { once: true },
    )
}

//Подписывается на сокете
function subscribeToTickerOnWs(ticker) {
    sendToWebSocket({ action: 'SubAdd', subs: [`5~CCCAGG~${ticker}~USD`] })
}

function unSubscribeFromTickerOnWs(ticker) {
    sendToWebSocket({ action: 'SubRemove', subs: [`5~CCCAGG~${ticker}~USD`] })
}

//Подписчики
export const subscribeToTicker = (ticker, callback) => {
    const subscribers = tickersHandlers.get(ticker) || []
    tickersHandlers.set(ticker, [...subscribers, callback])
    subscribeToTickerOnWs(ticker)
}

export const unsubscribeFromTicker = (ticker) => {
    tickersHandlers.delete(ticker)
    unSubscribeFromTickerOnWs(ticker)
}

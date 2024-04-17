const API_KEY =
  'bf17aea97ceea9b0c7b3eb970ed642408bc1685b89f2620347a8ed32b0e33c7e'

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`,
)
const tickersHandlers = new Map() // {}
const tradedTickerPrices = new Map() // new {}

const AGGREGATE_INDEX = '5'
const invalidMessage = 'INVALID_SUB'
const BTC = 'BTC'
const USD = 'USD'

//Получение всех монет
export const loadAllCoins = () =>
  fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
    .then((response) => response.json())
    .then((coins) => Object.values(coins.Data))

/*
Websockets
Используем, слушаем сокет.
*/

socket.addEventListener('message', (event) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    TOSYMBOL: toSymbol,
    MESSAGE: message,
    PARAMETER: parameter,
    PRICE: newPrice,
  } = JSON.parse(event.data)

  if (message === invalidMessage) {
    const [, , ticker, newCurrency] = parameter.split('~')

    if (newCurrency === USD) {
      subscribeToTickerOnWs(ticker, BTC)
    }

    if (toSymbol !== BTC || toSymbol !== USD) {
      return
    }

    runHandlers(ticker, null)
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return
  }

  if (newPrice) {
    if (toSymbol === BTC) {
      subscribeToTickerOnWs(BTC, USD)
      tradedTickerPrices.set(currency, newPrice)
    }

    if (currency === BTC) {
      Array.from(tradedTickerPrices.keys()).forEach((ticker) => {
        const price = tradedTickerPrices.get(ticker)
        runHandlers(ticker, price * newPrice)
      })
    }
  }

  runHandlers(currency, newPrice)
})

function runHandlers(currency, price) {
  const handlers = tickersHandlers.get(currency) ?? []
  handlers.forEach((fn) => fn(price))
}

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
function subscribeToTickerOnWs(ticker, toSymbol = USD) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~${toSymbol}`],
  })
}

function unSubscribeFromTickerOnWs(ticker, toSymbol = USD) {
  const tickerName = ticker.name

  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${tickerName}~${toSymbol}`],
  })
}

//Подписчики
export const subscribeToTicker = (ticker, callback) => {
  const subscribers = tickersHandlers.get(ticker) || []
  tickersHandlers.set(ticker, [...subscribers, callback])
  subscribeToTickerOnWs(ticker)
}

export const unsubscribeFromTicker = (ticker) => {
  unSubscribeFromTickerOnWs(ticker)

  tickersHandlers.delete(ticker)
}

window.tickersHandlers = tickersHandlers // смотрим в консоле браузера выполнение этой функции

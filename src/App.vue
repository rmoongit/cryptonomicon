<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <AddTicker
        :tickers="tickers"
        :coin-list="coinList"
        @add-ticker="ToaddTicker"
      />

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <button
          v-if="page > 1"
          class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          @click="page = page - 1"
        >
          Назад
        </button>
        <button
          v-if="hasNextPage"
          class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          @click="page = page + 1"
        >
          Вперёд
        </button>
        <div>
          Фильтр:
          <input v-model="filter" type="text" placeholder="Введите название" />
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />

        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="tick of paginatedTickers"
            :key="tick.name"
            class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
            :class="{
              'border-4': selectedTicker === tick,
              'bg-rose-600': !tick.isAvailable,
              'bg-white': tick.isAvailable,
            }"
            @click="select(tick)"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ tick.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formattedPrice(tick, tick.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
              @click.stop="deleteTicker(tick)"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

      <TickerGraph
        v-if="selectedTicker"
        :ticker-name="selectedTicker.name"
        :graph="graph"
        @update-graph="updateGraph"
        @selected-ticker="selectedTicker = null"
      />
    </div>
  </div>
</template>

<script>
import { loadAllCoins, subscribeToTicker, unsubscribeFromTicker } from './api'
import AddTicker from './components/AddTicker.vue'
import TickerGraph from './components/TickerGraph.vue'

export default {
  components: {
    AddTicker,
    TickerGraph,
  },

  data() {
    return {
      ticker: '',
      filter: '',

      tickers: [],
      coinList: [],
      graph: [],

      selectedTicker: null,
      page: 1,
    }
  },

  computed: {
    //Вычисляем начало страницы
    startIndexPage() {
      return (this.page - 1) * 6
    },
    //Вычисляем конец страницы
    endIndexPage() {
      return this.page * 6
    },

    //Условие для следующей страницы
    hasNextPage() {
      return this.filteredTickers.length > this.endIndexPage
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      }
    },

    //Фильтрация tickers по названию в поле "Фильтр:"
    filteredTickers() {
      return this.tickers.filter((ticker) =>
        ticker.name.toLowerCase().includes(this.filter.toLowerCase()),
      )
    },
    //Вывод отфильтрованных tickers
    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndexPage, this.endIndexPage)
    },
  },

  watch: {
    selectedTicker() {
      this.graph = []
    },

    tickers() {
      localStorage.setItem('cryptonomicon-list', JSON.stringify(this.tickers))
    },

    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1
      }
    },

    filter() {
      this.page = 1
    },

    pageStateOptions(value) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`,
      )
    },
  },

  created: async function () {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries(),
    )

    const VALID_KEYS = ['filter', 'page']

    VALID_KEYS.forEach((key) => {
      if (windowData[key]) {
        this[key] = windowData[key]
      }
    })

    const tickersData = localStorage.getItem('cryptonomicon-list')

    if (tickersData) {
      this.tickers = JSON.parse(tickersData)
      this.tickers.forEach((ticker) => {
        subscribeToTicker(ticker.name, (newPrice) =>
          this.updateTicker(ticker.name, newPrice),
        )
      })
    }

    try {
      //маунтим при создании глав. компонента
      this.coinList = await loadAllCoins()
    } catch {
      console.log('Монеты не пришли')
    }
  },

  methods: {
    updateGraph(newGraph) {
      this.graph = newGraph
    },

    //Форматируем цену в правильный формат
    formattedPrice(ticker, price) {
      if (price === '-') {
        ticker.isAvailable = false
        return price
      }
      ticker.isAvailable = true
      return price > 1 ? price.toFixed(2) : price.toPrecision(2)
    },

    updateTicker(tickerName, price) {
      this.tickers
        .filter((ticker) => ticker.name === tickerName)
        .forEach((ticker) => {
          if (ticker === this.selectedTicker) {
            this.graph.push(price)
          }

          ticker.price = price
        })
    },

    //добавляем ticker и получаем его данные
    ToaddTicker(ticker) {
      if (ticker.trim()) {
        const currentTicker = {
          name: ticker.toUpperCase(),
          price: '-',
          isAvailable: false,
        }

        this.tickers = [...this.tickers, currentTicker]

        subscribeToTicker(currentTicker.name, (newPrice) =>
          this.updateTicker(currentTicker.name, newPrice),
        )
      }
    },

    //удаляем добавленный ticker
    deleteTicker(removeTicker) {
      this.tickers = this.tickers.filter((item) => item !== removeTicker)

      if (this.selectedTicker === removeTicker) {
        this.selectedTicker = null
      }

      unsubscribeFromTicker(removeTicker)
    },

    //выбранный ticker
    select(ticker) {
      this.selectedTicker = ticker
    },
  },
}
</script>

<style></style>

<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700">
          Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            id="wallet"
            v-model="ticker"
            type="text"
            name="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
            @keyup.enter="addFromField(ticker)"
            @input="onFieldInput"
          />
        </div>
        <div
          v-if="coinMarker.length"
          class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
          <span
            v-for="tip of coinMarker"
            :key="tip.Symbol"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
            @click="onTipClick(tip.Symbol)"
          >
            {{ tip.Symbol }}
          </span>
        </div>

        <div v-if="includeTicker" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <AddButton @click="addFromField(ticker)" />
  </section>
</template>

<script>
import AddButton from './AddButton.vue'

export default {
  components: {
    AddButton,
  },

  props: {
    tickers: {
      type: Array,
      required: true,
    },

    coinList: {
      type: Array,
      required: true,
    },
  },

  emits: {
    'add-ticker': (value) => typeof value === 'string' && value.length > 0,
  },

  data() {
    return {
      ticker: '',
      coinMarker: [],
      includeTicker: false,
    }
  },

  methods: {
    //добавляем при нажатии tip (подсказка из фильтра)
    onTipClick(ticker) {
      if (!this.checkIsAddedTicker(ticker)) {
        this.includeTicker = false
        this.add(ticker)
      } else {
        this.includeTicker = true
        this.ticker = ticker
      }
    },

    //Проверяем, если надпись в поле схожа с монетами из CoinList, тогда отфильтровываем первые 4 и выводим их снизу поля.
    onFieldInput() {
      this.includeTicker = false

      if (this.ticker) {
        this.coinMarker = this.coinList
          .filter((coin) =>
            coin.Symbol.toUpperCase().includes(
              this.ticker.toUpperCase().trim(),
            ),
          )
          .slice(0, 4)
      } else {
        this.coinMarker = []
      }
    },

    //проверка на добавленый ticker (валидация)
    checkIsAddedTicker(currentTicker) {
      return this.tickers.some(
        (ticker) => ticker.name.toLowerCase() === currentTicker.toLowerCase(),
      )
    },

    addFromField(ticker) {
      if (!this.checkIsAddedTicker(ticker)) {
        this.includeTicker = false
        this.add(ticker)
      } else {
        this.includeTicker = true
      }
    },

    //добавляем ticker и получаем его данные
    add(ticker) {
      this.$emit('add-ticker', ticker)
      this.ticker = ''
      this.coinMarker = []
    },
  },
}
</script>

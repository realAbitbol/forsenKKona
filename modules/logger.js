export class Logger {
  static #MIN_LOG_LEVEL = 'INFO'
  static SHOW_TIMESTAMPS = true

  static #color_reset = '\x1b[0m'
  static #color_dim = '\x1b[2m'
  static #color_red = '\x1b[31m'
  static #color_yellow = '\x1b[33m'
  static #color_cyan = '\x1b[36m'
  static #color_gray = '\x1b[90m'
  static #color_timestamp = `${this.#color_dim + this.#color_gray}`
  static #LOGLEVELS = [{ level: ' DEBUG ', color: `${this.#color_gray}` }, { level: ' INFO  ', color: `${this.#color_cyan}` }, { level: 'WARNING', color: `${this.#color_yellow}` }, { level: ' ERROR ', color: `${this.#color_red}` }]

  static log (logLevel, logMessage) {
    const levelIndex = this.#LOGLEVELS.findIndex((el) => el.level.trim() === logLevel)
    const level = this.#LOGLEVELS.find((el) => el.level.trim() === logLevel)

    if (level && levelIndex >= this.#LOGLEVELS.findIndex((el) => el.level.trim() === this.MIN_LOG_LEVEL)) {
      console.log((this.SHOW_TIMESTAMPS ? this.#colorText(`[ ${this.#getTimestamp()} ] - `, this.#color_timestamp) : '') + `[ ${this.#colorText(level.level, level.color)} ] - ${logMessage}`)
    }
  }

  static set MIN_LOG_LEVEL (logLevel) {
    const level = this.#LOGLEVELS.find((el) => el.level.trim() === logLevel.toUpperCase().trim())
    if (level === undefined) {
      console.log(`[  ${this.#color_red}ERROR${this.#color_reset}  ] - Invalid loglevel '${logLevel}' (DEBUG,INFO,WARN,ERROR). Assuming INFO instead.`)
      this.#MIN_LOG_LEVEL = 'INFO'
    } else this.#MIN_LOG_LEVEL = level.level.trim()
  }

  static get MIN_LOG_LEVEL () {
    return this.#MIN_LOG_LEVEL
  }

  static #getTimestamp () {
    const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s)
    const d = new Date()
    return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  static #colorText (text, color) {
    return color + text + this.#color_reset
  }
}

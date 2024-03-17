const ringBufferMessagesSize = 100
let idTimeoutSpam
let idTimeoutPyramid
let idTimeoutBotCancer
let settings
let ringBufferMessages
let currentBufferIndex = -1

$(() => {
  loadFromLocalStorage()
  refreshDisplay()

  $(window).on('unload', saveToLocalStorage)

  $('#togMessageSpam').on('change', (event) => {
    clearTimeout(idTimeoutSpam)
    if ($(event.currentTarget).prop('checked')) {
      command('enable', 'spam', $('#inputMessage').val())
      $('#inputMessage').prop('disabled', true)
      $('#dropdownMessagePresets').prop('disabled', true)
      $('#btnMessageAction').prop('disabled', true)
      idTimeoutSpam = setTimeout(() => $('#togMessageSpam').bootstrapToggle('off'), settings.maxSpamTime)
      ringBufferMessages.push($('#inputMessage').val().trim())
      currentBufferIndex = -1
    } else {
      command('disable', 'spam')
      $('#inputMessage').prop('disabled', false)
      $('#dropdownMessagePresets').prop('disabled', false)
      $('#btnMessageAction').prop('disabled', false)
    }
  })

  $('#inputMessage').on('input', () => {
    if ($('#inputMessage').val().trim().length === 0) {
      $('#btnMessageAction').prop('disabled', true)
      $('#togMessageSpam').prop('disabled', true)
      $('#togMessageSpam').bootstrapToggle('disable')
    } else {
      $('#btnMessageAction').prop('disabled', false)
      $('#togMessageSpam').prop('disabled', false)
      $('#togMessageSpam').bootstrapToggle('enable')
    }
  })

  $('#inputMessage').on('keyup', (event) => {
    event.preventDefault()
    if (event.key === 'ArrowUp') {
      currentBufferIndex = betterModulo(currentBufferIndex - 1, ringBufferMessages.length())
    } else if (event.key === 'ArrowDown') {
      currentBufferIndex = betterModulo(currentBufferIndex + 1, ringBufferMessages.length())
    } else return

    $('#inputMessage').val(ringBufferMessages.get(currentBufferIndex) ?? '')
  })

  $('#inputPyramidEmote').on('input', checkPyramid)
  $('#inputPyramidSize').on('input', checkPyramid)

  $('#togPyramid').on('change', (event) => {
    clearTimeout(idTimeoutPyramid)
    if ($(event.currentTarget).prop('checked')) {
      command('enable', 'pyramid', `${$('#inputPyramidEmote').val().trim()} ${$('#inputPyramidSize').val()}`)
      idTimeoutPyramid = setTimeout(() => $('#togPyramid').bootstrapToggle('off'), settings.maxSpamTime)
      $('#inputPyramidEmote').prop('disabled', true)
      $('#inputPyramidSize').prop('disabled', true)
      $('#dropdownPyramidPresets').prop('disabled', true)
    } else {
      command('disable', 'pyramid')
      $('#inputPyramidEmote').prop('disabled', false)
      $('#inputPyramidSize').prop('disabled', false)
      $('#dropdownPyramidPresets').prop('disabled', false)
    }
  })

  $('#dropdownMessagePresets').on('hide.bs.dropdown', ({ clickEvent }) => {
    if (clickEvent?.target && clickEvent.target.closest('ul')?.id === 'dropdownMessagePresetsMenu') {
      $('#inputMessage').val(getSpamText($(clickEvent.target).text()))
      $('#inputMessage').trigger('input')
    }
  })

  $('#dropdownFarm').on('hide.bs.dropdown', ({ clickEvent }) => {
    if (clickEvent?.target && clickEvent.target.closest('ul')?.id === 'dropdownFarmMenu') {
      command('farm', undefined, $(clickEvent.target).text())
    }
  })

  $('#dropdownMessageAction').on('hide.bs.dropdown', ({ clickEvent }) => {
    if (clickEvent?.target && clickEvent.target.closest('ul')?.id === 'dropdownMessageActionMenu') {
      settings.sayMode = findSayMode($(clickEvent.target).text())
      setBtnMessageMode(settings.sayMode)
      command('saymode', undefined, settings.sayMode)
    }
  })

  $('#dropdownPyramidPresets').on('hide.bs.dropdown', ({ clickEvent }) => {
    if (clickEvent?.target && clickEvent.target.closest('ul')?.id === 'dropdownPyramidPresetsMenu') {
      $('#inputPyramidEmote').val($(clickEvent.target).text())
    }
  })

  $('#selectIdentity').on('change', (event) => {
    command('idchange', undefined, $(event.currentTarget).val())
  })

  $('#togMultifact').on('change', (event) => {
    if ($(event.currentTarget).prop('checked')) command('enable', 'multifact')
    else command('disable', 'multifact')
  })

  $('#togChaintrivia').on('change', (event) => {
    if ($(event.currentTarget).prop('checked')) command('enable', 'chaintrivia')
    else command('disable', 'chaintrivia')
  })

  $('#togBotCancer').on('change', (event) => {
    clearTimeout(idTimeoutBotCancer)
    if ($(event.currentTarget).prop('checked')) {
      command('enable', 'botcancer')
      idTimeoutBotCancer = setTimeout(() => $('#togBotCancer').bootstrapToggle('off'), settings.maxSpamTime)
    } else command('disable', 'botcancer')
  })

  $('#togTriviaStopper').on('change', (event) => {
    if ($(event.currentTarget).prop('checked')) command('enable', 'stoptrivia')
    else command('disable', 'stoptrivia')
  })

  $('#togEcho').on('change', (event) => {
    if ($(event.currentTarget).prop('checked')) command('enable', 'echo')
    else command('disable', 'echo')
  })

  $('#togAssistant').on('change', (event) => {
    if ($(event.currentTarget).prop('checked')) command('enable', 'assistant')
    else command('disable', 'assistant')
  })

  $('#togColorChanger').on('change', (event) => {
    if ($(event.currentTarget).prop('checked')) command('enable', 'colorchanger')
    else command('disable', 'colorchanger')
  })

  $('#togDebug').on('change', (event) => {
    if ($(event.currentTarget).prop('checked')) command('enable', 'debug')
    else command('disable', 'debug')
  })

  $('#messageForm').on('submit', (event) => {
    event.preventDefault()
    ringBufferMessages.push($('#inputMessage').val().trim())
    currentBufferIndex = -1
    command('say', undefined, $('#inputMessage').val().trim())
  })

  $('#btnSingleFact').on('click', () => {
    command('singlefact')
  })

  $('#btnSingleTrivia').on('click', () => {
    command('singletrivia')
  })

  $('#btnDisableAll').on('click', () => {
    command('disable', 'all')
    refreshDisplay()
  })

  $('#btnClearMessage').on('click', () => {
    if (!$('#inputMessage').prop('disabled')) {
      $('#inputMessage').val('')
      $('#inputMessage').trigger('input')
      $('#inputMessage').trigger('focus')
      currentBufferIndex = -1
    }
  })

  $('#btnCoffee').on('click', () => {
    window.open('https://www.buymeacoffee.com/abitbol', '_blank').focus()
  })

  $('#btnPlsDonaldTrump').on('click', () => {
    command('plsdonaldtrump')
  })

  $('#imgBanner').on('click', () => {
    window.open('https://www.twitch.tv/forsen', '_blank').focus()
  })
})

async function refreshDisplay () {
  settings = await getSettings()
  $('#togMultifact').bootstrapToggle(settings.isMultifactActive ? 'on' : 'off', true)
  $('#togMessageSpam').bootstrapToggle(settings.isSpamActive ? 'on' : 'off', true)
  $('#togChaintrivia').bootstrapToggle(settings.isChainTriviaActive ? 'on' : 'off', true)
  $('#togTriviaStopper').bootstrapToggle(settings.isStopTriviaActive ? 'on' : 'off', true)
  $('#togBotCancer').bootstrapToggle(settings.isBotCancerActive ? 'on' : 'off', true)
  $('#togEcho').bootstrapToggle(settings.isEchoActive ? 'on' : 'off', true)
  $('#togPyramid').bootstrapToggle(settings.isPyramidActive ? 'on' : 'off', true)
  $('#togAssistant').bootstrapToggle(settings.isAssistantActive ? 'on' : 'off', true)
  $('#togColorChanger').bootstrapToggle(settings.isColorChangerActive ? 'on' : 'off', true)
  if (!settings.isColorChangerAvailable) $('#togColorChanger').bootstrapToggle('disable')
  $('#togDebug').bootstrapToggle(settings.isDebugActive ? 'on' : 'off', true)

  fillSelect($('#selectIdentity'), settings.usernames)
  $('#selectIdentity').val(settings.currentIdentity)

  $('#inputPyramidEmote').val(settings.pyramidEmote)
  $('#inputPyramidSize').val(settings.pyramidWidth)

  fillDropdown($('#dropdownFarmMenu'), settings.usernames)
  fillDropdown($('#dropdownMessagePresetsMenu'), settings.spamPresets.map((el) => el.id))
  fillDropdown($('#dropdownPyramidPresetsMenu'), settings.pyramidEmotePresets)

  $('#spamPresetsSelect').find('option').remove().end()
  $('#spamPresetsSelect').append($('<option>', { text: 'Choose...' }).prop('selected', true))
  for (const spam of settings.spamPresets) {
    $('#spamPresetsSelect').append($('<option>', { value: spam.preset, text: spam.id }))
  }
  $('#inputMessage').trigger('input')
  setBtnMessageMode(settings.sayMode)
}

function fillSelect (select, elems) {
  select.find('option').remove().end()
  for (const elem of elems) {
    if (typeof elem === 'string') select.append(new Option(elem, elem))
    else select.append(new Option(elem.text, elem.value))
  }
}

function fillDropdown (dropdown, elems) {
  dropdown.empty()
  for (const elem of elems) {
    dropdown.append(`<li><a class="dropdown-item" href="#">${elem}</a></li>`)
  }
}

function setBtnMessageMode (sayMode) {
  switch (sayMode) {
    case 'ai':
      $('#btnMessageAction').val('Ask AI 🤖')
      $('#btnMessageAction').removeClass('btn-warning btn-info btn-primary')
      $('#btnMessageAction').addClass('btn-info')
      $('#dropdownMessageAction').removeClass('btn-warning btn-info btn-primary')
      $('#dropdownMessageAction').addClass('btn-info')
      $('#inputMessage').removeClass('border-warning')
      $('#inputMessage').addClass('border-info')
      $('#btnClearMessage').removeClass('border-warning')
      $('#btnClearMessage').addClass('border-info')
      $('#dropdownMessagePresets').removeClass('border-warning')
      $('#dropdownMessagePresets').addClass('border-info')
      break
    case 'action':
      $('#btnMessageAction').val('Action 💭')
      $('#btnMessageAction').removeClass('btn-warning btn-info btn-primary')
      $('#btnMessageAction').addClass('btn-warning')
      $('#dropdownMessageAction').removeClass('btn-warning btn-info btn-primary')
      $('#dropdownMessageAction').addClass('btn-warning')
      $('#inputMessage').removeClass('border-info')
      $('#inputMessage').addClass('border-warning')
      $('#btnClearMessage').removeClass('border-info')
      $('#btnClearMessage').addClass('border-warning')
      $('#dropdownMessagePresets').removeClass('border-info')
      $('#dropdownMessagePresets').addClass('border-warning')
      break
    case 'say':
    default:
      $('#btnMessageAction').val('Say 💬')
      $('#btnMessageAction').removeClass('btn-warning btn-info btn-primary')
      $('#btnMessageAction').addClass('btn-primary')
      $('#dropdownMessageAction').removeClass('btn-warning btn-info btn-primary')
      $('#dropdownMessageAction').addClass('btn-primary')
      $('#inputMessage').removeClass('border-warning')
      $('#inputMessage').removeClass('border-info')
      $('#btnClearMessage').removeClass('border-warning')
      $('#btnClearMessage').removeClass('border-info')
      $('#dropdownMessagePresets').removeClass('border-warning')
      $('#dropdownMessagePresets').removeClass('border-info')
  }
}

function checkPyramid () {
  $('#togPyramid').bootstrapToggle($('#inputPyramidEmote').val().trim().length > 0 && /\d+/.test($('#inputPyramidSize').val()) ? 'enable' : 'disable')
}

function findSayMode (buttonText) {
  switch (buttonText) {
    case 'Ask AI 🤖':
      return 'ai'
    case 'Action 💭':
      return 'action'
    case 'Say 💬':
    default:
      return 'say'
  }
}

async function getSettings () {
  return await command('getsettings')
}

function getSpamText (id) {
  return settings.spamPresets.find((el) => el.id === id).preset
}

async function command (command, target, arg) {
  const response = await fetch('/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, target, arg })
  })
  const jsonData = await response.json()
  return jsonData
}

function saveToLocalStorage () {
  localStorage.setItem('ringBufferMessages', ringBufferMessages?.toJson())
  localStorage.setItem('idTimeoutSpam', JSON.stringify(idTimeoutSpam))
  localStorage.setItem('idTimeoutPyramid', JSON.stringify(idTimeoutPyramid))
  localStorage.setItem('idTimeoutBotCancer', JSON.stringify(idTimeoutBotCancer))
}

function loadFromLocalStorage () {
  try {
    ringBufferMessages = new RingBuffer(ringBufferMessagesSize)
    ringBufferMessages.fromJson(localStorage.getItem('ringBufferMessages'))
  } catch (err) {
    ringBufferMessages = new RingBuffer(ringBufferMessagesSize)
  }
  idTimeoutSpam = Number(localStorage.getItem('idTimeoutSpam'))
  idTimeoutPyramid = Number(localStorage.getItem('idTimeoutPyramid'))
  idTimeoutBotCancer = Number(localStorage.getItem('idTimeoutBotCancer'))
}

function betterModulo (a, b) {
  return ((a % b) + b) % b
}

class RingBuffer {
  #array
  #nextPointer
  #maxSize
  #size

  constructor (maxSize) {
    this.#maxSize = maxSize
    this.#array = new Array(maxSize)
    this.#nextPointer = 0
    this.#size = 0
  }

  push (el) { // FIXME: remove older duplicates of el when inserting
    this.#array[this.#nextPointer] = el
    this.#nextPointer = (this.#nextPointer + 1) % this.#maxSize
    if (this.#size < this.#maxSize) this.#size++
  }

  get (index) {
    return this.#array[betterModulo(this.#nextPointer - 1 - index, this.#size)]
  }

  length () {
    return this.#size
  }

  fromJson (jsonData) {
    ({ array: this.#array = [], nextPointer: this.#nextPointer = 0, maxSize: this.#maxSize = 0, size: this.#size = 0 } = JSON.parse(jsonData))
  }

  toJson () {
    return JSON.stringify({ array: this.#array, nextPointer: this.#nextPointer, maxSize: this.#maxSize, size: this.#size })
  }
}

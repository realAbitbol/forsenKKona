const ringBufferMessagesSize = 100
let idTimeoutSpam
let idTimeoutPyramid
let idTimeoutBotCancer
let settings
let ringBufferMessages
let currentBufferIndex = -1
const personalityTopics = ['top', 'hobbies', 'likes', 'dislikes', 'dream', 'nightmare', 'emotes', 'secret', 'crush', 'spirit', 'emote', 'pol', 'Gayge', 'future', 'joke', 'song', 'darkmemory', 'darksecret', 'memory', 'trouble', 'score', 'data', 'task', 'impostor', 'turnon', 'resolution', 'verse', 'darkfuture', 'fashionadvice', 'job', 'regret', 'analyze', 'figure']

$(() => {
  loadFromLocalStorage()
  refreshDisplay()

  $(window).on('unload', saveToLocalStorage)

  $('#togMessageSpam').on('change', (event) => {
    clearTimeout(idTimeoutSpam)
    if ($(event.currentTarget).prop('checked')) {
      command('enable', 'spam', $('#inputMessage').val())
      idTimeoutSpam = setTimeout(() => $('#togMessageSpam').bootstrapToggle('off'), settings.maxSpamTime)
      ringBufferMessages.push($('#inputMessage').val().trim())
      currentBufferIndex = -1
    } else {
      command('disable', 'spam')
    }
    setMessageDisableState()
  })

  $('#selectSpamSpeed').on('change', (event) => {
    command('spamspeed', undefined, $(event.currentTarget).val())
  })

  $('#inputMessage').on('input', () => {
    const text = $('#inputMessage').val().trim()
    const size = utf8StringSize(text)

    if (size > 200) $('#spanMessageSize').addClass('text-warning')
    else $('#spanMessageSize').removeClass('text-warning')

    if (text.length === 0) {
      $('#btnMessageAction').prop('disabled', true)
      $('#togMessageSpam').prop('disabled', true)
      $('#togMessageSpam').bootstrapToggle('disable')
      $('#spanMessageSize').text(0)
    } else if (text.startsWith('clearhistory')) {
      $('#inputMessage').val('')
      ringBufferMessages = new RingBuffer(ringBufferMessagesSize)
      $('#spanMessageSize').text(0)
    } else {
      $('#btnMessageAction').prop('disabled', false)
      $('#togMessageSpam').prop('disabled', false)
      $('#togMessageSpam').bootstrapToggle('enable')
      $('#spanMessageSize').text(size)
    }
  })

  $('#inputMessage').on('keyup', (event) => {
    event.preventDefault()
    if (event.key === 'ArrowUp') currentBufferIndex++
    else if (event.key === 'ArrowDown') currentBufferIndex--
    else return

    $('#inputMessage').val(ringBufferMessages.get(currentBufferIndex) ?? '')
  })

  $('#inputPyramidEmote').on('input', checkPyramid)
  $('#inputPyramidSize').on('input', checkPyramid)

  $('#togPyramid').on('change', (event) => {
    clearTimeout(idTimeoutPyramid)
    if ($(event.currentTarget).prop('checked')) {
      command('enable', 'pyramid', `${$('#inputPyramidEmote').val().trim()} ${$('#inputPyramidSize').val()}`)
      idTimeoutPyramid = setTimeout(() => $('#togPyramid').bootstrapToggle('off'), settings.maxSpamTime)
    } else {
      command('disable', 'pyramid')
    }
    setPyramidDisableState()
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

  $('#dropdownPersonality').on('hide.bs.dropdown', ({ clickEvent }) => {
    if (clickEvent?.target && clickEvent.target.closest('ul')?.id === 'dropdownPersonalityMenu') {
      command('say', undefined, '>personality ' + $(clickEvent.target).text())
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

  $('#selectLogLevel').on('change', () => {
    changeLogSettings()
  })

  $('#checkboxLogTimestamps').on('change', () => {
    changeLogSettings()
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
  $('#selectSpamSpeed').val(settings.spamSpeed)

  fillDropdown($('#dropdownFarmMenu'), settings.usernames)
  fillDropdown($('#dropdownMessagePresetsMenu'), settings.spamPresets.map((el) => el.id))
  fillDropdown($('#dropdownPyramidPresetsMenu'), settings.pyramidEmotePresets)
  fillDropdown($('#dropdownPersonalityMenu'), personalityTopics)

  $('#spamPresetsSelect').find('option').remove().end()
  $('#spamPresetsSelect').append($('<option>', { text: 'Choose...' }).prop('selected', true))
  for (const spam of settings.spamPresets) {
    $('#spamPresetsSelect').append($('<option>', { value: spam.preset, text: spam.id }))
  }
  $('#inputMessage').trigger('input')
  $('#selectLogLevel').val(settings.logLevel)
  $('#checkboxLogTimestamps').prop('checked', settings.logShowTimestamps)
  setBtnMessageMode(settings.sayMode)
  setPyramidDisableState()
  setMessageDisableState()
}

function changeLogSettings () {
  command('logsettings', $('#selectLogLevel').val(), String($('#checkboxLogTimestamps').prop('checked')))
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

function setMessageDisableState () {
  const state = $('#togMessageSpam').prop('checked')
  $('#inputMessage').prop('disabled', state)
  $('#dropdownMessagePresets').prop('disabled', state)
  $('#btnMessageAction').prop('disabled', state)
}

function setPyramidDisableState () {
  const state = $('#togPyramid').prop('checked')
  $('#inputPyramidEmote').prop('disabled', state)
  $('#inputPyramidSize').prop('disabled', state)
  $('#dropdownPyramidPresets').prop('disabled', state)
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
  localStorage.setItem('currentMessage', JSON.stringify($('#inputMessage').val()))
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
  if (localStorage.getItem('currentMessage')) $('#inputMessage').val(JSON.parse(localStorage.getItem('currentMessage')))
  else $('#inputMessage').val('')
}

function utf8StringSize (str) {
  return [...str].length
}

class RingBuffer {
  #array
  #maxSize

  constructor (maxSize) {
    this.#maxSize = maxSize
    this.#array = []
  }

  push (el) {
    this.#array = this.#array.filter((e) => e !== el) // Remove duplicates
    if (this.#array.length === this.#maxSize) this.#array.shift()
    this.#array.push(el)
  }

  get (index) {
    return this.#array[((this.#array.length - 1 - index) % this.#array.length + this.#array.length) % this.#array.length]
  }

  get length () {
    return this.#array.length
  }

  fromJson (jsonData) {
    ({ array: this.#array = [], maxSize: this.#maxSize = 0 } = JSON.parse(jsonData))
  }

  toJson () {
    return JSON.stringify({ array: this.#array, maxSize: this.#maxSize })
  }
}

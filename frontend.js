let idTimeoutSpam
let idTimeoutPyramid
let idTimeoutBotCancer
let settings

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

document.addEventListener('DOMContentLoaded', () => {
  refreshDisplay()
})

$('#togMessageSpam').on('change', async function (event) {
  clearTimeout(idTimeoutSpam)
  if ($(this).prop('checked')) {
    command('enable', 'spam', $('#inputMessage').val())
    $('#inputMessage').prop('disabled', true)
    $('#dropdownMessagePresets').prop('disabled', true)
    $('#btnMessageAction').prop('disabled', true)
    idTimeoutSpam = setTimeout(() => $('#togMessageSpam').bootstrapToggle('off'), settings.maxSpamTime)
  } else {
    command('disable', 'spam')
    $('#inputMessage').prop('disabled', false)
    $('#dropdownMessagePresets').prop('disabled', false)
    $('#btnMessageAction').prop('disabled', false)
  }
})

$('#inputMessage').on('input', async function (event) {
  if ($(this).val().trim().length === 0) {
    $('#btnMessageAction').prop('disabled', true)
    $('#togMessageSpam').prop('disabled', true)
    $('#togMessageSpam').bootstrapToggle('disable')
  } else {
    $('#btnMessageAction').prop('disabled', false)
    $('#togMessageSpam').prop('disabled', false)
    $('#togMessageSpam').bootstrapToggle('enable')
  }
})

$('#inputPyramidEmote').on('input', checkPyramid)
$('#inputPyramidSize').on('input', checkPyramid)

$('#togPyramid').on('change', async function (event) {
  clearTimeout(idTimeoutPyramid)
  if ($(this).prop('checked')) {
    command('enable', 'pyramid', `${$('#inputPyramidEmote').val()} ${$('#inputPyramidSize').val()}`)
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

$('#selectIdentity').on('change', async function (event) {
  command('idchange', undefined, $(this).val())
})

$('#togMultifact').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'multifact')
  else command('disable', 'multifact')
})

$('#togChaintrivia').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'chaintrivia')
  else command('disable', 'chaintrivia')
})

$('#togBotCancer').on('change', async function (event) {
  clearTimeout(idTimeoutBotCancer)
  if ($(this).prop('checked')) {
    command('enable', 'botcancer')
    idTimeoutBotCancer = setTimeout(() => $('#togBotCancer').bootstrapToggle('off'), settings.maxSpamTime)
  } else command('disable', 'botcancer')
})

$('#togTriviaStopper').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'stoptrivia')
  else command('disable', 'stoptrivia')
})

$('#togEcho').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'echo')
  else command('disable', 'echo')
})

$('#togAssistant').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'assistant')
  else command('disable', 'assistant')
})

$('#togColorChanger').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'colorchanger')
  else command('disable', 'colorchanger')
})

$('#togDebug').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'debug')
  else command('disable', 'debug')
})

$('#messageForm').on('submit', async function (event) {
  event.preventDefault()
  command('say', undefined, $('#inputMessage').val())
})

$('#btnSingleFact').on('click', async function (event) {
  command('singlefact')
})

$('#btnSingleTrivia').on('click', async function (event) {
  command('singletrivia')
})

$('#btnDisableAll').on('click', async function (event) {
  command('disable', 'all')
  refreshDisplay()
})

$('#btnClearMessage').on('click', async function (event) {
  if (!$('#inputMessage').prop('disabled')) {
    $('#inputMessage').val('')
    $('#inputMessage').trigger('input')
  }
})

$('#btnCoffee').on('click', async function (event) {
  window.open('https://www.buymeacoffee.com/abitbol', '_blank').focus()
})

$('#btnPlsDonaldTrump').on('click', async function (event) {
  command('plsdonaldtrump')
})

$('#imgBanner').on('click', async function (event) {
  window.open('https://www.twitch.tv/forsen', '_blank').focus()
})

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
  }
}

function checkPyramid () {
  $('#togPyramid').bootstrapToggle($('#inputPyramidEmote').val().length > 0 && /\d+/.test($('#inputPyramidSize').val()) ? 'enable' : 'disable')
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

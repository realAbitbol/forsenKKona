async function refreshDisplay () {
  const settings = await getSettings()
  $('#togMultifact').bootstrapToggle(settings.isMultifactActive ? 'on' : 'off', true)
  $('#togSpam').bootstrapToggle(settings.isSpamActive ? 'on' : 'off', true)
  $('#togChaintrivia').bootstrapToggle(settings.isChainTriviaActive ? 'on' : 'off', true)
  $('#togEshrug').bootstrapToggle(settings.isEshrugActive ? 'on' : 'off', true)
  $('#togXd').bootstrapToggle(settings.isXdActive ? 'on' : 'off', true)
  $('#togStopTrivia').bootstrapToggle(settings.isStopTriviaActive ? 'on' : 'off', true)
  $('#togEcho').bootstrapToggle(settings.isEchoActive ? 'on' : 'off', true)
  $('#togSpam').bootstrapToggle(settings.isSpamActive ? 'on' : 'off', true)
  $('#togPyramid').bootstrapToggle(settings.isPyramidActive ? 'on' : 'off', true)
  $('#togAssistant').bootstrapToggle(settings.isAssistantActive ? 'on' : 'off', true)
  $('#togDebug').bootstrapToggle(settings.isDebugActive ? 'on' : 'off', true)
  $('#spam').val(settings.spamContent)

  const selects = [$('#identityMessage'), $('#identityFarm'), $('#assistantSelect'), $('#factsAndFucksSelect'), $('#triviasSelect'), $('#eshrugsSelect'), $('#xdsSelect'), $('#spamSelect'), $('#pyramidSelect'), $('#echoeeSelect')]
  clearSelects(selects)
  for (const username of settings.usernames) {
    for (const select of selects) {
      select.append($('<option>', { value: username, text: username }))
    }
  }
  $('#triviasSelect').val(settings.chainTriviaIdentity)
  $('#assistantSelect').val(settings.assistantIdentity)
  $('#echoeeSelect').val(settings.echoeeIdentity)

  $('#pyramidEmote').val(settings.pyramidEmote)
  $('#pyramidWidth').val(settings.pyramidWidth)

  $('#spamPresetsSelect').find('option').remove().end()
  $('#spamPresetsSelect').append($('<option>', { text: 'Choose...' }).prop('selected', true))
  for (const spam of settings.spamPresets) {
    $('#spamPresetsSelect').append($('<option>', { value: spam.preset, text: spam.id }))
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refreshDisplay()
})

$('#togSpam').on('change', async function (event) {
  if ($(this).prop('checked')) {
    command('enable', 'spam', $('#spamSelect').val())
    setTimeout(function () { $('#togSpam').bootstrapToggle('off') }, 300000)
  } else { command('disable', 'spam') }
})

$('#togPyramid').on('change', async function (event) {
  if ($(this).prop('checked')) {
    command('enable', 'pyramid', $('#pyramidSelect').val())
    setTimeout(function () { $('#togPyramid').bootstrapToggle('off') }, 300000)
  } else { command('disable', 'pyramid') }
})

$('#spamPresetsSelect').on('change', async function (event) {
  if ($(this).val() !== '') {
    $('#spam').val($(this).val())
    command('setspamcontent', undefined, undefined, $(this).val())
    $(this).prop('selectedIndex', 0)
  }
})

$('#togMultifact').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'multifact', $('#factsAndFucksSelect').val())
  else command('disable', 'multifact')
})

$('#togChaintrivia').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'chaintrivia', $('#triviasSelect').val())
  else command('disable', 'chaintrivia')
})

$('#togEshrug').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'eshrug', $('#eshrugsSelect').val())
  else command('disable', 'eshrug')
})

$('#togXd').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'xd', $('#xdsSelect').val())
  else command('disable', 'xd')
})

$('#togStopTrivia').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'stoptrivia')
  else command('disable', 'stoptrivia')
})

$('#togEcho').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'echo', $('#echoeeSelect').val())
  else command('disable', 'echo')
})

$('#togAssistant').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'assistant', $('#assistantSelect').val())
  else command('disable', 'assistant')
})

$('#togDebug').on('change', async function (event) {
  if ($(this).prop('checked')) command('enable', 'debug')
  else command('disable', 'debug')
})

$('#aiForm').on('submit', async function (event) {
  event.preventDefault()
  command('aiprompt', undefined, $('#assistantSelect').val(), $('#prompt').val())
})

$('#messageForm').on('submit', async function (event) {
  event.preventDefault()
  command('say', undefined, $('#identityMessage').val(), $('#message').val())
})

$('#farmForm').on('submit', async function (event) {
  event.preventDefault()
  command('farm', undefined, $('#identityFarm').val())
})

$('#spamForm').on('submit', async function (event) {
  event.preventDefault()
  command('setspamcontent', undefined, undefined, $('#spam').val())
})

$('#pyraForm').on('submit', async function (event) {
  event.preventDefault()
  command('setpyramidemote', undefined, undefined, $('#pyramidEmote').val())
  command('setpyramidwidth', undefined, undefined, $('#pyramidWidth').val())
})

$('#btnSingleFact').on('click', async function (event) {
  command('singlefact', undefined, $('#factsAndFucksSelect').val())
})

$('#btnSingleTrivia').on('click', async function (event) {
  command('singletrivia', undefined, $('#triviasSelect').val())
})

$('#btnDisableAll').on('click', async function (event) {
  command('disable', 'all')
  refreshDisplay()
})

$('#btnWeebs').on('click', async function (event) {
  command('say', undefined, $('#factsAndFucksSelect').val(), 'pls carpet bomb all weebs Donald Trump forsenRNG')
})

$('#btnElis').on('click', async function (event) {
  command('say', undefined, $('#factsAndFucksSelect').val(), 'pls waterboard all elis subs Donald Trump forsenRNG')
})

$('#btnFurries').on('click', async function (event) {
  command('say', undefined, $('#factsAndFucksSelect').val(), 'pls nuke all furries Donald Trump forsenRNG')
})

$('#btnIWould').on('click', async function (event) {
  command('say', undefined, $('#factsAndFucksSelect').val(), '⠀⣿⠀⠀⢸⣇⠀⣿⣇⠀⣿⠀⣶⠛⠛⣷⡀⣿⠀⠀⣿⡇⢸⡇⠀⢸⡟⠛⢷⡄ ⠀⣿⠀⠀⠀⣿⢰⡇⣿⢰⡏⢸⡇⠀⠀⣿⡇⣿⠀⠀⣿⡇⢸⡇⠀⢸⡇⠀⢈⣿ forsenCoomer ⠀⣿⠀⠀⠀⢹⣿⠁⢸⣿⠁⠈⢿⣤⣴⠟⠀⠹⣧⣤⡿⠁⢸⣧⣤⢸⣧⣤⡾⠃')
})

$('#btnCoffee').on('click', async function (event) {
  window.open('https://www.buymeacoffee.com/abitbol', '_blank').focus()
})

$('#imgBanner').on('click', async function (event) {
  window.open('https://www.twitch.tv/forsen', '_blank').focus()
})

$('#triviasSelect').on('change', async function (event) {
  if ($('#togChaintrivia').prop('checked')) $('#togChaintrivia').bootstrapToggle('on')
})

$('#assistantSelect').on('change', async function (event) {
  if ($('#togAssistant').prop('checked')) $('#togAssistant').bootstrapToggle('on')
})

$('#echoeeSelect').on('change', async function (event) {
  if ($('#togEcho').prop('checked')) $('#togEcho').bootstrapToggle('on')
})

function clearSelects (selects) {
  for (const select of selects) {
    select.find('option').remove().end()
  }
}

async function getSettings () {
  return await command('getsettings')
}

async function command (command, target, identity, arg) {
  const response = await fetch('/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, target, identity, arg })
  })
  const jsonData = await response.json()
  return jsonData
}

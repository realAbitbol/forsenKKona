/* eslint-disable no-undef */
/// <reference path="./node_modules/jquery/dist/jquery.min.js" />

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

  $('#identity').find('option').remove().end()
  $('#identityFarm').find('option').remove().end()
  let cpt = 0
  for (const username of settings.usernames) {
    if (cpt === 0) {
      $('#identity').append($('<option>', { value: String(cpt), text: username }).prop('selected', true))
      $('#identityFarm').append($('<option>', { value: String(cpt), text: username }).prop('selected', true))
      cpt++
    } else {
      $('#identity').append($('<option>', { value: String(cpt), text: username }))
      $('#identityFarm').append($('<option>', { value: String(cpt), text: username }))
    }
  }
  $('#pyramidEmote').val(settings.pyramidEmote)
  $('#pyramidWidth').val(settings.pyramidWidth)

  $('#spamSelect').find('option').remove().end()
  $('#spamSelect').append($('<option>', { text: 'Choose...' }).prop('selected', true))
  for (const spam of settings.spamPresets) {
    $('#spamSelect').append($('<option>', { value: spam.preset, text: spam.id }))
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refreshDisplay()
})

$(function () {
  $('#togSpam').change(function () {
    if ($(this).prop('checked')) {
      command('enable spam')
      setTimeout(function () { $('#togSpam').bootstrapToggle('off') }, 300000)
    } else { command('disable spam') }
  })
})

$(function () {
  $('#togPyramid').change(function () {
    if ($(this).prop('checked')) {
      command('enable pyramid')
      setTimeout(function () { $('#togPyramid').bootstrapToggle('off') }, 300000)
    } else { command('disable pyramid') }
  })
})

$(function () {
  $('#spamSelect').change(function () {
    const selectedOption = $('#spamSelect option[value]:selected')
    if (selectedOption.text() !== '') {
      $('#spam').val(selectedOption.val())
      command('setspamcontent ' + selectedOption.val())
      $(this).prop('selectedIndex', 0)
    }
  })
})

$(function () {
  $('#togMultifact').change(function () {
    if ($(this).prop('checked')) { command('enable multifact') } else { command('disable multifact') }
  })
})

$(function () {
  $('#togChaintrivia').change(function () {
    if ($(this).prop('checked')) { command('enable chaintrivia') } else { command('disable chaintrivia') }
  })
})

$(function () {
  $('#togEshrug').change(function () {
    if ($(this).prop('checked')) { command('enable eshrug') } else { command('disable eshrug') }
  })
})

$(function () {
  $('#togXd').change(function () {
    if ($(this).prop('checked')) { command('enable xd') } else { command('disable xd') }
  })
})

$(function () {
  $('#togStopTrivia').change(function () {
    if ($(this).prop('checked')) { command('enable stoptrivia') } else { command('disable stoptrivia') }
  })
})

$(function () {
  $('#togEcho').change(function () {
    if ($(this).prop('checked')) { command('enable echo') } else { command('disable echo') }
  })
})

$(function () {
  $('#togAssistant').change(function () {
    if ($(this).prop('checked')) { command('enable assistant') } else { command('disable assistant') }
  })
})

$(function () {
  $('#togDebug').change(function () {
    if ($(this).prop('checked')) { command('enable debug') } else { command('disable debug') }
  })
})

$('#aiForm').on('submit', async function (event) {
  event.preventDefault()
  command('aiprompt ' + $('#prompt').val())
})

$('#messageForm').on('submit', async function (event) {
  event.preventDefault()
  command('say ' + $('#identity').val() + ' ' + $('#message').val())
})

$('#farmForm').on('submit', async function (event) {
  event.preventDefault()
  command('farm ' + $('#identityFarm').val())
})

$('#spamForm').on('submit', async function (event) {
  event.preventDefault()
  command('setspamcontent ' + $('#spam').val())
})

$('#pyraForm').on('submit', async function (event) {
  event.preventDefault()
  command('setpyramidemote ' + $('#pyramidEmote').val())
  command('setpyramidwidth ' + $('#pyramidWidth').val())
})

async function getSettings () {
  return await command('getsettings')
}

async function command (message) {
  const response = await fetch('/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  const jsonData = await response.json()
  return jsonData
}

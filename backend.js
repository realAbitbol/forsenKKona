import tmi from 'tmi.js'
import OpenAI from 'openai'
import express from 'express'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Logger } from './modules/logger.js'

Logger.MIN_LOG_LEVEL = process.env.LOG_LEVEL ?? 'INFO'
Logger.SHOW_TIMESTAMPS = process.env.LOG_SHOW_TIMESTAMPS === 'true'

// Environment variables
const envVariables = ['IDENTITIES', 'OPENAI_APIKEY', 'OPENAI_BASEURL', 'OPENAI_MODEL', 'TRIVIA_TOPICS', 'FACT_PROMPTS', 'SPAM_PRESETS', 'MAX_AI_RETRIES', 'ASSISTANT_TRIGGER', 'ASSISTANT_ROLE', 'CHATTER_ROLE', 'MAX_MESSAGE_SIZE', 'FACT_PREFIX', 'TIME_SPAM', 'TIME_SECONDS', 'TIME_MINUTES', 'TIME_10MINUTES', 'PLS_TARGETS', 'PLS_VERBS', 'PYRAMID_EMOTE_PRESETS', 'MAX_SPAM_TIME']

// Twitch colors
const colors = ['blue', 'blue_violet', 'cadet_blue', 'chocolate', 'coral', 'dodger_blue', 'firebrick', 'golden_rod', 'green', 'hot_pink', 'orange_red', 'red', 'sea_green', 'spring_green', 'yellow_green']
let isColorChangerAvailable = false

// Bot Cancer
const botCancerArray = shuffleArray(['$$xd', '$fill eShrug', '!2o3a', '!??', '!forsen', '!forsenbajs', '!fancydance', '!brainpower', '!nam', '!picklerick', '!r8', '!rain', '!rules', '!standing', '¿ping', '!losers', '!losers2'])

// Get the directory of the current module
const currentDir = dirname(fileURLToPath(import.meta.url))

envVariablesCheck()

// AI Setup
const openaiOptions = {
  apiKey: String(process.env.OPENAI_APIKEY),
  baseURL: String(process.env.OPENAI_BASEURL)
}
const openaiModel = String(process.env.OPENAI_MODEL)
const openai = new OpenAI(openaiOptions)
const maxAiRetries = Number(process.env.MAX_AI_RETRIES)

// TMI setup
const identities = JSON.parse(String(process.env.IDENTITIES))

// HELIX setup (for Color changer)
const helixClientId = String(process.env?.HELIX_CLIENT_ID)

// Custom topics and prompts
const triviaTopics = JSON.parse(String(process.env.TRIVIA_TOPICS))
const factPrompts = JSON.parse(String(process.env.FACT_PROMPTS))
const spamPresets = JSON.parse(String(process.env.SPAM_PRESETS))
const pyramidEmotePresets = JSON.parse(String(process.env.PYRAMID_EMOTE_PRESETS))
const assistantRole = String(process.env.ASSISTANT_ROLE)
const chatterRole = String(process.env.CHATTER_ROLE)
const assistantTrigger = String(process.env.ASSISTANT_TRIGGER)
const plsTargets = JSON.parse(String(process.env.PLS_TARGETS))
const plsVerbs = JSON.parse(String(process.env.PLS_VERBS))

// Message settings
const maxMessageSize = Number(process.env.MAX_MESSAGE_SIZE)
const factPrefix = String(process.env.FACT_PREFIX)
const duplicateSuffix = '󠀀'

// Timings
const timeSpam = Number(process.env.TIME_SPAM)
const timeSeconds = Number(process.env.TIME_SECONDS)
// eslint-disable-next-line no-unused-vars
const timeMinutes = Number(process.env.TIME_MINUTES)
const time10Minutes = Number(process.env.TIME_10MINUTES)
const maxSpamTime = Number(process.env.MAX_SPAM_TIME)

// Settings
let isMultifactActive = false
let isChainTriviaActive = false
let isBotCancerActive = false
let isSpamActive = false
let isStopTriviaActive = false
let isEchoActive = false
let isPyramidActive = false
let isAssistantActive = false
let isColorChangerActive = false
let sayMode = 'say'
let isDebugActive = false
let spamContent = ''
let pyramidEmote = 'forsenKKona'
let pyramidWidth = 3
let spamSpeed = 1

// Work variables
let currentPyramidWidth = 0
let currentPyramidPhase = true
let currentIdentity = identities[0]
let currentBotCancerIndex = 0
let farmTimeouts = []

// Called every time a new message is posted in the chat
async function onMessageHandler (target, context, msg, self) {
  handleColorChanger(msg, context)
  await handleMessageAssistant(msg, context)
  handleMessageTriviaChainer(context, msg)
  handleMessageTriviaStopper(context, msg)
  handleMessageRaidJoiner(context, msg)
  handleMessageEchoer(context, msg)
}

async function handleColorChanger (msg, context) {
  if (isColorChangerActive && isColorChangerAvailable) {
    const identity = identities.find((id) => id.username === context['display-name'])
    if (identity?.isColorChangerCompatible) await changeColor(identity)
  }
}

function handleMessageTriviaChainer (context, msg) {
  if (context['display-name'] === 'FeelsStrongBot' && (msg === 'trivia ended nam' || msg.includes('Aware Silent, I stand, devoid of questions.'))) {
    if (isChainTriviaActive) { setTimeout(() => doTrivia(), randTime(timeSpam)) }
  }
}

function handleMessageTriviaStopper (context, msg) {
  if (context['display-name'] === 'FeelsStrongBot' && msg.match(/3\/.+Category:/)) {
    if (isStopTriviaActive) {
      Logger.log('INFO', 'Detected the 3rd question of a trivia, stoping.')
      let cpt = 0
      for (const identity of shuffleArray(identities)) {
        setTimeout(() => stopTrivia(identity), randTime(timeSeconds, cpt))
        cpt += 2
      }
    }
  }
}

function handleMessageRaidJoiner (context, msg) {
  if (context['display-name'] === 'DeepDankDungeonBot' && msg.includes('A Raid Event at Level')) {
    Logger.log('INFO', 'Detected a raid, joining.')
    let cpt = 0
    for (const identity of shuffleArray(identities)) {
      setTimeout(() => joinRaid(identity), randTime(timeSeconds, cpt))
      cpt += 2
    }
  }
}

function handleMessageEchoer (context, msg) {
  if (isEchoActive && context['display-name'] === currentIdentity.username) {
    let cpt = 0
    msg = msg.replace(/󠀀/g, '').trim()
    for (const identity of shuffleArray(identities.filter((id) => id.username !== currentIdentity.username))) {
      setTimeout(() => say(identity, msg), randTime(timeSeconds, cpt))
      cpt++
      Logger.log('INFO', `Echoing ${msg} as ${identity.username}`)
    }
  }
}

async function handleMessageAssistant (msg, context) {
  if (msg.startsWith(assistantTrigger + ' ') && isAssistantActive && context['display-name'] !== currentIdentity.username) {
    Logger.log('INFO', `${context['display-name']} talked to me: ${msg}`)
    const response = await getAIResponse(assistantRole, `@${context['display-name']}`, msg.slice(assistantTrigger.length + 1))
    Logger.log('INFO', `I replied: ${response}`)
    say(currentIdentity, response)
  }
}

async function processCommand (message) {
  message.args = message?.arg?.split(' ')
  switch (message.command) {
    case 'say':
      say(currentIdentity, message.arg)
      break
    case 'saymode':
      sayMode = message.arg
      Logger.log('INFO', `Switched message mode to ${sayMode}`)
      break
    case 'logsettings':
      Logger.MIN_LOG_LEVEL = message.target
      Logger.SHOW_TIMESTAMPS = message.arg === 'true'
      Logger.log('WARNING', `Changed the log settings to MIN_LOG_LEVEL=${Logger.MIN_LOG_LEVEL} and SHOW_TIMESTAMPS=${Logger.SHOW_TIMESTAMPS}`)
      break
    case 'idchange':
      currentIdentity = getIdentity(message.arg)
      Logger.log('INFO', `Changed the current identity to ${currentIdentity.username}`)
      break
    case 'spamspeed':
      spamSpeed = Number(message.arg)
      Logger.log('INFO', `Changed the spam interval multiplicator to ${spamSpeed}`)
      break
    case 'disable':
      switch (message.target) {
        case 'multifact':
          isMultifactActive = false
          break
        case 'chaintrivia':
          isChainTriviaActive = false
          break
        case 'spam':
          isSpamActive = false
          spamContent = ''
          break
        case 'botcancer':
          isBotCancerActive = false
          break
        case 'stoptrivia':
          isStopTriviaActive = false
          break
        case 'echo':
          isEchoActive = false
          break
        case 'pyramid':
          isPyramidActive = false
          currentPyramidWidth = 0
          currentPyramidPhase = true
          break
        case 'assistant':
          isAssistantActive = false
          break
        case 'debug':
          isDebugActive = false
          break
        case 'colorchanger':
          isColorChangerActive = false
          resetColors()
          break
        case 'all':
          isMultifactActive = false
          isChainTriviaActive = false
          isSpamActive = false
          sayMode = 'say'
          isBotCancerActive = false
          isStopTriviaActive = false
          isEchoActive = false
          isPyramidActive = false
          isAssistantActive = false
          isColorChangerActive = false
          currentPyramidWidth = 0
          currentPyramidPhase = true
          clearFarmTimeouts()
          break
        default:
          Logger.log('ERROR', `invalid disable target '${message.target}'`)
          return { status: 'KO' }
      }
      Logger.log('INFO', `Disabled ${message.target}`)
      break
    case 'enable':
      switch (message.target) {
        case 'multifact':
          isMultifactActive = true
          multiFact()
          break
        case 'chaintrivia':
          isChainTriviaActive = true
          break
        case 'spam':
          isSpamActive = true
          spamContent = message.arg
          spam()
          break
        case 'pyramid':
          isPyramidActive = true
          pyramidEmote = message.args[0]
          pyramidWidth = Number(message.args[1])
          pyramid()
          break
        case 'botcancer':
          isBotCancerActive = true
          botCancer()
          break
        case 'stoptrivia':
          isStopTriviaActive = true
          break
        case 'echo':
          isEchoActive = true
          break
        case 'assistant':
          isAssistantActive = true
          break
        case 'colorchanger':
          isColorChangerActive = true
          changeColor()
          break
        case 'debug':
          isDebugActive = true
          break
        default:
          Logger.log('ERROR', `invalid enable target '${message.target}'`)
          return { status: 'KO' }
      }
      Logger.log('INFO', `Enabled ${message.target}`)
      break
    case 'singlefact':
      singleFact()
      break
    case 'plsdonaldtrump':
      plsDonaldTrump()
      break
    case 'singletrivia':
      doTrivia()
      break
    case 'aiprompt': {
      say(currentIdentity, message.arg, 'ai')
      break
    }
    case 'farm':
      farm(getIdentity(message.arg))
      break
    case 'getsettings':
      return getSettings()
    default:
      Logger.log('ERROR', `unsupported command '${message}'`)
      return { status: 'KO' }
  }
  return { status: 'OK' }
}

// Starts a trivia
function doTrivia () {
  const topic = randomElement(triviaTopics)
  say(currentIdentity, `>trivia ai ${topic}`)
  Logger.log('INFO', 'Started a trivia')
}

// Gat a response from the AI using the given prompt
async function getAIResponse (role, prefix, prompt) {
  Logger.log('INFO', `[AI] Got prompt: ${smartJoin(role, prompt, ' ')}`)
  let response = ''
  let cpt = 0
  do {
    cpt++
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: `${smartJoin(role, prompt, ' ')}` }],
      model: openaiModel,
      max_tokens: 50,
      temperature: 0.70,
      top_p: 0.95,
      n: 1,
      echo: false,
      stream: false
    })
    response = chatCompletion.choices[0].message.content.replace(/\r?\n/gm, ' ').replace(/(^")|("$)/g, '').replace(/\.$/, '').replace(/^forsenKKona, /, '')
    Logger.log('INFO', `[AI] Generated text: ${response}`)
    response = smartJoin(prefix, response, ' ')
  } while (response.length > maxMessageSize && cpt < maxAiRetries)
  return response.substring(0, maxMessageSize)
}

function botCancer () {
  if (isBotCancerActive) {
    currentBotCancerIndex++
    if (currentBotCancerIndex >= botCancerArray.length) currentBotCancerIndex = 0
    say(currentIdentity, botCancerArray[currentBotCancerIndex], 'say')
    setTimeout(() => botCancer(), randTime(timeSpam))
  }
}

function spam () {
  if (isSpamActive && spamContent.length > 0) {
    say(currentIdentity, spamContent)
    setTimeout(() => spam(), randTime(timeSpam * spamSpeed))
  }
}

function nextPyramidWidth () {
  if (currentPyramidPhase) {
    currentPyramidWidth++
    if (currentPyramidWidth === pyramidWidth) currentPyramidPhase = false
  } else {
    currentPyramidWidth--
    if (currentPyramidWidth === 0) {
      currentPyramidPhase = true
      currentPyramidWidth = 1
    }
  }
  return currentPyramidWidth
}

function pyramid () {
  if (isPyramidActive) {
    say(currentIdentity, new Array(nextPyramidWidth()).fill(pyramidEmote).join(' '), 'say')
    setTimeout(() => pyramid(), randTime(timeSpam))
  }
}

function stopTrivia (identity) {
  if (isStopTriviaActive) say(identity, '>trivia stop', 'say')
}

function joinRaid (identity) {
  say(identity, '+join', 'say')
}

// Says a random fact periodically (can lie)
async function multiFact () {
  if (!isMultifactActive) { return }
  singleFact()
  const nextTime = randTime(time10Minutes)
  Logger.log('DEBUG', `Next fact in ${millisToMinutesAndSeconds(nextTime)}`)
  setTimeout(() => multiFact(), nextTime)
}

// Says a single random fact (can lie)
async function singleFact () {
  say(currentIdentity, await getAIResponse(chatterRole, factPrefix, getFactPrompt()))
}

function plsDonaldTrump () {
  say(currentIdentity, `pls ${randomElement(plsVerbs)} all ${randomElement(plsTargets)} Donald Trump forsenRNG`)
}

function farm (identity) {
  const stdActions = ['+ed', '+eg', '$fish trap reset', 'Okayeg gib eg', '?cookie', '¿taco pepeSenora', '%hw']
  const potatoActions = ['#p', '#steal', '#trample']

  clearFarmTimeouts(identity.username)

  Logger.log('INFO', `Farming as ${identity.username}`)

  let timer = 0
  for (const action of shuffleArray(stdActions)) {
    farmTimeouts.push({ username: identity.username, timeoutId: setTimeout(() => say(identity, action, 'say'), timer) })
    timer += randTime(timeSeconds)
  }

  for (const action of shuffleArray(potatoActions)) {
    farmTimeouts.push({ username: identity.username, timeoutId: setTimeout(() => say(identity, action, 'say'), timer) })
    timer += randTime(10000) + 30000
  }
  farmTimeouts.push({ username: identity.username, timeoutId: setTimeout(() => say(identity, '#cdr', 'say'), timer) })
  timer += randTime(10000) + 30000
  farmTimeouts.push({ username: identity.username, timeoutId: setTimeout(() => say(identity, '?cdr', 'say'), timer) })
  timer += randTime(timeSpam)
  for (const action of shuffleArray(potatoActions)) {
    farmTimeouts.push({ username: identity.username, timeoutId: setTimeout(() => say(identity, action, 'say'), timer) })
    timer += randTime(10000) + 30000
  }
  farmTimeouts.push({ username: identity.username, timeoutId: setTimeout(() => say(identity, '?cookie', 'say'), timer) })
  timer += randTime(timeSeconds)
  farmTimeouts.push({ username: identity.username, timeoutId: setTimeout(() => say(identity, '$remind me in 60 minutes 🚜', 'say'), timer) })
}

function clearFarmTimeouts (username = undefined) {
  if (username !== undefined) {
    for (const timeout of farmTimeouts.filter((el) => el.username === username)) clearTimeout(timeout.timeoutId)
    farmTimeouts = farmTimeouts.filter((el) => el.username !== username)
  } else {
    for (const timeout of farmTimeouts) clearTimeout(timeout.timeoutId)
    farmTimeouts = []
  }
}

// Says a message to a channel
async function say (identity, message, mode = undefined) {
  mode = mode ?? sayMode
  if (mode === 'ai') {
    Logger.log('INFO', `Got AI prompt: ${message}`)
    message = subStringUTF8(await getAIResponse(assistantRole, '', message), 0, maxMessageSize)
    Logger.log('INFO', `Answered AI prompt as ${identity.username}: ${message}`)
  }

  message = subStringUTF8(message, 0, maxMessageSize)
  if (identity.isAvoidDupe && !'>+#¿'.includes(message.at(0))) {
    message = `${message} ${duplicateSuffix}`
  }
  identity.isAvoidDupe = !identity.isAvoidDupe

  if (isDebugActive) {
    Logger.log('INFO', `DEBUG_MODE: Would have said as ${identity.username} on #${identity.channel}: ${mode === 'action' ? '/me ' : ''}${message}`)
  } else {
    if (mode !== 'action') identity.client.say(identity.channel, message)
    else identity.client.action(identity.channel, message)
    Logger.log('INFO', `Said as ${identity.username} on #${identity.channel}: ${mode === 'action' ? '/me ' : ''}${message}`)
  }
}

function resetColors () {
  for (const identity of identities) {
    if (identity.isColorChangerCompatible) changeColor(identity, identity.defaultColor)
  }
}

async function changeColor (identity = undefined, color = undefined) {
  let ids = []
  if (identity === undefined) ids = identities
  else ids.push(identity)

  for (const id of ids) {
    const col = color ?? randColor(id.currentColor)
    if (isDebugActive) {
      Logger.log('INFO', `DEBUG_MODE: Would have changed the color of ${id.username} to ${col}`)
    } else {
      try {
        const response = await fetch(`https://api.twitch.tv/helix/chat/color?user_id=${id.userId}&color=${col}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${id.password}`, 'Client-ID': helixClientId }
        })
        switch (response.status) {
          case 204:
            Logger.log('INFO', `Changed the color of ${id.username} to ${col}`)
            break
          case 400:
            Logger.log('WARNING', `The user_id proided for the user ${id.username} is invalid. Color changer has been disabled for this user`)
            id.isColorChangerCompatible = false
            break
          case 401:
            Logger.log('WARNING', `The oauth token provided proided for the user ${id.username} doesn't include the user:manage:chat_color scope. Color changer has been disabled for this user`)
            id.isColorChangerCompatible = false
        }
      } catch (error) {
        Logger.log('WARNING', `OpenAI API is unreachable: ${error}`)
      }
    }
  }
}

function getIdentity (username) {
  const identity = identities.find(identity => identity.username === username)
  if (identity) return identity
  else {
    Logger.log('ERROR', `Identity ${username} not found, returning ${identities[0].username} instead`)
    return identities[0]
  }
}

function getSettings () {
  return { isMultifactActive, isChainTriviaActive, isBotCancerActive, isSpamActive, isStopTriviaActive, isEchoActive, isPyramidActive, isAssistantActive, isColorChangerActive, isColorChangerAvailable, sayMode, isDebugActive, pyramidEmote, pyramidWidth, pyramidEmotePresets, maxSpamTime, spamSpeed, usernames: identities.map(identity => identity.username), spamPresets, currentIdentity: currentIdentity.username, logLevel: Logger.MIN_LOG_LEVEL, logShowTimestamps: Logger.SHOW_TIMESTAMPS }
}

function envVariablesCheck () {
  let isFine = true
  for (const envVariable of envVariables) {
    if (process.env?.[envVariable] === undefined) {
      isFine = false
      Logger.log('ERROR', `Environment variable ${envVariable} is undefined`)
    }
  }

  if (process.env?.HELIX_CLIENT_ID?.length > 0) isColorChangerAvailable = true
  else {
    Logger.log('WARNING', "The CLIENT_ID environment variable hasn't been provided. Color changer will be unavailable")
    isColorChangerAvailable = false
  }

  if (!isFine) {
    Logger.log('ERROR', 'Some of the necessary environment variables are undefined. Program will exit.')
    process.exit(1)
  }
}

function getFactPrompt () {
  const sumOfWeights = factPrompts.reduce((accumulator, currentPrompt) => { return accumulator + currentPrompt.weight }, 0)
  let rand = Math.floor(Math.random() * sumOfWeights + 1)
  Logger.log('DEBUG', `Rolled a ${rand} for prompt selection`)
  for (const prompt of factPrompts) {
    rand = rand - prompt.weight
    if (rand <= 0) return prompt.prompt
  }
  Logger.log('ERROR', 'there is a bug in the prompt selecting algorithm')
  return ''
}

// Returns a random time between time and 3*time milliseconds
function randTime (time, delayFactor = 0) {
  return (time * (1 + 2 * delayFactor) + Math.floor(Math.random() * (time + 1))) * 2
}

function millisToMinutesAndSeconds (millis) {
  const minutes = Math.floor(millis / 60000)
  const seconds = ((millis - minutes * 60000) / 1000).toFixed(0)
  return `${minutes}m${seconds}s`
}

function prettyPrintCommand (message) {
  const arr = []
  if (message.command) arr.push(`Command: '${message.command}'`)
  if (message.target) arr.push(`Target: '${message.target}'`)
  if (message.identity) arr.push(`Identity: '${message.identity}'`)
  if (message.arg) arr.push(`Arg: '${message.arg}'`)

  return arr.join(', ')
}

function subStringUTF8 (str, start, end = undefined) {
  if (typeof str !== 'string') {
    throw new TypeError('subStringUTF8(str, start, end) must receive a string')
  }
  const strArr = [...str]
  if (strArr[0] === '\uFEFF') {
    strArr.shift()
  }
  return strArr.slice(start, end).join('')
}

function shuffleArray (array) {
  return array.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value)
}

function randomElement (array) {
  return array[Math.floor(Math.random() * array.length)]
}

function smartJoin (str1, str2, spacer) {
  return str1?.length > 0 ? `${str1}${spacer}${str2}` : str2
}

function randColor (except = undefined) {
  return randomElement(colors.filter((item) => item !== except))
}

function initializeClients () {
  let isFirst = true
  for (const identity of identities) {
    identity.password = identity.password.replace(/oauth:/, '')
    identity.client = new tmi.Client({ connection: { reconnect: true, secure: true }, identity: { username: identity.username, password: identity.password }, channels: [identity.channel] })
    identity.isAvoidDupe = false
    identity.isColorChangerCompatible = false
    identity.client.connect()

    if (identity?.userId.length > 0) {
      if (isColorChangerAvailable) {
        if (colors.find((color) => color === identity.defaultColor).length > 0) identity.currentColor = identity.defaultColor
        else identity.currentColor = randColor()
        identity.isColorChangerCompatible = true
        changeColor(identity, identity.currentColor)
      }
    } else Logger.log('WARNING', `a userId hasn't been provided for ${identity.username}, color changer will be unavailable for this user`)

    if (isFirst) {
      identity.client.on('message', onMessageHandler)
      isFirst = false
    }
  }
}

function initializeBackend () {
  const app = express()
  const port = 3000

  app.use(bodyParser.json())

  app.post('/command', async (req, res) => {
    const message = req.body
    Logger.log('DEBUG', `Received message: ${prettyPrintCommand(message)}`)
    const output = await processCommand(message)
    res.status(200).json(output)
  })

  app.get('/', (req, res) => {
    res.sendFile(join(currentDir, 'frontend/index.html'))
  })

  app.get('/frontend.js', (req, res) => {
    res.sendFile(join(currentDir, 'frontend/frontend.js'))
  })

  app.get('/frontend.css', (req, res) => {
    res.sendFile(join(currentDir, 'frontend/frontend.css'))
  })

  app.get('/banner.webp', (req, res) => {
    res.sendFile(join(currentDir, 'frontend/banner.webp'))
  })

  app.get('/favicon.ico', (req, res) => {
    res.sendFile(join(currentDir, 'frontend/favicon.ico'))
  })

  app.listen(port, () => {
    console.log('# forsenKKona an AI powered overly patriotic bot 🇺🇸 🦅\n')
    console.log(`REST API server is up and running on port ${port}`)
    console.log('WebUI is available at http://localhost:3000\n')
  })
}

async function main () {
  if (identities.length === 0) {
    Logger.log('ERROR', 'You must provide at least one identity. Program will exit')
    process.exit(1)
  }
  initializeClients()
  initializeBackend()
}
main()

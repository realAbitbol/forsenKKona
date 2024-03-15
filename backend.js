import tmi from 'tmi.js'
import OpenAI from 'openai'
import express from 'express'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Environment variables
const envVariables = ['IDENTITIES', 'OPENAI_APIKEY', 'OPENAI_BASEURL', 'OPENAI_MODEL', 'TRIVIA_TOPICS', 'FACT_PROMPTS', 'SPAM_PRESETS', 'MAX_AI_RETRIES', 'ASSISTANT_TRIGGER', 'ASSISTANT_ROLE', 'CHATTER_ROLE', 'MAX_MESSAGE_SIZE', 'FACT_PREFIX', 'DEFAULT_SPAM', 'TIME_SPAM', 'TIME_SECONDS', 'TIME_MINUTES', 'TIME_10MINUTES']

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
const assistantRole = String(process.env.ASSISTANT_ROLE)
const chatterRole = String(process.env.CHATTER_ROLE)
const assistantTrigger = String(process.env.ASSISTANT_TRIGGER)

// Message settings
const maxMessageSize = Number(process.env.MAX_MESSAGE_SIZE)
const factPrefix = String(process.env.FACT_PREFIX)
const duplicateSuffix = '󠀀'

// Timings
const timeSpam = Number(process.env.TIME_SPAM)
const timeSeconds = Number(process.env.TIME_SECONDS)
const timeMinutes = Number(process.env.TIME_MINUTES)
const time10Minutes = Number(process.env.TIME_10MINUTES)

// Settings
let isMultifactActive = false
let isChainTriviaActive = false
let isBotCancerActive = false
let isSpamActive = false
let isStopTriviaActive = false
let isXdActive = false
let isEchoActive = false
let isPyramidActive = false
let isAssistantActive = false
let isColorChangerActive = false
let isActionActive = false
let isDebugActive = false
let spamContent = String(process.env.DEFAULT_SPAM)
let pyramidEmote = 'forsenKKona'
let pyramidWidth = 3

// Work variables
let currentPyramidWidth = 0
let currentPyramidPhase = true
let currentChainTriviaIdentity = identities[0]
let currentAssistantIdentity = identities[0]
let currentEchoeeIdentity = identities[0]
let currentBotCancerIndex = 0

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
  if (context['display-name'] === 'FeelsStrongBot' && msg === 'trivia ended nam') {
    if (isChainTriviaActive) { setTimeout(() => doTrivia(currentChainTriviaIdentity), randTime(timeSpam)) }
  }
}

function handleMessageTriviaStopper (context, msg) {
  if (context['display-name'] === 'FeelsStrongBot' && msg.includes("Trivia's about to pop off")) {
    if (isStopTriviaActive) {
      let cpt = 0
      for (const identity of shuffleArray(identities)) {
        setTimeout(() => stopTrivia(identity), randTime(timeSeconds, cpt * 2))
        cpt++
      }
    }
  }
}

function handleMessageRaidJoiner (context, msg) {
  if (context['display-name'] === 'DeepDankDungeonBot' && msg.includes('A Raid Event at Level')) {
    let cpt = 0
    for (const identity of shuffleArray(identities)) {
      setTimeout(() => joinRaid(identity), randTime(timeSeconds, cpt * 2))
      cpt++
    }
  }
}

function handleMessageEchoer (context, msg) {
  if (isEchoActive && context['display-name'] === currentEchoeeIdentity.username) {
    let cpt = 0
    msg = msg.replace(/󠀀/g, '').trim()
    for (const identity of shuffleArray(identities.filter((id) => id.username !== currentEchoeeIdentity.username))) {
      setTimeout(() => say(identity, msg), randTime(timeSeconds, cpt))
      cpt++
      console.log(`Echoing ${msg} as ${identity.username}`)
    }
  }
}

async function handleMessageAssistant (msg, context) {
  if (msg.startsWith(assistantTrigger + ' ') && isAssistantActive && context['display-name'] !== currentAssistantIdentity.username) {
    console.log(`${context['display-name']} talked to me: ${msg}`)
    const response = await getAIResponse(assistantRole, `@${context['display-name']}`, msg.slice(assistantTrigger.length + 1))
    console.log(`I replied: ${response}`)
    say(currentAssistantIdentity, response)
  }
}

async function processCommand (message) {
  switch (message.command) {
    case 'say':
      say(getIdentity(message.identity), message.arg)
      break
    case 'setpyramidemote':
      pyramidEmote = message.arg
      console.log(`Set pyramid emote to: ${pyramidEmote}`)
      break
    case 'setpyramidwidth':
      pyramidWidth = Number(message.arg)
      console.log(`Set pyramid width to: ${pyramidWidth}`)
      break
    case 'setspamcontent':
      spamContent = message.arg
      console.log(`Set spam content to: ${spamContent}`)
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
          break
        case 'action':
          isActionActive = false
          break
        case 'botcancer':
          isBotCancerActive = false
          break
        case 'xd':
          isXdActive = false
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
          isActionActive = false
          isBotCancerActive = false
          isStopTriviaActive = false
          isXdActive = false
          isEchoActive = false
          isPyramidActive = false
          isAssistantActive = false
          isColorChangerActive = false
          currentPyramidWidth = 0
          currentPyramidPhase = true
          break
        default:
          console.log(`ERROR: invalid disable target '${message.target}'`)
          return { status: 'KO' }
      }
      console.log(`Disabled ${message.target}`)
      break
    case 'enable':
      switch (message.target) {
        case 'multifact':
          isMultifactActive = true
          multiFact(getIdentity(message.identity))
          break
        case 'chaintrivia':
          currentChainTriviaIdentity = getIdentity(message.identity)
          isChainTriviaActive = true
          break
        case 'spam':
          isSpamActive = true
          spam(getIdentity(message.identity))
          break
        case 'action':
          isActionActive = true
          break
        case 'pyramid':
          isPyramidActive = true
          pyramid(getIdentity(message.identity))
          break
        case 'botcancer':
          isBotCancerActive = true
          botCancer(getIdentity(message.identity))
          break
        case 'xd':
          isXdActive = true
          xd(getIdentity(message.identity))
          break
        case 'stoptrivia':
          isStopTriviaActive = true
          break
        case 'echo':
          currentEchoeeIdentity = getIdentity(message.identity)
          isEchoActive = true
          break
        case 'assistant':
          currentAssistantIdentity = getIdentity(message.identity)
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
          console.log(`ERROR: invalid enable target '${message.target}'`)
          return { status: 'KO' }
      }
      console.log(`Enabled ${message.target}`)
      break
    case 'singlefact':
      singleFact(getIdentity(message.identity))
      break
    case 'singletrivia':
      doTrivia(getIdentity(message.identity))
      break
    case 'aiprompt': {
      const prompt = message.arg
      console.log(`Got AI prompt: ${prompt}`)
      const response = await getAIResponse(assistantRole, '', prompt)
      say(getIdentity(message.identity), response)
      console.log(`Answered AI prompt as ${message.identity}: ${response}`)
      break
    }
    case 'farm':
      farm(getIdentity(message.identity))
      break
    case 'getsettings':
      return getSettings()
    default:
      console.log(`ERROR : unsupported command '${message}'`)
      return { status: 'KO' }
  }
  return { status: 'OK' }
}

// Starts a trivia
function doTrivia (identity) {
  const topic = triviaTopics[Math.floor(Math.random() * triviaTopics.length)]
  say(identity, `>trivia ai ${topic}`)
  console.log('Started a trivia')
}

// Gat a response from the AI using the given prompt
async function getAIResponse (role, prefix, prompt) {
  console.log(`[AI] Got prompt: ${smartJoin(role, prompt, ' ')}`)
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
    console.log(`[AI] Generated text: ${response}`)
    response = smartJoin(prefix, response, ' ')
  } while (response.length > maxMessageSize && cpt < maxAiRetries)
  return response.substring(0, maxMessageSize)
}

function botCancer (identity) {
  if (isBotCancerActive) {
    currentBotCancerIndex++
    if (currentBotCancerIndex >= botCancerArray.length) currentBotCancerIndex = 0
    say(identity, botCancerArray[currentBotCancerIndex], false)
    setTimeout(() => botCancer(identity), randTime(timeSpam))
  }
}

function xd (identity) {
  if (isXdActive) {
    say(identity, '$$xd', false)
    setTimeout(() => xd(identity), randTime(timeMinutes))
  }
}

function spam (identity) {
  if (isSpamActive) {
    say(identity, spamContent)
    setTimeout(() => spam(identity), randTime(timeSpam))
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

function pyramid (identity) {
  if (isPyramidActive) {
    say(identity, new Array(nextPyramidWidth()).fill(pyramidEmote).join(' '))
    setTimeout(() => pyramid(identity), randTime(timeSpam))
  }
}

function botsCancer (identity) {
  const botCommands = ['$$xd', '$fill eShrug', '!2o3a', '!??', '!forsen', '!forsenbajs', '!fancydance', '!brainpower', '!nam', '!picklerick', '!r8', '!rain', '!rules', '!standing', '¿ping', '!losers', '!losers2']

  for (const command of shuffleArray(botCommands)) {
    setTimeout(() => say(identity, command, false), randTime(timeSpam)) // FIXME incorrect : should be called recursively
  }
}

function stopTrivia (identity) {
  if (isStopTriviaActive) say(identity, '>trivia stop', false)
}

function joinRaid (identity) {
  say(identity, '+join', false)
}

// Says a random fact periodically (can lie)
async function multiFact (identity) {
  if (!isMultifactActive) { return }
  singleFact(identity)
  const nextTime = randTime(time10Minutes)
  console.log(`Next fact in ${millisToMinutesAndSeconds(nextTime)}`)
  setTimeout(() => multiFact(identity), nextTime)
}

// Says a single random fact (can lie)
async function singleFact (identity) {
  say(identity, await getAIResponse(chatterRole, factPrefix, getFactPrompt()))
}

function farm (identity) {
  const stdActions = ['+ed', '+eg', '$fish trap reset', 'Okayeg gib eg', '?cookie', '¿taco pepeSenora', '%hw']
  const potatoActions = ['#p', '#steal', '#trample']

  console.log(`Farming as ${identity.username}`)

  let timer = 0
  for (const action of shuffleArray(stdActions)) {
    setTimeout(() => say(identity, action, false), timer)
    timer += randTime(timeSeconds)
  }

  for (const action of shuffleArray(potatoActions)) {
    setTimeout(() => say(identity, action, false), timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(() => say(identity, '#cdr', false), timer)
  timer += randTime(10000) + 30000
  setTimeout(() => say(identity, '?cdr', false), timer)
  timer += randTime(timeSpam)
  for (const action of shuffleArray(potatoActions)) {
    setTimeout(() => say(identity, action, false), timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(() => say(identity, '?cookie', false), timer)
  timer += randTime(timeSeconds)
  setTimeout(() => say(identity, '$remind me in 60 minutes 🚜', false), timer)
}

// Says a message to a channel
function say (identity, message, isAction) {
  isAction = isAction ?? isActionActive
  if (identity.isAvoidDupe) { message = `${message} ${duplicateSuffix}` }
  const msg = subStringUTF8(message, 0, maxMessageSize)
  identity.isAvoidDupe = !identity.isAvoidDupe

  if (isDebugActive) {
    console.log(`DEBUG: Would have said as ${identity.username} on #${identity.channel}: ${isAction ? '/me ' : ''}${msg}`)
  } else {
    if (!isAction) identity.client.say(identity.channel, msg)
    else identity.client.action(identity.channel, msg)
    console.log(`Said as ${identity.username} on #${identity.channel}: ${isAction ? '/me ' : ''}${msg}`)
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
      console.log(`DEBUG: Would have changed the color of ${id.username} to ${col}`)
    } else {
      try {
        const response = await fetch(`https://api.twitch.tv/helix/chat/color?user_id=${id.userId}&color=${col}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${id.password}`, 'Client-ID': helixClientId }
        })
        switch (response.status) {
          case 204:
            console.log(`Changed the color of ${id.username} to ${col}`)
            break
          case 400:
            console.log(`WARNING: The user_id proided for the user ${id.username} is invalid. Color changer has been disabled for this user`)
            id.isColorChangerCompatible = false
            break
          case 401:
            console.log(`WARNING: The oauth token provided proided for the user ${id.username} doesn't include the user:manage:chat_color scope. Color changer has been disabled for this user`)
            id.isColorChangerCompatible = false
        }
      } catch (error) {
        console.log(`OpenAI API is unreachable: ${error}`)
      }
    }
  }
}

function getIdentity (username) {
  const identity = identities.find(identity => identity.username === username)
  if (identity) return identity
  else {
    console.log(`ERROR: Identity ${username} not found, returning ${identities[0].username} instead`)
    return identities[0]
  }
}

function getSettings () {
  return { isMultifactActive, isChainTriviaActive, isBotCancerActive, isSpamActive, isStopTriviaActive, isXdActive, isEchoActive, isPyramidActive, isAssistantActive, isColorChangerActive, isColorChangerAvailable, isActionActive, isDebugActive, spamContent, pyramidEmote, pyramidWidth, usernames: identities.map(identity => identity.username), spamPresets, chainTriviaIdentity: currentChainTriviaIdentity.username, assistantIdentity: currentAssistantIdentity.username, echoeeIdentity: currentEchoeeIdentity.username }
}

function envVariablesCheck () {
  let isFine = true
  for (const envVariable of envVariables) {
    if (process.env?.[envVariable] === undefined) {
      isFine = false
      console.log(`ERROR: Environment variable ${envVariable} is undefined`)
    }
  }

  if (process.env?.HELIX_CLIENT_ID?.length > 0) isColorChangerAvailable = true
  else {
    console.log("WARNING: The CLIENT_ID environment variable hasn't been provided. Color changer will be unavailable")
    isColorChangerAvailable = false
  }

  if (!isFine) {
    console.log('ERROR: Some of the necessary environment variables are undefined. Program will exit.')
    process.exit(1)
  }
}

function getFactPrompt () {
  const sumOfWeights = factPrompts.reduce((accumulator, currentPrompt) => { return accumulator + currentPrompt.weight }, 0)
  let rand = Math.floor(Math.random() * sumOfWeights + 1)
  for (const prompt of shuffleArray(factPrompts)) {
    rand = rand - prompt.weight
    if (rand <= 0) return prompt.prompt
  }
  console.log('ERROR: there is a bug in the prompt selecting algorithm')
  return ''
}

// Returns a random time between time and 3*time milliseconds
function randTime (time, delayFactor = 0) {
  return time * (1 + delayFactor) + Math.floor(Math.random() * (time + 1)) * 2
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
    throw new TypeError('slice(str, start, end) must receive a string')
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

function smartJoin (str1, str2, spacer) {
  return str1?.length > 0 ? `${str1}${spacer}${str2}` : str2
}

function randColor (except = undefined) {
  return shuffleArray(colors.filter((item) => item !== except)).pop()
}

function initializeClients () {
  let isFirst = true
  for (const identity of identities) {
    identity.password = identity.password.replace(/oauth:/, '')
    identity.client = new tmi.Client({ connection: { reconnect: true, secure: true }, identity: { username: identity.username, password: identity.password }, channels: [identity.channel] })
    identity.isAvoidDupe = false
    identity.isColorChangerCompatible = false

    if (identity?.userId.length > 0) {
      if (isColorChangerAvailable) {
        if (colors.find((color) => color === identity.defaultColor).length > 0) identity.currentColor = identity.defaultColor
        else identity.currentColor = randColor()
        identity.isColorChangerCompatible = true
        changeColor(identity, identity.currentColor)
      }
    } else console.log(`WARNING: a userId hasn't been provided for ${identity.username}, color changer will be unavailable for this user`)

    if (isFirst) {
      identity.client.on('message', onMessageHandler)
      isFirst = false
    }
    identity.client.connect()
  }
}

function initializeBackend () {
  const app = express()
  const port = 3000

  app.use(bodyParser.json())

  app.post('/command', async (req, res) => {
    const message = req.body
    console.log(`Received message: ${prettyPrintCommand(message)}`)
    const output = await processCommand(message)
    res.status(200).json(output)
  })

  app.get('/', (req, res) => {
    res.sendFile(join(currentDir, 'index.html'))
  })

  app.get('/frontend.js', (req, res) => {
    res.sendFile(join(currentDir, 'frontend.js'))
  })

  app.get('/frontend.css', (req, res) => {
    res.sendFile(join(currentDir, 'frontend.css'))
  })

  app.get('/banner.webp', (req, res) => {
    res.sendFile(join(currentDir, 'banner.webp'))
  })

  app.get('/favicon.ico', (req, res) => {
    res.sendFile(join(currentDir, 'favicon.ico'))
  })

  app.listen(port, () => {
    console.log('# forsenKKona an AI powered overly patriotic bot 🇺🇸 🦅\n')
    console.log(`REST API server is up and running on port ${port}`)
    console.log('WebUI is available at http://localhost:3000')
  })
}

async function main () {
  if (identities.length === 0) {
    console.log('ERROR: You must provide at least one identity. Program will exit')
    process.exit(1)
  }
  initializeClients()
  initializeBackend()
}
main()

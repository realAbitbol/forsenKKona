import tmi from 'tmi.js'
import OpenAI from 'openai'
import express from 'express'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Environment variables
const envVariables = ['IDENTITIES', 'OPENAI_APIKEY', 'OPENAI_BASEURL', 'OPENAI_MODEL', 'TRIVIA_TOPICS', 'FACT_PROMPTS', 'SPAM_PRESETS', 'MAX_AI_RETRIES', 'ASSISTANT_TRIGGER', 'ASSISTANT_PROMPT', 'MAX_MESSAGE_SIZE', 'FACT_PREFIX', 'DEFAULT_SPAM', 'CHANNEL']

// Get the directory of the current module
const currentDir = dirname(fileURLToPath(import.meta.url))

// AI Setup
const openaiOptions = {
  apiKey: process.env.OPENAI_APIKEY,
  baseURL: process.env.OPENAI_BASEURL
}
const openaiModel = process.env.OPENAI_MODEL
const openai = new OpenAI(openaiOptions)
const maxAiRetries = process.env.MAX_AI_RETRIES

// TMI setup
const identities = JSON.parse(process.env.IDENTITIES)
const channel = process.env.CHANNEL

// Custom topics and prompts
const triviaTopics = JSON.parse(process.env.TRIVIA_TOPICS)
const factPrompts = JSON.parse(process.env.FACT_PROMPTS)
const spamPresets = JSON.parse(process.env.SPAM_PRESETS)
const assistantPrompt = process.env.ASSISTANT_PROMPT
const assistantTrigger = process.env.ASSISTANT_TRIGGER

// Message settings
const maxMessageSize = process.env.MAX_MESSAGE_SIZE
const factPrefix = process.env.FACT_PREFIX
const duplicateSuffix = ' 󠀀'

// Timings
const timeSConstant = 1000
const timeSVariable = 2000
const timeMConstant = 3000
const timeMVariable = 10000
const timeLConstant = 60000
const timeLVariable = 300000
const timeXLConstant = 300000
const timeXLVariable = 900000

// Settings
let isMultifactActive = false
let isChainTriviaActive = false
let isEshrugActive = false
let isSpamActive = false
let isStopTriviaActive = false
let isXdActive = false
let isEchoActive = false
let isPyramidActive = false
let isAssistantActive = false
let isDebugActive = false
let spamContent = process.env.DEFAULT_SPAM
let pyramidEmote = 'forsenKKona'
let pyramidWidth = 3

// Work variables
let currentPyramidWidth = 0
let currentPyramidPhase = true

// Says a message to a channel
function say (channel, message, identity = 0) {
  if (identities[identity].isAvoidDupe) { message = message + ' ' + duplicateSuffix }
  const msg = message.substring(0, maxMessageSize)
  identities[identity].isAvoidDupe = !identities[identity].isAvoidDupe

  if (isDebugActive) {
    console.log('DEBUG: Would have said: ' + msg)
  } else {
    identities[identity].client.say(channel, msg)
    console.log('Said as ' + identities[identity].username + ': ' + msg)
  }
}

// Returns a random time between 0 and maxTime milliseconds
function randTime (maxTime) {
  return Math.floor(Math.random() * (maxTime + 1))
}

// Called every time a new message is posted in the chat
async function onMessageHandler (target, context, msg, self) {
  // Assistant
  if (msg.startsWith(assistantTrigger + ' ') && isAssistantActive && context['display-name'] !== identities[0].username) {
    console.log(context['display-name'] + ' talked to me: ' + msg)
    const response = await getAIResponse(assistantPrompt, '@' + context['display-name'], msg.slice(assistantTrigger.length + 1))
    console.log('I replied : ' + response)
    say(channel, response, 'forsenKKona')
  }

  // Trivia chainer
  if (context['display-name'] === 'FeelsStrongBot' && msg === 'trivia ended nam') {
    if (isChainTriviaActive) { setTimeout(doTrivia, randTime(timeSVariable) + timeSConstant) }
    return
  }

  // Trivia stopper
  if (context['display-name'] === 'FeelsStrongBot' && msg.includes("Trivia's about to pop off")) {
    if (isStopTriviaActive) {
      for (let i = 0; i < identities.length; i++) {
        setTimeout(function () { stopTrivia(i) }, randTime(timeMVariable) + timeMConstant * (i + 1))
      }
    }
    return
  }

  // Raid joiner
  if (context['display-name'] === 'DeepDankDungeonBot' && msg.includes('A Raid Event at Level')) {
    for (let i = 0; i < identities.length; i++) {
      setTimeout(function () { joinRaid(i) }, randTime(timeMVariable) + timeMConstant * (i + 1))
    }
    return
  }

  // Echoer
  if (isEchoActive && context['display-name'] === identities[0].username) {
    for (let i = 0; i < identities.length; i++) {
      if (identities[i].username !== context['display-name']) {
        setTimeout(function () { say(channel, msg, i) }, randTime(timeSVariable) + timeMConstant)
        console.log("Echoing '" + msg + "' as " + identities[i].username)
      }
    }
  }
}

async function processCommand (command) {
  command = command.trim()
  if (command.startsWith('say')) {
    const args = command.split(' ')
    const identity = args[1]
    const text = args.slice(2).join(' ')
    say(channel, text, identity)
    return { status: 'OK' }
  } else if (command.startsWith('setpyramidemote')) {
    const emote = command.substring(command.indexOf(' ') + 1)
    pyramidEmote = emote
    console.log('Set pyramid emote to : ' + emote)
    return { status: 'OK' }
  } else if (command.startsWith('setpyramidwidth')) {
    const width = command.substring(command.indexOf(' ') + 1)
    pyramidWidth = Number(width)
    console.log('Set pyramid width to : ' + pyramidWidth)
    return { status: 'OK' }
  } else if (command.startsWith('setspamcontent')) {
    const text = command.substring(command.indexOf(' ') + 1)
    spamContent = text
    console.log('Set spam content to : ' + text)
    return { status: 'OK' }
  } else if (command.startsWith('disable')) {
    const target = command.substring(command.indexOf(' ') + 1)
    switch (target) {
      case 'multifact':
        isMultifactActive = false
        break
      case 'chaintrivia':
        isChainTriviaActive = false
        break
      case 'spam':
        isSpamActive = false
        break
      case 'eshrug':
        isEshrugActive = false
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
      case 'all':
        isMultifactActive = false
        isChainTriviaActive = false
        isSpamActive = false
        isEshrugActive = false
        isStopTriviaActive = false
        isXdActive = false
        isEchoActive = false
        isPyramidActive = false
        isAssistantActive = false
        currentPyramidWidth = 0
        currentPyramidPhase = true
        break
      default:
        console.log("ERROR: invalid disable target '" + target + "'")
        return { status: 'KO' }
    }
    console.log('Disabled ' + target)
    return { status: 'OK' }
  } else if (command.startsWith('enable')) {
    const target = command.substring(command.indexOf(' ') + 1)
    switch (target) {
      case 'multifact':
        isMultifactActive = true
        multiFact()
        break
      case 'chaintrivia':
        isChainTriviaActive = true
        break
      case 'spam':
        isSpamActive = true
        spam()
        break
      case 'pyramid':
        isPyramidActive = true
        pyramid()
        break
      case 'eshrug':
        isEshrugActive = true
        eShrug()
        break
      case 'xd':
        isXdActive = true
        xd()
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
      case 'debug':
        isDebugActive = true
        break
      default:
        console.log("ERROR: invalid enable target '" + target + "'")
        return { status: 'KO' }
    }
    console.log('Enabled ' + target)
    return { status: 'OK' }
  } else if (command === 'singlefact') {
    singleFact()
    return { status: 'OK' }
  } else if (command === 'singletrivia') {
    doTrivia()
    return { status: 'OK' }
  } else if (command.startsWith('aiprompt')) {
    console.log('Answering AI prompt : ' + command.substring(command.indexOf(' ') + 1))
    const response = await getAIResponse(assistantPrompt, '', command.substring(command.indexOf(' ') + 1))
    say(channel, response, 0)
    console.log('Answered AI prompt : ' + response)
    return { status: 'OK' }
  } else if (command.startsWith('farm')) {
    const identity = command.substring(command.indexOf(' ') + 1)
    farm(identity)
    return { status: 'OK' }
  } else if (command === ('getsettings')) {
    return getSettings()
  } else {
    console.log('ERROR : unsupported command :' + command)
    return { status: 'KO' }
  }
}

// Starts a trivia
function doTrivia () {
  const topic = triviaTopics[Math.floor(Math.random() * triviaTopics.length)]
  say(channel, `>trivia ai ${topic}`, 0)
  console.log('Started a trivia')
}

// Gat a response from the AI using the given prompt
async function getAIResponse (role, prefix, prompt) {
  console.log('[AI] Got prompt : ' + role + prompt)
  let response = ''
  let cpt = 0
  do {
    cpt++
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: openaiModel,
      max_tokens: 50,
      temperature: 0.70,
      top_p: 0.95,
      n: 1,
      echo: false,
      stream: false
    })
    // console.log(util.inspect(chatCompletion, {showHidden: false, depth: null, colors: true}));
    response = chatCompletion.choices[0].message.content.replace(/\r?\n/g, ' ')
    if (response.toLowerCase().startsWith('forsenKKona, ')) response = response.slice('forsenKKona, '.length)
    if (response.endsWith('.')) {
      response = response.slice(0, -1) // Removes the last character if it is a dot because it doesn't feel very natural in a twitch chat
    }
    console.log('[AI] Generated text : ' + response)
    response = (prefix + ' ' + response).trim()
  } while (response.length > maxMessageSize && cpt < maxAiRetries)
  return response.substring(0, maxMessageSize)
}

function eShrug () {
  if (isEshrugActive) {
    say(channel, '$fill eShrug', 0)
    setTimeout(eShrug, randTime(timeLVariable) + timeLConstant)
  }
}

function xd () {
  if (isXdActive) {
    say(channel, '$$xd', 0)
    setTimeout(xd, randTime(timeLVariable) + timeLConstant)
  }
}

function spam () {
  if (isSpamActive) {
    say(channel, spamContent, 0)
    setTimeout(spam, randTime(timeSVariable) + timeSConstant)
  }
}

function nextPyramidWidth () {
  if (currentPyramidPhase) {
    currentPyramidWidth++
    if (currentPyramidWidth === pyramidWidth) { currentPyramidPhase = false }
    return currentPyramidWidth
  } else {
    currentPyramidWidth--
    if (currentPyramidWidth === 0) {
      currentPyramidPhase = true
      currentPyramidWidth = 1
    }
    return currentPyramidWidth
  }
}

function pyramid () {
  if (isPyramidActive) {
    say(channel, new Array(nextPyramidWidth()).fill(pyramidEmote).join(' '), 0)
    setTimeout(pyramid, randTime(timeSVariable) + timeSConstant)
  }
}

function stopTrivia (identity) {
  if (isStopTriviaActive) {
    say(channel, '>trivia stop', identity)
  }
}

function joinRaid (identity) {
  say(channel, '+join', identity)
}

// Says a random fact periodically (can lie)
async function multiFact () {
  if (!isMultifactActive) { return }
  singleFact()
  const nextTime = randTime(timeXLVariable) + timeXLConstant
  console.log('Next fact in ' + millisToMinutesAndSeconds(nextTime))
  setTimeout(multiFact, nextTime)
}

// Says a single random fact (can lie)
async function singleFact () {
  const aiMessage = await getAIResponse('', factPrefix, getFactPrompt())
  say(channel, aiMessage, 0)
}

function farm (identity) {
  console.log('Farming as ' + identities[identity].username)
  const stdActions = ['+ed', '+eg', '$fish trap reset', 'Okayeg gib eg', '?cookie', '¿taco pepeSenora', '%hw'].sort(() => Math.random() - 0.5)
  let timer = 0
  for (const action of stdActions) {
    setTimeout(function () { say(channel, action, identity) }, timer)
    timer += randTime(timeSVariable) + timeSConstant + 1500
  }

  let potatoActions = ['#p', '#steal', '#trample'].sort(() => Math.random() - 0.5)
  for (const action of potatoActions) {
    setTimeout(function () { say(channel, action, identity) }, timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(function () { say(channel, '#cdr', identity) }, timer)
  timer += randTime(10000) + 30000
  setTimeout(function () { say(channel, '?cdr', identity) }, timer)
  timer += randTime(timeSVariable) + timeSConstant
  potatoActions = potatoActions.sort(() => Math.random() - 0.5)
  for (const action of potatoActions) {
    setTimeout(function () { say(channel, action, identity) }, timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(function () { say(channel, '?cookie', identity) }, timer)
  timer += randTime(timeSVariable) + timeSConstant + 1500
  setTimeout(function () { say(channel, '$remind me in 60 minutes 🚜', identity) }, timer)
}

function getSettings () {
  return { isMultifactActive, isChainTriviaActive, isEshrugActive, isSpamActive, isStopTriviaActive, isXdActive, isEchoActive, isPyramidActive, isAssistantActive, isDebugActive, spamContent, pyramidEmote, pyramidWidth, usernames: identities.map(identity => identity.username), spamPresets }
}

function startupCheck () {
  let isFine = true
  for (const envVariable of envVariables) {
    if (process.env?.[envVariable] === undefined) {
      isFine = false
      console.log('ERROR: Environment variable ' + envVariable + ' is undefined')
    }
  }
  return isFine && identities.length > 0
}

function getFactPrompt () {
  const sumOfWeights = factPrompts.reduce((accumulator, currentPrompt) => { return accumulator + currentPrompt.weight }, 0)
  let rand = Math.floor(Math.random() * sumOfWeights + 1)
  for (const prompt of factPrompts) {
    rand = rand - prompt.weight
    if (rand <= 0) return prompt.prompt
  }
  console.log('ERROR: there is a bug in the prompt selecting algorithm')
  return ''
}

function millisToMinutesAndSeconds (millis) {
  const minutes = Math.floor(millis / 60000)
  const seconds = ((millis % 60000) / 1000).toFixed(0)
  return (
    seconds === 60
      ? (minutes + 1) + ':00'
      : minutes + ':' + (seconds < 10 ? '0' : '') + seconds
  )
}

// The main function
async function main () {
  if (!startupCheck()) {
    console.log('ERROR: Some of the necessary environment variables  are undefined. Program will exit.')
    process.exit()
  }

  let isFirst = true
  for (const identity of identities) {
    identity.client = new tmi.Client({ connection: { reconnect: true, secure: true }, identity: { username: identity.username, password: identity.password }, channels: [channel] })
    if (isFirst) {
      identity.client.on('message', onMessageHandler)
      isFirst = false
    }
    identity.client.connect()
  }

  // Create the Express server for the REST API
  const app = express()
  const port = 3000

  app.use(bodyParser.json())

  app.post('/command', async (req, res) => {
    const { message } = req.body
    console.log('Received command : ' + message)
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
main()

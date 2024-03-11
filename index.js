import tmi from 'tmi.js'
import OpenAI from 'openai'
import express from 'express'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Debug
const isDebugActivated = process.env.DEBUG_ENABLED === 'true'
if (isDebugActivated) console.log('## DEBUG MODE ACTIVE ##')

// Environment variables
const envVariables = ['USERNAME1', 'USERNAME2', 'USERNAME3', 'PASSWORD1', 'PASSWORD2', 'PASSWORD3', 'OPENAI_APIKEY', 'OPENAI_BASEURL', 'OPENAI_MODEL', 'TRIVIA_TOPICS', 'AI_PROMPTS', 'MAX_AI_RETRIES', 'ASSISTANT_TRIGGER', 'ASSISTANT_PROMPT', 'MAX_MESSAGE_SIZE', 'FACT_PREFIX', 'DEFAULT_SPAM']

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
const identities = [
  { username: process.env.USERNAME1, password: process.env.PASSWORD1, client: '' },
  { username: process.env.USERNAME2, password: process.env.PASSWORD2, client: '' },
  { username: process.env.USERNAME3, password: process.env.PASSWORD3, client: '' }
]

// Custom topics and prompts
const triviaTopics = JSON.parse(process.env.TRIVIA_TOPICS)
const prompts = JSON.parse(process.env.AI_PROMPTS)
const assistantPrompt = process.env.ASSISTANT_PROMPT
const assistantTrigger = process.env.ASSISTANT_TRIGGER

// Message settings
const maxMessageSize = process.env.MAX_MESSAGE_SIZE
const factPrefix = process.env.FACT_PREFIX
const duplicateSuffix = '󠀀'

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
let spamContent = process.env.DEFAULT_SPAM
let pyramidEmote = 'forsenKKona'
let pyramidWidth = 3

// Work variables
let isAvoidDupe = false
let currentPyramidWidth = 0
let currentPyramidPhase = true

// Says a message to a channel
function say (channel, message, identity = 0) {
  if (isAvoidDupe) { message = message + ' ' + duplicateSuffix }
  const msg = message.substring(0, maxMessageSize)

  if (isDebugActivated) {
    console.log('DEBUG: Would have said: ' + msg)
  } else {
    identities[identity].client.say(channel, msg)
    console.log('Said as ' + identities[identity].username + ': ' + msg)
  }
  isAvoidDupe = !isAvoidDupe
}

// Returns a random time between 0 and maxTime milliseconds
function randTime (maxTime) {
  return Math.floor(Math.random() * (maxTime + 1))
}

// Called every time a new message is posted in the chat
async function onMessageHandler (target, context, msg, self) {
  // Assistant functionality
  if (msg.startsWith(assistantTrigger) && isAssistantActive && context['display-name'] !== identities[0].username) {
    console.log(context['display-name'] + ' talked to me: ' + msg)
    let response = ''
    let cpt = 0
    do {
      cpt++
      response = await getAIResponse(assistantPrompt + msg.slice(assistantTrigger.length))
    } while (response.length > (maxMessageSize - 25) && cpt < maxAiRetries)
    if (response.toLowerCase().startsWith('forsenKKona, ')) response = response.slice('forsenKKona, '.length)
    console.log('I replied : ' + response)
    say('forsen', ('@' + context['display-name'] + ' ' + response).substring(0, maxMessageSize), 'forsenKKona')
  }

  // Trivia chainer
  if (context['display-name'] === 'FeelsStrongBot' && msg === 'trivia ended nam') {
    if (isChainTriviaActive) { setTimeout(doTrivia, randTime(timeSVariable) + timeSConstant) }
    return
  }

  // Trivia stopper
  if (context['display-name'] === 'FeelsStrongBot' && msg.includes("Trivia's about to pop off")) {
    if (isStopTriviaActive) {
      for (let i = 0; i <= 2; i++) {
        setTimeout(function () { stopTrivia(i) }, randTime(timeMVariable) + timeMConstant * (i + 1))
      }
    }
    return
  }

  // Raid joiner
  if (context['display-name'] === 'DeepDankDungeonBot' && msg.includes('A Raid Event at Level')) {
    for (let i = 0; i <= 2; i++) {
      setTimeout(function () { joinRaid(i) }, randTime(timeMVariable) + timeMConstant * (i + 1))
    }
    return
  }

  // Echoer
  if (isEchoActive && context['display-name'] === identities[0].username) {
    for (let i = 0; i <= 2; i++) {
      if (identities[i].username !== context['display-name']) {
        setTimeout(function () { say('forsen', msg, i) }, randTime(timeSVariable) + timeMConstant)
        console.log("Echoing '" + msg + "' as " + identities[i].username)
      }
    }
  }
}

async function processCommand (command) {
  if (command.startsWith('say')) {
    const args = command.split(' ')
    const identity = args[1]
    const text = args.slice(2).join(' ')
    say('forsen', text, identity)
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
      case 'all':
        isMultifactActive = false
        isChainTriviaActive = false
        isSpamActive = false
        isEshrugActive = false
        isStopTriviaActive = false
        isXdActive = false
        isEchoActive = false
        isPyramidActive = false
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
    const response = await getAIResponse("You're a human, don't ask how you can help or offer help, just make the shortest reply posible to the following : " + command.substring(command.indexOf(' ') + 1))
    // say("forsen", "🤖 @" + context['display-name'] + " " + response, "forsenKKona");
    say('forsen', response, 0)
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
  say('forsen', `>trivia ai ${topic}`, 0)
  console.log('Started a trivia')
}

// Gat a response from the AI using the given prompt
async function getAIResponse (prompt) {
  console.log('[AI] Got prompt : ' + prompt)
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
  let response = chatCompletion.choices[0].message.content.replace(/\r?\n/g, ' ')
  if (response.endsWith('.')) {
    response = response.slice(0, -1) // Removes the last character if it is a dot because it doesn't feel very natural in a twitch chat
  }
  console.log('[AI] Generated text : ' + response)
  return response
}

function eShrug () {
  if (isEshrugActive) {
    say('forsen', '$fill eShrug', 1)
    setTimeout(eShrug, randTime(timeLVariable) + timeLConstant)
  }
}

function xd () {
  if (isXdActive) {
    say('forsen', '$$xd', 1)
    setTimeout(xd, randTime(timeLVariable) + timeLConstant)
  }
}

function spam () {
  if (isSpamActive) {
    say('forsen', spamContent, 0)
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
    say('forsen', new Array(nextPyramidWidth()).fill(pyramidEmote).join(' '), 0)
    setTimeout(pyramid, randTime(timeSVariable) + timeSConstant)
  }
}

function stopTrivia (identity) {
  if (isStopTriviaActive) {
    say('forsen', '>trivia stop', identity)
  }
}

function joinRaid (identity) {
  say('forsen', '+join', identity)
}

// Says a random fact about forsen (can lie)
async function multiFact () {
  if (!isMultifactActive) { return }
  singleFact()
  const nextTime = randTime(timeXLVariable) + timeXLConstant
  console.log('Next fact in ' + millisToMinutesAndSeconds(nextTime))
  setTimeout(multiFact, nextTime)
}

// Says a single random fact about forsen (can lie)
async function singleFact () {
  const prompt = getPrompt()
  let aiMessage = ''
  let cpt = 0
  do {
    cpt++
    aiMessage = await getAIResponse(prompt)
  } while (aiMessage.length > (maxMessageSize - factPrefix.length - 1) && cpt < maxAiRetries)
  say('forsen', (factPrefix + aiMessage).substring(0, maxMessageSize), 0)
}

function farm (identity) {
  console.log('Farming as ' + identities[identity].username)
  const stdActions = ['+ed', '+eg', '$fish trap reset', 'Okayeg gib eg', '?cookie', '¿taco pepeSenora', '%hw'].sort(() => Math.random() - 0.5)
  let timer = 0
  for (const action of stdActions) {
    setTimeout(function () { say('forsen', action, identity) }, timer)
    timer += randTime(timeSVariable) + timeSConstant + 1500
  }

  let potatoActions = ['#p', '#steal', '#trample'].sort(() => Math.random() - 0.5)
  for (const action of potatoActions) {
    setTimeout(function () { say('forsen', action, identity) }, timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(function () { say('forsen', '#cdr', identity) }, timer)
  timer += randTime(10000) + 30000
  setTimeout(function () { say('forsen', '?cdr', identity) }, timer)
  timer += randTime(timeSVariable) + timeSConstant
  potatoActions = potatoActions.sort(() => Math.random() - 0.5)
  for (const action of potatoActions) {
    setTimeout(function () { say('forsen', action, identity) }, timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(function () { say('forsen', '?cookie', identity) }, timer)
  timer += randTime(timeSVariable) + timeSConstant + 1500
  setTimeout(function () { say('forsen', '$remind me in 60 minutes 🚜', identity) }, timer)
}

function getSettings () {
  return { isMultifactActive, isChainTriviaActive, isEshrugActive, isSpamActive, isStopTriviaActive, isXdActive, isEchoActive, isPyramidActive, isAssistantActive, spamContent, pyramidEmote, pyramidWidth, username1: identities[0].username, username2: identities[1].username, username3: identities[2].username }
}

// Called every time the bot connects to Twitch chat
async function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`)
}

function checkEnvVariables () {
  let isFine = true
  for (const envVariable of envVariables) {
    if (process.env?.[envVariable] === undefined) {
      isFine = false
      console.log('ERROR: Environment variable ' + envVariable + ' is undefined')
    }
  }
  return isFine
}

function getPrompt () {
  const sumOfWeights = prompts.reduce((accumulator, currentPrompt) => { return accumulator + currentPrompt.weight }, 0)
  let rand = Math.floor(Math.random() * sumOfWeights + 1)
  // console.log(prompts)
  // console.log('Sum of weights: ' + sumOfWeights)
  // console.log('rand(1..' + sumOfWeights + '): ' + rand)
  for (const prompt of prompts) {
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
  if (!checkEnvVariables()) {
    console.log('ERROR: Some of the necessary environment variables  are undefined. Program will exit.')
    process.exit()
  }
  // Create a client with our options
  const client1 = new tmi.Client({ connection: { reconnect: true, secure: true }, identity: { username: identities[0].username, password: identities[0].password }, channels: ['forsen'] })
  // Register our event handlers (defined below)
  client1.on('message', onMessageHandler)
  client1.on('connected', onConnectedHandler)
  // Connect to Twitch:
  client1.connect()
  identities[0].client = client1

  const client2 = new tmi.Client({ connection: { reconnect: true, secure: true }, identity: { username: identities[1].username, password: identities[1].password }, channels: ['forsen'] })
  client2.connect()
  identities[1].client = client2

  const client3 = new tmi.Client({ connection: { reconnect: true, secure: true }, identity: { username: identities[2].username, password: identities[2].password }, channels: ['forsen'] })
  client3.connect()
  identities[2].client = client3

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

  app.get('/forsenkkona.js', (req, res) => {
    res.sendFile(join(currentDir, 'forsenkkona.js'))
  })

  app.get('/forsenkkona.css', (req, res) => {
    res.sendFile(join(currentDir, 'forsenkkona.css'))
  })

  app.get('/banner.png', (req, res) => {
    res.sendFile(join(currentDir, 'banner.png'))
  })

  app.get('/favicon.ico', (req, res) => {
    res.sendFile(join(currentDir, 'favicon.ico'))
  })

  app.listen(port, () => {
    console.log('# forsenKKona  an AI powered overly patriotic bot\n')
    console.log(`REST API server is up and running on port ${port}`)
  })
}
main()

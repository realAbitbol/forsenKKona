import tmi from 'tmi.js'
import OpenAI from 'openai'
import express from 'express'
import bodyParser from 'body-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Environment variables
const envVariables = ['IDENTITIES', 'OPENAI_APIKEY', 'OPENAI_BASEURL', 'OPENAI_MODEL', 'TRIVIA_TOPICS', 'FACT_PROMPTS', 'SPAM_PRESETS', 'MAX_AI_RETRIES', 'ASSISTANT_TRIGGER', 'ASSISTANT_PROMPT', 'MAX_MESSAGE_SIZE', 'FACT_PREFIX', 'DEFAULT_SPAM', 'TIME_SPAM', 'TIME_SECONDS', 'TIME_MINUTES', 'TIME_10MINUTES'
]

// Get the directory of the current module
const currentDir = dirname(fileURLToPath(import.meta.url))

// AI Setup
const openaiOptions = {
  apiKey: process.env.OPENAI_APIKEY,
  baseURL: process.env.OPENAI_BASEURL
}
const openaiModel = process.env.OPENAI_MODEL
const openai = new OpenAI(openaiOptions)
const maxAiRetries = Number(process.env.MAX_AI_RETRIES)

// TMI setup
const identities = JSON.parse(process.env.IDENTITIES)

// Custom topics and prompts
const triviaTopics = JSON.parse(process.env.TRIVIA_TOPICS)
const factPrompts = JSON.parse(process.env.FACT_PROMPTS)
const spamPresets = JSON.parse(process.env.SPAM_PRESETS)
const assistantPrompt = process.env.ASSISTANT_PROMPT
const assistantTrigger = process.env.ASSISTANT_TRIGGER

// Message settings
const maxMessageSize = Number(process.env.MAX_MESSAGE_SIZE)
const factPrefix = process.env.FACT_PREFIX
const duplicateSuffix = ' 󠀀'

// Timings
const timeSpam = Number(process.env.TIME_SPAM)
const timeSeconds = Number(process.env.TIME_SECONDS)
const timeMinutes = Number(process.env.TIME_MINUTES)
const time10Minutes = Number(process.env.TIME_10MINUTES)

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
let currentChainTriviaIdentity = identities[0]
let currentAssistantIdentity = identities[0]
let currentEchoeeIdentity = identities[0]

// Called every time a new message is posted in the chat
async function onMessageHandler (target, context, msg, self) {
  await handleMessageAssistant(msg, context)
  handleMessageTriviaChainer(context, msg)
  handleMessageTriviaStopper(context, msg)
  handleMessageRaidJoiner(context, msg)
  handleMessageEchoer(context, msg)
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
      for (const identity of identities.sort(() => Math.random() - 0.5)) {
        setTimeout(() => stopTrivia(identity), randTime(timeSeconds, cpt))
        cpt++
      }
    }
  }
}

function handleMessageRaidJoiner (context, msg) {
  if (context['display-name'] === 'DeepDankDungeonBot' && msg.includes('A Raid Event at Level')) {
    let cpt = 0
    for (const identity of identities.sort(() => Math.random() - 0.5)) {
      setTimeout(() => joinRaid(identity), randTime(timeSeconds, cpt))
      cpt++
    }
  }
}

function handleMessageEchoer (context, msg) {
  if (isEchoActive && context['display-name'] === currentEchoeeIdentity.username) {
    let cpt = 0
    for (const identity of identities.filter((id) => id.username !== currentEchoeeIdentity.username).sort(() => Math.random() - 0.5)) {
      setTimeout(() => say(identity, msg), randTime(timeSeconds, cpt))
      cpt++
      console.log("Echoing '" + msg + "' as " + identity.username)
    }
  }
}

async function handleMessageAssistant (msg, context) {
  if (msg.startsWith(assistantTrigger + ' ') && isAssistantActive && context['display-name'] !== currentAssistantIdentity.username) {
    console.log(context['display-name'] + ' talked to me: ' + msg)
    const response = await getAIResponse(assistantPrompt, '@' + context['display-name'], msg.slice(assistantTrigger.length + 1))
    console.log('I replied : ' + response)
    say(currentAssistantIdentity, response)
  }
}

async function processCommand (command) {
  const args = command.trim().split(' ')

  switch (args[0]) {
    case 'say':
      say(getIdentity(args[1]), args.slice(2).join(' '))
      break
    case 'setpyramidemote':
      pyramidEmote = args[1]
      console.log('Set pyramid emote to : ' + pyramidEmote)
      break
    case 'setpyramidwidth':
      pyramidWidth = Number(args[1])
      console.log('Set pyramid width to : ' + pyramidWidth)
      break
    case 'setspamcontent':
      spamContent = args.slice(1).join(' ')
      console.log('Set spam content to : ' + spamContent)
      break
    case 'disable':
      switch (args[1]) {
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
          console.log("ERROR: invalid disable target '" + args[1] + "'")
          return { status: 'KO' }
      }
      console.log('Disabled ' + args[1])
      break
    case 'enable':
      switch (args[1]) {
        case 'multifact':
          isMultifactActive = true
          multiFact(getIdentity(args[2]))
          break
        case 'chaintrivia':
          currentChainTriviaIdentity = getIdentity(args[2])
          isChainTriviaActive = true
          break
        case 'spam':
          isSpamActive = true
          spam(getIdentity(args[2]))
          break
        case 'pyramid':
          isPyramidActive = true
          pyramid(getIdentity(args[2]))
          break
        case 'eshrug':
          isEshrugActive = true
          eShrug(getIdentity(args[2]))
          break
        case 'xd':
          isXdActive = true
          xd(getIdentity(args[2]))
          break
        case 'stoptrivia':
          isStopTriviaActive = true
          break
        case 'echo':
          currentEchoeeIdentity = getIdentity(args[2])
          isEchoActive = true
          break
        case 'assistant':
          currentAssistantIdentity = getIdentity(args[2])
          isAssistantActive = true
          break
        case 'debug':
          isDebugActive = true
          break
        default:
          console.log("ERROR: invalid enable target '" + args[1] + "'")
          return { status: 'KO' }
      }
      console.log('Enabled ' + args[1])
      break
    case 'singlefact':
      singleFact(getIdentity(args[1]))
      break
    case 'singletrivia':
      doTrivia(getIdentity(args[1]))
      break
    case 'aiprompt': {
      const prompt = args.slice(2).join(' ')
      console.log('Answering AI prompt: ' + prompt)
      const response = await getAIResponse(assistantPrompt, '', prompt)
      say(getIdentity(args[1]), response)
      console.log('Answered AI prompt as ' + currentAssistantIdentity.username + ': ' + response)
      break
    }
    case 'farm':
      farm(getIdentity(args[1]))
      break
    case 'getsettings':
      return getSettings()
    default:
      console.log('ERROR : unsupported command :' + command)
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

function eShrug (identity) {
  if (isEshrugActive) {
    say(identity, '$fill eShrug')
    setTimeout(() => eShrug(identity), randTime(timeMinutes))
  }
}

function xd (identity) {
  if (isXdActive) {
    say(identity, '$$xd')
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

function pyramid (identity) {
  if (isPyramidActive) {
    say(identity, new Array(nextPyramidWidth()).fill(pyramidEmote).join(' '))
    setTimeout(() => pyramid(identity), randTime(timeSpam))
  }
}

function stopTrivia (identity) {
  if (isStopTriviaActive) {
    say(identity, '>trivia stop')
  }
}

function joinRaid (identity) {
  say(identity, '+join')
}

// Says a random fact periodically (can lie)
async function multiFact (identity) {
  if (!isMultifactActive) { return }
  singleFact(identity)
  const nextTime = randTime(time10Minutes)
  console.log('Next fact in ' + millisToMinutesAndSeconds(nextTime))
  setTimeout(() => multiFact(identity), nextTime)
}

// Says a single random fact (can lie)
async function singleFact (identity) {
  const aiMessage = await getAIResponse('', factPrefix, getFactPrompt())
  say(identity, aiMessage)
}

function farm (identity) {
  console.log('Farming as ' + identity.username)
  const stdActions = ['+ed', '+eg', '$fish trap reset', 'Okayeg gib eg', '?cookie', '¿taco pepeSenora', '%hw'].sort(() => Math.random() - 0.5)
  let timer = 0
  for (const action of stdActions) {
    setTimeout(() => say(identity, action), timer)
    timer += randTime(timeSeconds)
  }

  let potatoActions = ['#p', '#steal', '#trample'].sort(() => Math.random() - 0.5)
  for (const action of potatoActions) {
    setTimeout(() => say(identity, action), timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(() => say(identity, '#cdr'), timer)
  timer += randTime(10000) + 30000
  setTimeout(() => say(identity, '?cdr'), timer)
  timer += randTime(timeSpam)
  potatoActions = potatoActions.sort(() => Math.random() - 0.5)
  for (const action of potatoActions) {
    setTimeout(() => say(identity, action), timer)
    timer += randTime(10000) + 30000
  }
  setTimeout(() => say(identity, '?cookie'), timer)
  timer += randTime(timeSeconds)
  setTimeout(() => say(identity, '$remind me in 60 minutes 🚜'), timer)
}

// Says a message to a channel
function say (identity, message) {
  if (identity.isAvoidDupe) { message = message + ' ' + duplicateSuffix }
  const msg = message.substring(0, maxMessageSize)
  identity.isAvoidDupe = !identity.isAvoidDupe

  if (isDebugActive) {
    console.log('DEBUG: Would have said as ' + identity.username + ' on #' + identity.channel + ': ' + msg)
  } else {
    identity.client.say(identity.channel, msg)
    console.log('Said as ' + identity.username + ' on #' + identity.channel + ': ' + msg)
  }
}

function getIdentity (username) {
  const identity = identities.find(identity => identity.username === username)
  if (identity) return identity
  else {
    console.log('ERROR: Identity ' + username + ' not found, returning ' + identities[0].username + ' instead')
    return identities[0]
  }
}

function getSettings () {
  return { isMultifactActive, isChainTriviaActive, isEshrugActive, isSpamActive, isStopTriviaActive, isXdActive, isEchoActive, isPyramidActive, isAssistantActive, isDebugActive, spamContent, pyramidEmote, pyramidWidth, usernames: identities.map(identity => identity.username), spamPresets, chainTriviaIdentity: currentChainTriviaIdentity.username, assistantIdentity: currentAssistantIdentity.username, echoeeIdentity: currentEchoeeIdentity.username }
}

function startupCheck () {
  let isEnvFine = true
  for (const envVariable of envVariables) {
    if (process.env?.[envVariable] === undefined) {
      isEnvFine = false
      console.log('ERROR: Environment variable ' + envVariable + ' is undefined')
    }
  }
  return isEnvFine && identities.length > 0
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

// Returns a random time between time and 3*time milliseconds
function randTime (time, delayFactor = 0) {
  return time * (1 + delayFactor) + Math.floor(Math.random() * (time + 1)) * 2
}

function millisToMinutesAndSeconds (millis) {
  const minutes = Math.floor(millis / 60000)
  const seconds = ((millis - minutes * 60000) / 1000).toFixed(0)
  return minutes + 'm' + seconds + 's'
}

function initializeClients () {
  let isFirst = true
  for (const identity of identities) {
    identity.client = new tmi.Client({ connection: { reconnect: true, secure: true }, identity: { username: identity.username, password: identity.password }, channels: [identity.channel] })
    if (isFirst) {
      identity.client.on('message', onMessageHandler)
      isFirst = false
    }
    identity.client.connect()
  }
}

function initializeApi () {
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

async function main () {
  if (!startupCheck()) {
    console.log('ERROR: Some of the necessary environment variables  are undefined. Program will exit.')
    process.exit()
  }
  initializeClients()
  initializeApi()
}
main()

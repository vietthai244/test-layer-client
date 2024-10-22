const LayerG = require('@layerg/layerg-js')
const WebSocket = require('ws')
const { encode } = require('base64-arraybuffer')
const { btoa } = require('js-base64')

// WebSocket server URL
const serverKey = 'defaultkey'
const host = '127.0.0.1'
const port = '7350'
// const port = "";
const useSSL = false
const timeout = 10000 // ms
const autoRefreshSession = true

// WebSocket protocol URL
const websocketProtocol = useSSL ? 'wss' : 'ws'

const NUMBER_OF_BOTS = 100
const ACTION_INTERVAL = 5000 //ms
const BOTS_PER_MATCH = 50


class Bot extends LayerG.Client {
  id
  session
  ws
  matchId
  presences = []
  nextCid = 1
  cIds = {}
  data

  async connect(id, matchId) {
    this.id = id
    this.session = await this.authenticateEmail(`bot${id}@gmail.com`, '12345678')
    const wsUrl = `${websocketProtocol}://${host}:${port}/ws?lang=en&status=${encodeURIComponent(true.toString())}&token=${encodeURIComponent(this.session.token)}&format=json`
    const ws = new WebSocket(wsUrl)
    this.ws = ws

    if (matchId) {
      this.matchId = matchId
    }

    ws.on('open', async () => {
      this.sendMessage({ ping: {}, cid: this.generatecid() })
      if (matchId) {
        await this.joinMatch(matchId)
      }
      console.log(`Bot ${id} connected`)
    })

    ws.on('message', async (message) => {
      console.log(`Bot ${id} received: ${message}`)
      const data = JSON.parse(message.toString())

      if (data.status_presence_event) {
        this.presences = data.status_presence_event.joins
      }

      if (data?.match?.self) {
        console.log(`BOT-${id}'s data: `, data.match.self)
        this.data = data.match.self
      }
    })

    ws.on('close', function close() {
      console.log(`Bot ${id} disconnected`)
    })

    ws.on('error', function error(err) {
      console.log(`Bot ${id} encountered error: ${err.message}`)
    })
  }

  generatecid() {
    const cid = this.nextCid.toString()
    ++this.nextCid
    return cid
  }

  async sendMessage(msg) {
    if (msg.match_data_send) {
      // according to protobuf docs, int64 is encoded to JSON as string.
      msg.match_data_send.op_code = msg.match_data_send.op_code.toString()
      let payload = msg.match_data_send.data
      if (payload && payload instanceof Uint8Array) {
        msg.match_data_send.data = encode(payload.buffer)
      } else if (payload) { // it's a string
        msg.match_data_send.data = btoa(payload)
      }
    }

    return this.ws.send(JSON.stringify(msg))
    // return this.ws.send(JSON.stringify(msg))
  }

  sdkSend(message, sendTimeout = 10000) {
    const untypedMessage = message

    return new Promise((resolve, reject) => {
      if (untypedMessage.match_data_send) {
        this.sendMessage(untypedMessage)
        resolve()
      } else if (untypedMessage.party_data_send) {
        this.sendMessage(untypedMessage)
        resolve()
      } else {
        if (untypedMessage.channel_message_send) {
          untypedMessage.channel_message_send.content = JSON.stringify(untypedMessage.channel_message_send.content)
        } else if (untypedMessage.channel_message_update) {
          untypedMessage.channel_message_update.content = JSON.stringify(untypedMessage.channel_message_update.content)
        }

        const cid = this.generatecid()
        this.cIds[cid] = { resolve, reject }
        setTimeout(() => {
          reject('The socket timed out while waiting for a response.')
        }, sendTimeout)

        /** Add id for promise executor. */
        untypedMessage.cid = cid
        this.sendMessage(untypedMessage)
      }
    })
  }

  async joinMatch(matchId) {
    try {
      const join = {
        match_join: {
          match_id: matchId
        }
      }
      await this.sdkSend(join)
    } catch (e) {
      console.log('ERROR JOINING MATCH', e)
    }
  }

  async testAction() {
    try {
      const message = {
        match_data_send: {
          match_id: this.matchId,
          op_code: 3,
          data: {
            user_id: this.data.user_id,
            position: { x: Math.random() * 800, y: Math.random() * 800 }
          },
          presences: this.presences,
          reliable: false
        }
      }
      console.log(`BOT ${this.id} sent new message: ${JSON.stringify(message.match_data_send.data)}`)
      await this.sendMessage(message)
    } catch (e) {
      console.log('ERROR TESTING MATCH', e)
    }
  }
}

(async () => {
  const bots = []

  const createMatchAndJoinBots = async (start, end) => {
    // Create match
    const admin = new Bot(serverKey, host, port, useSSL, timeout, autoRefreshSession)
    await admin.connect('', undefined)
    const response = await admin.rpc(admin.session, 'create-match', {})
    const matchId = response.payload.matchId

    // Connect bots to match
    for (let i = start; i < end; i++) {
      const bot = new Bot(serverKey, host, port, useSSL, timeout, autoRefreshSession)
      await bot.connect(i, matchId)
      bots.push(bot)
    }
  }

  const totalMatches = Math.ceil(NUMBER_OF_BOTS / BOTS_PER_MATCH)

  for (let i = 0; i < totalMatches; i++) {
    await createMatchAndJoinBots(i * BOTS_PER_MATCH, (i + 1) * BOTS_PER_MATCH)
  }

  setInterval(() => {
    bots.forEach(bot => bot.testAction())
  }, ACTION_INTERVAL)
})()


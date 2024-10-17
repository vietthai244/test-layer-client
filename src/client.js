import { Client as LGClient } from '@layerg/layerg-js'

const serverKey = 'defaultkey'
const host = '127.0.0.1'
const port = '7350'
// const port = "";
const useSSL = false
const timeout = 10000 // ms
const autoRefreshSession = true

class Client extends LGClient {
  socket = this.createSocket(false)
  session

  async login(email, password) {
    const session = await this.authenticateEmail(email, password)
    this.session = session
    return session
  }
}

const client = new Client(serverKey, host, port, useSSL, timeout, autoRefreshSession)

export default client

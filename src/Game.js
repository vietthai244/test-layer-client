import { Container, Stage } from '@pixi/react'
import { useEffect, useState } from 'react'
import Bot from './Bot'
import getClient from './client'
import { sleep } from './utils'

const client = getClient()
const socket = client.createSocket(false, true)

export default function Game() {
  const [start, setStart] = useState(false)
  const [bots, setBots] = useState(1)
  const [matchData, setMatchData] = useState(null)

  const onStart = async () => {
    const email = `bot@gmail.com`
    const password = '12345678'
    const session = await client.login(email, password)
    await socket.connect(session, false)

    const result = await client.listMatches(client.session)
    if (!result || !result?.matches?.length) {
      await client.rpc(client.session, 'create-match', {})
      console.log('NEW MATCH CREATED: ')
      await sleep(1000)
      const result = await client.listMatches(client.session)
      setMatchData(result.matches[0])
    }
    setMatchData(result.matches[0])
  }

  return (
    <>
      <div className="controller">
        <div className="col">
          <div className="row">
            <p>Number of Bots</p>
            <input type="text" />
          </div>

        </div>

        <div>
          <button onClick={onStart}>{start ? 'Restart' : 'Start'}</button>
        </div>
      </div>

      {
        !!matchData && (
          <Stage width={800} height={800} options={{ background: 0x000000 }}>
            <Container width={800} height={800}>
              {!isNaN(bots) && Array(bots).fill().map((_, index) => <Bot index={index} matchId={matchData.match_id} />)}
            </Container>
          </Stage>
        )
      }
    </>
  )
}

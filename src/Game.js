import { Container, Stage } from '@pixi/react'
import client from './client'
import { useEffect, useState } from 'react'
import { sleep } from './utils'


export default function Game() {
  const [show, setShow] = useState(false)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState(0)
  const [matchData, setMatchData] = useState()

  const connect = async () => {
    try {
      const email = `bot${index}@gmail.com`
      const password = '12345678'
      const session = await client.login(email, password)
      console.log(`bot${index} CONNECTED`)
      await sleep(100)
      await client.socket.connect(session, true)
    } catch (e) {
      alert('Invalid account')
    }
  }

  const findMatch = async () => {
    const result = await client.listMatches(client.session)
    if (!result || !result?.matches?.length) {
      const match = await client.socket.createMatch(`BOT${index}-MATCH`)
    } else {
      const match = result.matches[0]
      const matchData = await client.socket.joinMatch(match.match_id)
      setMatchData(matchData)
    }
  }

  useEffect(() => {
    (async () => {
      await connect()
      await sleep(100)
      await findMatch()
      client.socket.onmatchdata(data => {
        console.log('MATCH DATA', data)
      })
    })()
  }, [index])

  return (
    <>
      <div className="controller">
        <div className="col">
          <p>Match Id: {matchData?.match_id}</p>
        </div>
        <div className="col">
          <p>Player index: {index}</p>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={() => setIndex(input)}>Set</button>
        </div>

        <div>
          <button onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} Visual</button>
        </div>
      </div>

      {show && (
        <Stage width={800} height={800} options={{ background: 0x000000 }}>
          <Container width={800} height={800}>

          </Container>
        </Stage>
      )}
    </>
  )
}

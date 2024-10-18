import { Container, useTick, Text, Sprite } from '@pixi/react'
import { useEffect, useMemo, useState } from 'react'
import client from './client'
import { TextStyle } from 'pixi.js'
import { json } from 'react-router-dom'

export default function Game({ index }) {
  const [start, setStart] = useState(false)
  const [matchData, setMatchData] = useState()
  const [timer, setTimer] = useState(0)
  const [socket, setSocket] = useState(client.createSocket(false, true))

  const sendMessage = async () => {
    console.log('SEND')
    await socket.sendMatchState(matchData.match_id, 1, JSON.stringify({ data: 'data' }))

  }

  const connect = async () => {
    try {
      if (isNaN(Number(index))) {
        return alert('Invalid bot ID')
      }
      const email = `bot${index}@gmail.com`
      const password = '12345678'
      const session = await client.login(email, password)
      console.log(`bot${index} CONNECTED`)
      await socket.connect(session, true)

      const result = await client.listMatches(client.session)
      if (!result || !result?.matches?.length) {
        const matchData = await client.rpc(client.session, 'create-match', {})
        setMatchData(matchData)
        setStart(true)
        console.log('NEW MATCH CREATED: ', matchData)
      } else {
        const match = result.matches[0]
        const matchData = await socket.joinMatch(match.match_id)
        console.log('JOINED MATCH', matchData)
        setMatchData(matchData)
      }
    } catch (e) {
      console.error(e)
      alert('Login failed')
    }
  }

  useEffect(() => {
    (async () => {
      socket.onmatchpresence = (matchPresenceEvent) => {
        console.log('MATCH PRESENCE', matchPresenceEvent)
      }

      socket.onmatchdata(matchState => {
        console.log(matchState)
        switch (matchState.opCode) {
          case 1:
            // Get the updated position data
            const stateJson = matchState.state;
            const state = JSON.parse(stateJson);
            console.log(state)
            break;
          default:
            console.log("Unsupported op code");
            break;
        }
      })

      socket.onnotification(noti => {
        console.log("NOTIFICATION", noti)
      })
      await connect()
    })()
  }, [])

  useTick((delta) => {
    if (start) {
      if (timer + delta > 3) {
        setTimer(0)
      } else {
        setTimer(timer + delta)
      }
    }
  })

  return (
    <Container width={800} height={800}>
      <Sprite
        interactive
        pointerdown={sendMessage}
        image="https://pixijs.io/pixi-react/img/coin.png"
        scale={{ x: 0.5, y: 0.5 }}
        anchor={0.5}
        width={40}
        height={40}
        x={400}
        y={400}
      />
    </Container>
  )
}

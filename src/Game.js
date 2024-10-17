import { Container, useTick } from '@pixi/react'
import { useEffect, useMemo, useState } from 'react'
import client from './client'
import { sleep } from './utils'

export default function Game({ index }) {
  const [start, setStart] = useState(false)
  const [matchData, setMatchData] = useState()
  const [timer, setTimer] = useState(0)


  const connect = async () => {
    try {
      if (isNaN(Number(index))) {
        return alert('Invalid bot ID')
      }
      const email = `bot${index}@gmail.com`
      const password = '12345678'
      const session = await client.login(email, password)
      console.log(`bot${index} CONNECTED`)
      const socket = client.createSocket(false)
      await socket.connect(session, true)

      socket.onmatchpresence = (matchPresenceEvent) => {
        console.log('MATCH PRESENCE', matchPresenceEvent)
      }

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

      socket.onmatchdata(data => {
        console.log('MATCH DATA', data)
      })
    } catch (e) {
      console.error(e)
      alert('Login failed')
    }
  }

  useEffect(() => {
    (async () => {
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

    </Container>
  )
}

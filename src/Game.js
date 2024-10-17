import { Container, useTick } from '@pixi/react'
import { useEffect, useMemo, useState } from 'react'
import client from './client'
import { sleep } from './utils'

export default function Game({ index }) {
  const [start, setStart] = useState(false)
  const [matchData, setMatchData] = useState()


  const connect = async () => {
    try {
      if (isNaN(Number(index))) {
        return alert('Invalid bot ID')
      }
      const email = `bot${index}@gmail.com`
      const password = '12345678'
      const session = await client.login(email, password)
      console.log(`bot${index} CONNECTED`)
      await sleep(100)
      await client.socket.connect(session, true)
      client.socket.onmatchdata(data => {
        console.log('MATCH DATA', data)
      })
      await sleep(100)
      await findMatch()
    } catch (e) {
      console.error(e)
      alert('Login failed')
    }
  }

  const findMatch = async () => {
    const result = await client.listMatches(client.session)
    if (!result || !result?.matches?.length) {
      const matchData = await client.socket.createMatch(`BOT${index}-MATCH`)
      setMatchData(matchData)
      setStart(true)
      console.log('NEW MATCH CREATED: ', matchData.match_id)
    } else {
      const match = result.matches[0]
      const matchData = await client.socket.joinMatch(match.match_id)
      console.log('JOINED MATCH', match.match_id)
      setMatchData(matchData)
    }
  }

  useEffect(() => {
    (async () => {
      await connect()
      // await sleep(100)
      // await findMatch()
    })()
  }, [])

  useTick((delta) => {
    if (start) {
      console.log('TICKER')
    }
  })

  return (
    <Container width={800} height={800}>

    </Container>
  )
}

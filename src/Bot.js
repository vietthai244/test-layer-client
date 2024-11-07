import { Sprite, useTick } from '@pixi/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import getClient from './client'

const ONE_SECOND = 60

const opCode = {
  position: 1,
  playerMove: 3
}

const client = getClient()
const socket = client.createSocket(false, false)

export default function Bot({ index }) {
  const [start, setStart] = useState(false)
  const [ticket, setTicket] = useState('')
  const [matchData, setMatchData] = useState()
  const [timer, setTimer] = useState(0)
  const [position, setPosition] = useState({ x: Math.random() * 800, y: Math.random() * 800 })

  const spriteRef = useRef()
  const directionRef = useRef({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 })
  const speed = 50
  const canvasWidth = 800  // Your canvas width
  const canvasHeight = 800 // Your canvas height

  const me = useMemo(() => {
    if (!matchData) return null
    return matchData.self
  }, [matchData])

  const sendMessage = async (opcode, message) => {
    // console.log('MESSAGE SENT', index)
    await socket.sendMatchState(matchData.match_id, opcode, JSON.stringify(message))
  }

  const moveRandomly = async () => {
    let newX = position.x + directionRef.current.x * speed
    let newY = position.y + directionRef.current.y * speed

    if (newX <= 0 || newX >= canvasWidth) {
      directionRef.current.x *= -1 // Reverse horizontal direction
    }
    if (newY <= 0 || newY >= canvasHeight) {
      directionRef.current.y *= -1 // Reverse vertical direction
    }

    newX = Math.max(0, Math.min(newX, canvasWidth))
    newY = Math.max(0, Math.min(newY, canvasHeight))
    await sendMessage(opCode.playerMove, { x: newX, y: newY })
  }

  const connect = async () => {
    try {
      if (isNaN(Number(index))) {
        return alert('Invalid bot ID')
      }
      const email = `bot${index}@gmail.com`
      const password = '12345678'
      const session = await client.login(email, password)
      // console.log(`bot${index} CONNECTED`)
      await socket.connect(session, true)

      const matches = await client.listMatches(session, 10, true, null, null, null, '+label.game_mode:free_for_all')
      console.log('CREATED MATCHES:', matches)
      if (matches?.matches?.length) {
        console.log('JOIN CREATED MATCH')
        await socket.joinMatch(matches.matches[0].match_id)
      } else {
        const { ticket } = await socket.addMatchmaker(
          '+properties.game_mode:free_for_all', 2, 8,
          {
            game_mode: 'free_for_all'
          },
          {
            elo: 10
          }
        )

        console.log('Matchmaker ticket:', ticket)
        setTicket(ticket)

        socket.onmatchmakermatched = async (matched) => {
          console.log('Match found!', matched)
          const matchId = matched.match_id
          // console.log("Joined match with ID:", matchId);

          // Optionally, join the match if required
          const match = await socket.joinMatch(matchId)
          console.log('Match joined:', match)
          setMatchData(matched)
        }
      }
    } catch (e) {
      console.error(`Bot${index} connection error`, e)
      connect()
    }
  }

  const joinMatch = async (matchId) => {
    const matchData = await socket.joinMatch(matchId)
    // console.log('JOINED MATCH', matchData)
    setMatchData(matchData)
    setStart(true)
  }

  useEffect(() => {
    socket.onmatchpresence = (matchPresenceEvent) => {
      // console.log('MATCH PRESENCE', matchPresenceEvent)
    }

    socket.onnotification(noti => {
      console.log('NOTIFICATION', noti)
    })
  }, [])

  useEffect(() => {
    socket.onmatchdata = (matchState => {
      const data = JSON.parse(new TextDecoder().decode(matchState.data))

      console.log(data)
      try {
        switch (matchState.op_code) {
          case 3:
            if (data.user_id === me?.user_id) {
              setPosition(data.position)
            }
            break
          default:
            console.log('Unsupported op code')
            break
        }
      } catch (e) {
        console.error(`error handling match data at bot ${index}:`, e)
      }
    })
  }, [index, matchData, me])

  useEffect(() => {
    (async () => {
      connect()
    })()
  }, [])

  useTick((delta) => {
    if (start) {
      if (timer + delta > ONE_SECOND) {
        // moveRandomly()
        setTimer(0)

      } else {
        setTimer(timer + delta)
      }
      console.log(timer)
    }
  })


  return (
    <Sprite
      ref={spriteRef}
      image="https://pixijs.io/pixi-react/img/coin.png"
      anchor={0.5}
      width={8}
      height={8}
      x={position.x}
      y={position.y}
    />
  )
}

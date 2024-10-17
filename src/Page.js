import { Container, Stage, useTick } from '@pixi/react'
import { useLocation } from 'react-router-dom'
import client from './client'
import { useEffect, useMemo, useState } from 'react'
import { sleep } from './utils'
import Game from './Game'

export default function Page() {
  const [show, setShow] = useState(false)
  const { pathname } = useLocation()
  const index = useMemo(() => pathname.split('/')[1], [pathname])

  return (
    <>
      <div className="controller">
        <div className="col">
          {/*<p>Player index: {index}</p>*/}
          {/*<p>Match Id: {matchData?.match_id}</p>*/}
        </div>

        <div>
          <button onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} Visual</button>
        </div>
      </div>

      <Stage width={800} height={800} options={{ background: 0x000000 }}>
        <Game index={index} />
      </Stage>
    </>
  )
}

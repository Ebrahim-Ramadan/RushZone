// Corrected Game.jsx with boost collision fix
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Player from './Player'
import Obstacle from './Obstacle'
import Boost from './Boost'
import WeatherEffect from './WeatherEffect'
import GameOverModal from './GameOverModal'

const GAME_WIDTH = 600
const GAME_HEIGHT = 800
const LANE_COUNT = 3
const LANE_WIDTH = GAME_WIDTH / LANE_COUNT
const OBSTACLE_TYPES = ['rock', 'oil', 'cone']
const WEATHER_TYPES = ['normal', 'rain', 'fog', 'snow']

interface PlayerState {
  x: number;
  lane: number;
  speed: number;
  baseSpeed: number;
  boostTime: number;
  crashed: boolean;
}

interface GameRefs {
  gameArea: HTMLDivElement | null;
}

interface KeyStates {
  ArrowLeft: boolean;
  ArrowRight: boolean;
  KeyA: boolean;
  KeyD: boolean;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: string;
}

interface Boost {
  id: number;
  x: number;
  y: number;
}

interface GameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onRestart: () => void;
}

function Game({ difficulty, onRestart }: GameProps) {
  const [player, setPlayer] = useState<PlayerState>({
    x: GAME_WIDTH / 2 - 25,
    lane: 1,
    speed: 5,
    baseSpeed: 5,
    boostTime: 0,
    crashed: false
  })

  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [boosts, setBoosts] = useState<Boost[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [lap, setLap] = useState(0)
  const [weather, setWeather] = useState<typeof WEATHER_TYPES[number]>('normal')
  const [weatherTimer, setWeatherTimer] = useState(0)
  const [targetX, setTargetX] = useState<number | null>(null)

  const keyStatesRef = useRef<KeyStates>({
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false
  })

  const gameRef = useRef<GameRefs>(null)
  const animationRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const obstacleTimerRef = useRef<number>(0)
  const boostTimerRef = useRef<number>(0)

  const difficultySettings = {
    easy: {
      obstacleFrequency: 1500,
      weatherChangeFrequency: 30000,
      playerTurnSpeed: 0.4
    },
    medium: {
      obstacleFrequency: 1000,
      weatherChangeFrequency: 20000,
      playerTurnSpeed: 0.3
    },
    hard: {
      obstacleFrequency: 700,
      weatherChangeFrequency: 15000,
      playerTurnSpeed: 0.2
    }
  }

  const settings = useMemo(() => difficultySettings[difficulty], [difficulty])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (keyStatesRef.current.hasOwnProperty(e.code)) {
      keyStatesRef.current[e.code as keyof KeyStates] = true
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (keyStatesRef.current.hasOwnProperty(e.code)) {
      keyStatesRef.current[e.code as keyof KeyStates] = false
    }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const gameArea = gameRef.current?.gameArea
    if (!gameArea) return

    const rect = gameArea.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    if (clickX >= 0 && clickX <= GAME_WIDTH) {
      setTargetX(clickX - 25)
    }
  }, [])

  const checkCollision = useCallback((rect1: DOMRect, rect2: DOMRect) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    if (gameOver) return

    const gameLoop = (timestamp: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp
      }

      const deltaTime = timestamp - lastUpdateTimeRef.current
      lastUpdateTimeRef.current = timestamp

      // Arrow key movement (incremental)
      if (!player.crashed) {
        let newX = player.x

        if (keyStatesRef.current.ArrowLeft || keyStatesRef.current.KeyA) {
          newX -= 5 // Small step to the left
          if (newX < 0) {
            newX = 0
          }
          setTargetX(null)
        }

        if (keyStatesRef.current.ArrowRight || keyStatesRef.current.KeyD) {
          newX += 5 // Small step to the right
          if (newX > GAME_WIDTH - 50) {
            newX = GAME_WIDTH - 50
          }
          setTargetX(null)
        }

        if (newX !== player.x) {
          setPlayer((prev) => ({
            ...prev,
            x: newX,
            lane: Math.floor(newX / LANE_WIDTH)
          }))
        }
      }

      // Movement towards click target
      if (targetX !== null && !player.crashed) {
        const distanceToTarget = targetX - player.x
        const direction = Math.sign(distanceToTarget)
        const moveSpeed = player.speed * 1.5 // Reduced speed for smoother movement
        const smoothingFactor = 0.3 // Increased smoothing factor for smoother movement

        let newX = player.x + direction * moveSpeed * deltaTime * smoothingFactor

        if (direction > 0 && newX > targetX) {
          newX = targetX
        } else if (direction < 0 && newX < targetX) {
          newX = targetX
        }

        setPlayer((prev) => ({
          ...prev,
          x: newX,
          lane: Math.floor(newX / LANE_WIDTH)
        }))

        if (Math.abs(distanceToTarget) < 5) {
          setTargetX(null)
        }
      }

      obstacleTimerRef.current += deltaTime
      if (obstacleTimerRef.current > settings.obstacleFrequency) {
        obstacleTimerRef.current = 0

        const x = Math.random() * (GAME_WIDTH - 40)
        const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]

        setObstacles((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: x,
            y: -50,
            type
          }
        ])
      }

      boostTimerRef.current += deltaTime
      if (boostTimerRef.current > settings.obstacleFrequency * 3) {
        boostTimerRef.current = 0

        const x = Math.random() * (GAME_WIDTH - 30)

        setBoosts((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: x,
            y: -50
          }
        ])
      }

      setObstacles((prev) =>
        prev
          .map((obstacle) => ({
            ...obstacle,
            y: obstacle.y + player.speed * deltaTime / 16
          }))
          .filter((obstacle) => obstacle.y < GAME_HEIGHT)
      )

      setBoosts((prev) =>
        prev
          .map((boost) => ({
            ...boost,
            y: boost.y + player.speed * deltaTime / 16
          }))
          .filter((boost) => boost.y < GAME_HEIGHT)
      )

      const playerRect = {
        x: player.x,
        y: GAME_HEIGHT - 120,
        width: 50,
        height: 100
      }

      setObstacles((prev) => {
        const newObstacles = [...prev]

        for (let i = 0; i < newObstacles.length; i++) {
          const obstacle = newObstacles[i]
          const obstacleRect = {
            x: obstacle.x,
            y: obstacle.y,
            width: 40,
            height: 40
          }

          if (
            playerRect.x < obstacleRect.x + obstacleRect.width &&
            playerRect.x + playerRect.width > obstacleRect.x &&
            playerRect.y < obstacleRect.y + obstacleRect.height &&
            playerRect.y + playerRect.height > obstacleRect.y
          ) {
            if (!player.crashed) {
              setPlayer((prev) => ({
                ...prev,
                speed: Math.max(1, prev.speed - 2),
                crashed: true
              }))

              setTimeout(() => {
                setPlayer((prev) => ({ ...prev, crashed: false }))
              }, 1000)
            }

            newObstacles.splice(i, 1)
            i--
          }
        }

        return newObstacles
      })

      setBoosts((prev) => {
        const newBoosts = [...prev]

        for (let i = 0; i < newBoosts.length; i++) {
          const boost = newBoosts[i]
          const boostRect = {
            x: boost.x,
            y: boost.y,
            width: 30,
            height: 30
          }

          if (
            playerRect.x < boostRect.x + boostRect.width &&
            playerRect.x + playerRect.width > boostRect.x &&
            playerRect.y < boostRect.y + boostRect.height &&
            playerRect.y + playerRect.height > boostRect.y
          ) {
            setPlayer((prev) => ({
              ...prev,
              speed: prev.baseSpeed + 3,
              boostTime: 30000
            }))

            setScore((prev) => prev + 50)

            newBoosts.splice(i, 1)
            i--
          }
        }

        return newBoosts
      })

      if (player.boostTime > 0) {
        setPlayer((prev) => ({
          ...prev,
          boostTime: Math.max(0, prev.boostTime - deltaTime)
        }))

        if (player.boostTime <= 0) {
          setPlayer((prev) => ({
            ...prev,
            speed: prev.baseSpeed
          }))
        }
      }

      const distanceIncrement = player.speed / 100 * (deltaTime / 16)
      const newDistance = distance + distanceIncrement
      setDistance(newDistance)

      if (Math.floor(newDistance / 1000) > lap) {
        setLap((prev) => prev + 1)

        setScore((prev) => prev + 500)

        if (lap >= 1) {
          setGameOver(true)
        }
      }

      setScore((prev) => prev + distanceIncrement)

      setWeatherTimer((prev) => prev + deltaTime)
      if (weatherTimer > settings.weatherChangeFrequency) {
        setWeatherTimer(0)

        let availableWeather = WEATHER_TYPES.filter((w) => w !== weather)
        setWeather(
          availableWeather[Math.floor(Math.random() * availableWeather.length)]
        )
      }

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [player, gameOver, distance, lap, weather, weatherTimer, difficulty, targetX])

  return (
    <div className="game-container" ref={gameRef}>
      <div className="game-stats">
        <div className="stat">Speed: {Math.floor(player.speed * 10)} mph</div>
        <div className="stat">Score: {Math.floor(score)}</div>
        <div className="stat">Lap: {lap + 1}/3</div>
        <div className="stat weather">Weather: {weather}</div>
      </div>

      <div
        className="game-area"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={handleClick}
      >
        <div className="road-container">
          <div
            className="road-line"
            style={{ top: `${distance * 20 % 100}%` }}
          ></div>
          <div
            className="road-line"
            style={{ top: `${distance * 20 % 100 - 100}%` }}
          ></div>
        </div>

        <WeatherEffect type={weather} />

        {obstacles.map((obstacle) => (
          <Obstacle key={obstacle.id} x={obstacle.x} y={obstacle.y} type={obstacle.type} />
        ))}

        {boosts.map((boost) => (
          <Boost key={boost.id} x={boost.x} y={boost.y} />
        ))}

        <Player
          x={player.x}
          crashed={player.crashed}
          boosting={player.boostTime > 0}
        />
      </div>

      {gameOver && (
        <GameOverModal score={Math.floor(score)} laps={lap + 1} onRestart={onRestart} />
      )}
    </div>
  )
}

export default Game
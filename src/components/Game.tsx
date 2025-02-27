// Corrected Game.jsx with boost collision fix
import { useState, useEffect, useRef } from 'react'
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

function Game({ difficulty, onRestart }) {
  const [player, setPlayer] = useState({
    x: GAME_WIDTH / 2 - 25, // center
    lane: 1, // middle lane
    speed: 5,
    baseSpeed: 5,
    boostTime: 0,
    crashed: false
  })

  const [obstacles, setObstacles] = useState([])
  const [boosts, setBoosts] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [lap, setLap] = useState(0)
  const [weather, setWeather] = useState('normal')
  const [weatherTimer, setWeatherTimer] = useState(0)
  const [targetX, setTargetX] = useState(null) // New state for click target

  // Add keyStates ref to track which keys are currently pressed
  const keyStatesRef = useRef({
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false
  })

  const gameRef = useRef(null)
  const animationRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)

  const obstacleTimerRef = useRef(0)
  const boostTimerRef = useRef(0)

  // Difficulty settings
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

  const settings = difficultySettings[difficulty]

  // Key press handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keyStatesRef.current.hasOwnProperty(e.code)) {
        keyStatesRef.current[e.code] = true
      }
    }

    const handleKeyUp = (e) => {
      if (keyStatesRef.current.hasOwnProperty(e.code)) {
        keyStatesRef.current[e.code] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (gameOver) return

    const gameLoop = (timestamp) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp
      }

      const deltaTime = timestamp - lastUpdateTimeRef.current
      lastUpdateTimeRef.current = timestamp

      // Arrow key movement (instant)
      if (!player.crashed) {
        let newX = player.x

        if (keyStatesRef.current.ArrowLeft || keyStatesRef.current.KeyA) {
          newX -= 10 // Adjust for desired speed
          if (newX < 0) {
            newX = 0
          }
          setTargetX(null) // Cancel click movement
        }

        if (keyStatesRef.current.ArrowRight || keyStatesRef.current.KeyD) {
          newX += 10 // Adjust for desired speed
          if (newX > GAME_WIDTH - 50) {
            newX = GAME_WIDTH - 50
          }
          setTargetX(null) // Cancel click movement
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
        const moveSpeed = player.speed * 2 // Adjust for desired speed
        const smoothingFactor = 0.2 // Adjust for smoother movement

        let newX = player.x + direction * moveSpeed * deltaTime * smoothingFactor

        // Check if we're about to overshoot the target
        if (direction > 0 && newX > targetX) {
          newX = targetX
        } else if (direction < 0 && newX < targetX) {
          newX = targetX
        }

        // Update player position
        setPlayer((prev) => ({
          ...prev,
          x: newX,
          lane: Math.floor(newX / LANE_WIDTH)
        }))

        // Check if we're close enough to the target to stop moving
        if (Math.abs(distanceToTarget) < 5) {
          setTargetX(null) // Clear target
        }
      }

      // Create obstacles
      obstacleTimerRef.current += deltaTime
      if (obstacleTimerRef.current > settings.obstacleFrequency) {
        obstacleTimerRef.current = 0

        // Randomize x position within the game width
        const x = Math.random() * (GAME_WIDTH - 40) // Subtract obstacle width
        const type =
          OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]

        setObstacles((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: x, // Random x position
            y: -50, // Start above the screen
            type
          }
        ])
      }

      // Create boosts (less frequently than obstacles)
      boostTimerRef.current += deltaTime
      if (boostTimerRef.current > settings.obstacleFrequency * 3) {
        boostTimerRef.current = 0

        // Randomize x position within the game width
        const x = Math.random() * (GAME_WIDTH - 30) // Subtract boost width

        setBoosts((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: x, // Random x position
            y: -50
          }
        ])
      }

      // Update obstacle positions
      setObstacles((prev) =>
        prev
          .map((obstacle) => ({
            ...obstacle,
            y: obstacle.y + player.speed * deltaTime / 16 // Scale by deltaTime
          }))
          .filter((obstacle) => obstacle.y < GAME_HEIGHT)
      )

      // Update boost positions
      setBoosts((prev) =>
        prev
          .map((boost) => ({
            ...boost,
            y: boost.y + player.speed * deltaTime / 16 // Scale by deltaTime
          }))
          .filter((boost) => boost.y < GAME_HEIGHT)
      )

      // Check for collisions with obstacles
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
            // Collision detected
            if (!player.crashed) {
              setPlayer((prev) => ({
                ...prev,
                speed: Math.max(1, prev.speed - 2),
                crashed: true
              }))

              // Auto-recover after a short delay
              setTimeout(() => {
                setPlayer((prev) => ({ ...prev, crashed: false }))
              }, 1000)
            }

            // Remove the obstacle
            newObstacles.splice(i, 1)
            i--
          }
        }

        return newObstacles
      })

      // Check for collisions with boosts
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
            // Boost collected
            setPlayer((prev) => ({
              ...prev,
              speed: prev.baseSpeed + 3,
              boostTime: 30000
            }))

            // Add to score
            setScore((prev) => prev + 50)

            // Remove the boost
            newBoosts.splice(i, 1)
            i--
          }
        }

        return newBoosts
      })

      // Update player boost time
      if (player.boostTime > 0) {
        setPlayer((prev) => ({
          ...prev,
          boostTime: Math.max(0, prev.boostTime - deltaTime)
        }))

        // Reset speed when boost ends
        if (player.boostTime <= 0) {
          setPlayer((prev) => ({
            ...prev,
            speed: prev.baseSpeed
          }))
        }
      }

      // Update distance and lap
      const distanceIncrement = player.speed / 100 * (deltaTime / 16)
      const newDistance = distance + distanceIncrement
      setDistance(newDistance)

      // Each lap is 1000 units
      if (Math.floor(newDistance / 1000) > lap) {
        setLap((prev) => prev + 1)

        // Add lap bonus
        setScore((prev) => prev + 500)

        // End game after 3 laps
        if (lap >= 1) {
          setGameOver(true)
        }
      }

      // Increase score based on distance
      setScore((prev) => prev + distanceIncrement)

      // Weather changes
      setWeatherTimer((prev) => prev + deltaTime)
      if (weatherTimer > settings.weatherChangeFrequency) {
        setWeatherTimer(0)

        // Random weather (excluding current)
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

  // Click handler
  const handleClick = (e) => {
    const gameArea = gameRef.current.querySelector('.game-area')
    const rect = gameArea.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    if (clickX >= 0 && clickX <= GAME_WIDTH) {
      setTargetX(clickX - 25) // Adjust for player width
    }
  }

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
        onClick={handleClick} // Add click handler
      >
        {/* Road markings that move to create illusion of movement */}
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


// src/components/Game.jsx
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
      playerTurnSpeed: 0.4,
    },
    medium: {
      obstacleFrequency: 1000,
      weatherChangeFrequency: 20000,
      playerTurnSpeed: 0.3,
    },
    hard: {
      obstacleFrequency: 700,
      weatherChangeFrequency: 15000,
      playerTurnSpeed: 0.2,
    }
  }
  
  const settings = difficultySettings[difficulty]
  
  // Key handling for player movement
  useEffect(() => {
    const keys = {
      ArrowLeft: false,
      ArrowRight: false,
      KeyA: false,
      KeyD: false
    }
    
    const handleKeyDown = (e) => {
      if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true
      }
    }
    
    const handleKeyUp = (e) => {
      if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    // Update player position based on key presses
    const moveInterval = setInterval(() => {
      if (gameOver) return
      
      if ((keys.ArrowLeft || keys.KeyA) && player.x > 0) {
        // Calculate turn speed based on weather
        let turnSpeed = settings.playerTurnSpeed
        if (weather === 'rain' || weather === 'snow') {
          turnSpeed *= 0.6 // Slower turning in adverse weather
        }
        
        setPlayer(prev => ({
          ...prev,
          x: Math.max(0, prev.x - (10 * turnSpeed)),
          lane: Math.floor(prev.x / LANE_WIDTH)
        }))
      }
      
      if ((keys.ArrowRight || keys.KeyD) && player.x < GAME_WIDTH - 50) {
        let turnSpeed = settings.playerTurnSpeed
        if (weather === 'rain' || weather === 'snow') {
          turnSpeed *= 0.6
        }
        
        setPlayer(prev => ({
          ...prev,
          x: Math.min(GAME_WIDTH - 50, prev.x + (10 * turnSpeed)),
          lane: Math.floor(prev.x / LANE_WIDTH)
        }))
      }
    }, 16) // ~60fps
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      clearInterval(moveInterval)
    }
  }, [player.x, gameOver, weather, difficulty])
  
  // Game loop
  useEffect(() => {
    if (gameOver) return
    
    const gameLoop = (timestamp) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp
      }
      
      const deltaTime = timestamp - lastUpdateTimeRef.current
      lastUpdateTimeRef.current = timestamp
      
      // Create obstacles
      obstacleTimerRef.current += deltaTime
      if (obstacleTimerRef.current > settings.obstacleFrequency) {
        obstacleTimerRef.current = 0
        
        const lane = Math.floor(Math.random() * LANE_COUNT)
        const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]
        
        setObstacles(prev => [
          ...prev,
          {
            id: Date.now(),
            x: lane * LANE_WIDTH + LANE_WIDTH / 2 - 20,
            y: -50,
            type
          }
        ])
      }
      
      // Create boosts (less frequently than obstacles)
      boostTimerRef.current += deltaTime
      if (boostTimerRef.current > settings.obstacleFrequency * 3) {
        boostTimerRef.current = 0
        
        const lane = Math.floor(Math.random() * LANE_COUNT)
        
        setBoosts(prev => [
          ...prev,
          {
            id: Date.now(),
            x: lane * LANE_WIDTH + LANE_WIDTH / 2 - 15,
            y: -50
          }
        ])
      }
      
      // Update obstacle positions
      setObstacles(prev => 
        prev
          .map(obstacle => ({
            ...obstacle,
            y: obstacle.y + player.speed
          }))
          .filter(obstacle => obstacle.y < GAME_HEIGHT)
      )
      
      // Update boost positions
      setBoosts(prev => 
        prev
          .map(boost => ({
            ...boost,
            y: boost.y + player.speed
          }))
          .filter(boost => boost.y < GAME_HEIGHT)
      )
      
      // Check for collisions with obstacles
      const playerRect = {
        x: player.x,
        y: GAME_HEIGHT - 120,
        width: 50,
        height: 100
      }
      
      setObstacles(prev => {
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
              setPlayer(prev => ({
                ...prev,
                speed: Math.max(1, prev.speed - 2),
                crashed: true
              }))
              
              // Auto-recover after a short delay
              setTimeout(() => {
                setPlayer(prev => ({ ...prev, crashed: false }))
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
      setBoosts(prev => {
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
            setPlayer(prev => ({
              ...prev,
              speed: prev.baseSpeed + 3,
              boostTime: 3000
            }))
            
            // Add to score
            setScore(prev => prev + 50)
            
            // Remove the boost
            newBoosts.splice(i, 1)
            i--
          }
        }
        
        return newBoosts
      })
      
      // Update player boost time
      if (player.boostTime > 0) {
        setPlayer(prev => ({
          ...prev,
          boostTime: Math.max(0, prev.boostTime - deltaTime)
        }))
        
        // Reset speed when boost ends
        if (player.boostTime <= 0) {
          setPlayer(prev => ({
            ...prev,
            speed: prev.baseSpeed
          }))
        }
      }
      
      // Update distance and lap
      const newDistance = distance + (player.speed / 100)
      setDistance(newDistance)
      
      // Each lap is 1000 units
      if (Math.floor(newDistance / 1000) > lap) {
        setLap(prev => prev + 1)
        
        // Add lap bonus
        setScore(prev => prev + 500)
        
        // End game after 3 laps
        if (lap >= 2) {
          setGameOver(true)
        }
      }
      
      // Increase score based on distance
      setScore(prev => prev + (player.speed / 100))
      
      // Weather changes
      setWeatherTimer(prev => prev + deltaTime)
      if (weatherTimer > settings.weatherChangeFrequency) {
        setWeatherTimer(0)
        
        // Random weather (excluding current)
        let availableWeather = WEATHER_TYPES.filter(w => w !== weather)
        setWeather(availableWeather[Math.floor(Math.random() * availableWeather.length)])
      }
      
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [player, gameOver, distance, lap, weather, weatherTimer, difficulty])
  
  return (
    <div className="game-container" ref={gameRef}>
      <div className="game-stats">
        <div className="stat">Speed: {Math.floor(player.speed * 10)} mph</div>
        <div className="stat">Score: {Math.floor(score)}</div>
        <div className="stat">Lap: {lap + 1}/3</div>
        <div className="stat weather">Weather: {weather}</div>
      </div>
      
      <div className="game-area" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        {/* Road markings that move to create illusion of movement */}
        <div className="road-container">
          <div className="road-line" style={{ top: `${(distance * 20) % 100}%` }}></div>
          <div className="road-line" style={{ top: `${((distance * 20) % 100) - 100}%` }}></div>
        </div>
        
        <WeatherEffect type={weather} />
        
        {obstacles.map(obstacle => (
          <Obstacle 
            key={obstacle.id}
            x={obstacle.x}
            y={obstacle.y}
            type={obstacle.type}
          />
        ))}
        
        {boosts.map(boost => (
          <Boost key={boost.id} x={boost.x} y={boost.y} />
        ))}
        
        <Player 
          x={player.x} 
          crashed={player.crashed} 
          boosting={player.boostTime > 0}
        />
      </div>
      
      {gameOver && (
        <GameOverModal 
          score={Math.floor(score)} 
          laps={lap + 1}
          onRestart={onRestart}
        />
      )}
    </div>
  )
}

export default Game
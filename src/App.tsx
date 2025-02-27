// src/App.jsx
import { useState } from 'react'
import Game from './components/Game'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [difficulty, setDifficulty] = useState('medium')

  const startGame = () => {
    setGameStarted(true)
  }

  const restartGame = () => {
    setGameStarted(false)
    setTimeout(() => setGameStarted(true), 100)
  }

  return (
    <div className="app-container">
      {!gameStarted ? (
        <div className="start-screen">
          <h1>TURBO DASH CHALLENGE</h1>
          <p>Navigate through obstacles, collect boosts, and watch out for weather changes!</p>
          
          <div className="difficulty-selector">
            <h3>Select Difficulty:</h3>
            <div className="difficulty-options">
              <button 
                className={difficulty === 'easy' ? 'active' : ''} 
                onClick={() => setDifficulty('easy')}
              >
                Easy
              </button>
              <button 
                className={difficulty === 'medium' ? 'active' : ''} 
                onClick={() => setDifficulty('medium')}
              >
                Medium
              </button>
              <button 
                className={difficulty === 'hard' ? 'active' : ''} 
                onClick={() => setDifficulty('hard')}
              >
                Hard
              </button>
            </div>
          </div>
          
          <button className="start-button" onClick={startGame}>START RACE</button>
          
          <div className="instructions">
            <h3>How to Play:</h3>
            <ul>
              <li>Use ← → arrow keys or A/D to move left and right</li>
              <li>Avoid obstacles to maintain speed</li>
              <li>Collect blue boost items for temporary speed increases</li>
              <li>Weather changes will affect your car's handling</li>
              <li>Complete 3 laps to win!</li>
            </ul>
          </div>
        </div>
      ) : (
        <Game difficulty={difficulty} onRestart={restartGame} />
      )}
    </div>
  )
}

export default App
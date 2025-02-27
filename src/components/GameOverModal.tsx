
// src/components/GameOverModal.jsx
function GameOverModal({ score, laps, onRestart }) {
    return (
      <div className="game-over-modal">
        <div className="modal-content">
          <h2>Race Complete!</h2>
          <div className="stats">
            <p>Final Score: <span className="highlight">{score}</span></p>
            <p>Laps Completed: <span className="highlight">{laps}</span>/3</p>
          </div>
          <button className="restart-button" onClick={onRestart}>
            Race Again
          </button>
        </div>
      </div>
    )
  }
  
  export default GameOverModal
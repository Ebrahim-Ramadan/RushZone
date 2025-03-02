import React, { useState } from 'react';
import Game from './Game';

function GameContainer() {
  const [isPaused, setIsPaused] = useState(false);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return (
    <div>
      <button onClick={togglePause} className="pause-button">
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <Game isPaused={isPaused} onRestart={() => setIsPaused(false)} />
    </div>
  );
}

export default GameContainer;
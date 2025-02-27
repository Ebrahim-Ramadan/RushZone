
// src/components/Player.jsx
function Player({ x, crashed, boosting }) {
    let className = "player-car"
    if (crashed) className += " crashed"
    if (boosting) className += " boosting"
    
    return (
      <div 
        className={className}
        style={{ 
          left: x,
          bottom: 20
        }}
      >
        <div className="car-body"></div>
        <div className="car-window"></div>
        <div className="car-wheel car-wheel-left"></div>
        <div className="car-wheel car-wheel-right"></div>
        {boosting && <div className="boost-flame"></div>}
      </div>
    )
  }
  
  export default Player
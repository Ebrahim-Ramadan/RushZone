
// src/components/Obstacle.jsx
function Obstacle({ x, y, type }) {
    return (
      <div 
        className={`obstacle obstacle-${type}`}
        style={{ 
          left: x,
          top: y
        }}
      >
        {type === 'rock' && <div className="rock-shape"></div>}
        {type === 'oil' && <div className="oil-shape"></div>}
        {type === 'cone' && (
          <>
            <div className="cone-top"></div>
            <div className="cone-bottom"></div>
          </>
        )}
      </div>
    )
  }
  
  export default Obstacle
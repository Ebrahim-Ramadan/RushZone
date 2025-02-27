// src/components/Obstacle.jsx
function Obstacle({ x, y, type }) {
  // Define user-friendly labels for obstacles
  const obstacleLabels = {
    'rock': 'Boulder! Avoid',
    'oil': 'Oil Slick! Slippery',
    'cone': 'Traffic Cone! Slow down'
  };
  
  return (
    <div 
      className={`obstacle obstacle-${type}`}
      style={{ 
        left: x,
        top: y
      }}
      data-type={obstacleLabels[type]} // Add descriptive label for tooltip
      // Add animation to make obstacles more noticeable
      // This will pulse slightly to draw attention
      onAnimationEnd={(e) => e.target.classList.remove('obstacle-appear')}
    >
      {type === 'rock' && (
        <div className="rock-shape">
          <div className="rock-detail rock-detail-1"></div>
          <div className="rock-detail rock-detail-2"></div>
          <div className="rock-detail rock-detail-3"></div>
        </div>
      )}
      
      {type === 'oil' && (
        <div className="oil-container">
          <div className="oil-puddle"></div>
          <div className="oil-shine oil-shine-1"></div>
          <div className="oil-shine oil-shine-2"></div>
        </div>
      )}
      
      {type === 'cone' && (
        <div className="cone-container">
          <div className="cone-body"></div>
          <div className="cone-stripe-1"></div>
          <div className="cone-stripe-2"></div>
        </div>
      )}
    </div>
  )
}

export default Obstacle
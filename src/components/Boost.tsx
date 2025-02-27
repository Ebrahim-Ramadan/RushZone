// src/components/Boost.jsx
function Boost({ x, y }) {
    return (
      <div 
        className="boost-item"
        style={{ 
          left: x,
          top: y
        }}
      >
        <div className="boost-inner"></div>
      </div>
    )
  }
  
  export default Boost
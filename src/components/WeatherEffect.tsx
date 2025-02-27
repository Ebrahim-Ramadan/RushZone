
// src/components/WeatherEffect.jsx
function WeatherEffect({ type }) {
    if (type === 'normal') return null
    
    const renderDrops = () => {
      const drops = []
      const count = type === 'rain' ? 50 : type === 'snow' ? 30 : 0
      
      for (let i = 0; i < count; i++) {
        const size = type === 'snow' ? Math.random() * 5 + 2 : Math.random() * 2 + 1
        const left = Math.random() * 100 + '%'
        const animationDuration = type === 'snow' ? Math.random() * 5 + 5 : Math.random() * 1 + 0.5
        const delay = Math.random() * 5
        
        drops.push(
          <div 
            key={i}
            className={`weather-drop ${type}-drop`}
            style={{
              width: size + 'px',
              height: type === 'snow' ? size + 'px' : size * 10 + 'px',
              left,
              animationDuration: animationDuration + 's',
              animationDelay: delay + 's'
            }}
          ></div>
        )
      }
      
      return drops
    }
    
    return (
      <div className={`weather-effect ${type}-effect`}>
        {type === 'fog' ? <div className="fog-layer"></div> : renderDrops()}
      </div>
    )
  }
  
  export default WeatherEffect
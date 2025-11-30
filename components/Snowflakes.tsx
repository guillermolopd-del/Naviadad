import React, { useEffect, useState } from 'react';

const Snowflakes: React.FC = () => {
  const [flakes, setFlakes] = useState<number[]>([]);

  useEffect(() => {
    // Generate static number of flakes to avoid re-renders causing jitter
    const newFlakes = Array.from({ length: 50 }, (_, i) => i);
    setFlakes(newFlakes);
  }, []);

  return (
    <div className="snow-container" aria-hidden="true">
      {flakes.map((i) => {
        const left = Math.random() * 100;
        const animDuration = 5 + Math.random() * 10;
        const animDelay = Math.random() * 5;
        const size = Math.random() * 10 + 5;
        
        return (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${left}%`,
              fontSize: `${size}px`,
              animationDuration: `${animDuration}s`,
              animationDelay: `${animDelay}s`,
            }}
          >
            ❄
          </div>
        );
      })}
    </div>
  );
};

export default Snowflakes;
import React, { useEffect, useState } from 'react';
import { calculateTimeLeft } from '../utils/timeUtils';

interface CountdownProps {
  targetDate: Date;
  title?: string;
  onComplete?: () => void;
  className?: string;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, title, onComplete, className }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {title && <h2 className="text-3xl md:text-5xl festive-font text-yellow-300 mb-6 text-center drop-shadow-md">{title}</h2>}
      
      <div className="grid grid-cols-4 gap-4 text-center">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="flex flex-col p-3 bg-red-800/80 backdrop-blur-sm rounded-lg border border-yellow-500/30 shadow-xl">
            <span className="text-3xl md:text-5xl font-bold text-white font-mono">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs uppercase tracking-widest text-yellow-200 mt-1">
              {unit === 'days' ? 'Días' : unit === 'hours' ? 'Horas' : unit === 'minutes' ? 'Min' : 'Seg'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Countdown;
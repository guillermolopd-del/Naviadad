export const getTodayMidnight = (): Date => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return midnight;
};

// Target date: December 22nd of the current year
export const getEventDate = (): Date => {
  const now = new Date();
  const eventDate = new Date(now.getFullYear(), 11, 22); // Month is 0-indexed (11 = Dec)
  
  // If we are already past Dec 22 this year, aim for next year (optional logic, but keeping simple for now)
  if (now > eventDate) {
    eventDate.setFullYear(now.getFullYear() + 1);
  }
  return eventDate;
};

export const calculateTimeLeft = (targetDate: Date) => {
  const difference = +targetDate - +new Date();
  
  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return { days: 0, hours: 0, minutes: 0, seconds: 0 };
};

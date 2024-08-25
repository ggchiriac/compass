import { FC, useEffect, useState } from 'react';

interface CalendarTimeProps {
  startHour: number;
  endHour: number;
}

/**
 * Calculates the percentage of the day that has passed by the given time.
 * @param currentTime - The current time (assumed to be in EST).
 * @param startHour - The start hour of the day (e.g., 8 for 8:00 AM).
 * @param endHour - The end hour of the day (e.g., 21 for 9:00 PM).
 * @returns The percentage of the day that has passed.
 */
const calculatePercentageOfDay = (
  currentTime: Date,
  startHour: number,
  endHour: number
): number => {
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const totalDayMinutes = endMinutes - startMinutes;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const minutesSinceStart = currentMinutes - startMinutes;

  return (minutesSinceStart / totalDayMinutes) * 100;
};

const CalendarTime: FC<CalendarTimeProps> = ({ startHour, endHour }) => {
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();

      // Convert the time to EST timezone
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

      const estHours = estTime.getHours();
      if (estHours < startHour || estHours >= endHour) {
        setPosition(null);
        return;
      }

      const percentage = calculatePercentageOfDay(estTime, startHour, endHour);
      setPosition(Math.max(0, Math.min(percentage, 100)));
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startHour, endHour]);

  if (position === null) {
    return null;
  } // Don't render the indicator if outside specified range

  return (
    <div
      className='time-indicator'
      style={{
        position: 'absolute',
        top: `${position}%`,
        left: 'calc(10% + 1px)',
        right: 0,
        height: '2px',
        backgroundColor: 'red',
        zIndex: 1,
      }}
    >
      <div
        className='time-indicator-ball'
        style={{
          position: 'absolute',
          left: '-6px',
          top: '-4px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'red',
        }}
      />
    </div>
  );
};

export default CalendarTime;

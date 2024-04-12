import { FC, useMemo } from 'react';

interface CalendarTimeProps {
  startHour: number;
  endHour: number;
}

const formatHour = (hour: number): string => {
  const formattedHour: number = hour % 12 || 12; // Handles the 12-hour format conversion
  const period: string = hour < 12 ? 'AM' : 'PM';
  return `${formattedHour}:00 ${period}`;
};

const CalendarTime: FC<CalendarTimeProps> = ({ startHour, endHour }) => {
  const hoursArray = useMemo(
    () =>
      Array.from({ length: endHour - startHour + 1 }, (_, index) => formatHour(startHour + index)),
    [startHour, endHour]
  );

  return (
    <>
      {hoursArray.map((hour, index) => (
        <div
          key={`time-${index}`}
          className='calendar-time bg-white border-r border-gray-200 flex items-center justify-end pr-2 text-gray-400'
          style={{
            fontSize: '0.6rem',
            gridRow: `${index * 6 + 1} / span 6`,
            gridColumn: '1',
            width: '100%',
            height: '100%',
          }}
        >
          {hour}
        </div>
      ))}
    </>
  );
};

export default CalendarTime;

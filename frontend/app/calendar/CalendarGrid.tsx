import { FC, memo } from 'react';

import { CalendarEvent } from '@/types';

import CalendarCard from './CalendarCard';

const START_HOUR: number = 9;
const END_HOUR: number = 21;

interface CalendarGridProps {
  days: string[];
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const formatHour = (hour: number): string => {
  const formattedHour: number = hour % 12 || 12;
  const period: string = hour < 12 ? 'AM' : 'PM';
  return `${formattedHour}:00 ${period}`;
};

const calendarColors = {
  gridBorder: '#e0e0e0',
  dayLabelBg: '#f5f5f5',
  timeLabelText: '#757575',
};

const CalendarGrid: FC<CalendarGridProps> = memo(({ days, events, onEventClick }) => {
  const totalRows = (END_HOUR - START_HOUR + 1) * 6; // 10-minute increments
  const gridTemplateColumns: string = `minmax(10%, auto) repeat(${days.length}, 1fr)`;
  const gridTemplateRows: string = `auto repeat(${totalRows}, 1fr)`;

  const headerRows = 2; // Rows taken up by the header

  return (
    <div className='grid calendar-container' style={{ gridTemplateColumns, gridTemplateRows }}>
      {/* Filled-in top left cell */}
      <div
        className='bg-gray-100'
        style={{
          gridColumn: 1,
          gridRow: 1,
          borderBottom: `1px solid ${calendarColors.gridBorder}`,
          borderRight: `1px solid ${calendarColors.gridBorder}`,
          borderTop: `1px solid ${calendarColors.gridBorder}`,
          borderLeft: `1px solid ${calendarColors.gridBorder}`,
          borderTopLeftRadius: '10px',
        }}
      ></div>

      {/* Day labels */}
      {days.map((day, index) => (
        <div
          key={`day-label-${index}`}
          className='text-center font-medium border-b border-r border-t'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gridColumn: index + 2,
            gridRow: 1,
            backgroundColor: calendarColors.dayLabelBg,
            borderColor: calendarColors.gridBorder,
            borderTop: `1px solid ${calendarColors.gridBorder}`,
            borderTopRightRadius: index === days.length - 1 ? '10px' : '0',
          }}
        >
          {day}
        </div>
      ))}

      {/* Time labels */}
      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, rowIndex) => (
        <div
          key={`time-${rowIndex}`}
          className='calendar-time bg-white border-l border-r flex items-center justify-end pr-2'
          style={{
            fontSize: '0.75rem',
            gridRow: `${rowIndex * 6 + headerRows} / span 6`,
            gridColumn: '1',
            borderColor: calendarColors.gridBorder,
            borderBottom: `1px solid ${calendarColors.gridBorder}`,
            borderTop: rowIndex === 0 ? `1px solid ${calendarColors.gridBorder}` : 'none',
            color: calendarColors.timeLabelText,
            borderBottomLeftRadius: rowIndex === END_HOUR - START_HOUR ? '10px' : '0',
          }}
        >
          {formatHour(rowIndex + START_HOUR)}
        </div>
      ))}

      {/* Grid rows */}
      {Array.from({ length: totalRows }, (_, rowIndex) => (
        <div
          key={`grid-row-${rowIndex}`}
          className='border-b'
          style={{
            gridRow: `${rowIndex + headerRows}`,
            gridColumn: '2 / -1',
            borderColor: calendarColors.gridBorder,
            visibility: (rowIndex + 1) % 3 !== 0 ? 'hidden' : 'visible',
            borderBottomRightRadius: rowIndex === totalRows - 1 ? '10px' : '0',
          }}
        />
      ))}

      {/* Vertical separators for days */}
      {[...Array(days.length + 1)].map((_, colIndex) => (
        <div
          key={`grid-col-${colIndex}`}
          className='border-r'
          style={{
            gridRow: '2 / -1',
            gridColumn: colIndex + 1,
            borderColor: calendarColors.gridBorder,
          }}
        />
      ))}

      {/* Events */}
      {events.map((event) => (
        <CalendarCard
          key={event.key}
          event={event}
          onSectionClick={() => onEventClick(event)}
          width={event.width}
          offsetLeft={event.offsetLeft}
          startIndex={event.startRowIndex}
          endIndex={event.endRowIndex}
          dept={event.course.department_code}
        />
      ))}
    </div>
  );
});

CalendarGrid.displayName = 'CalendarGrid';
export default CalendarGrid;

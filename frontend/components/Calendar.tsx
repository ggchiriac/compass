import { useEffect, useRef } from 'react';

import { Event } from '../types';

import Navbar from './Navbar';

export default function Calendar() {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  const calculateGridRow = (timeString) => {
    const time = new Date(timeString);
    const startHour = 7; // Grid starts at 7AM
    const slotsPerHour = 4;
    const hour = time.getHours();
    const minute = time.getMinutes();

    // Calculate the starting row based on the number of 15-minute intervals from 7AM
    const rowStart = (hour - startHour) * slotsPerHour + Math.floor(minute / 15) + 1;
    return rowStart;
  };

  const formatHour = (hour: number): string => {
    switch (hour) {
      case 0:
        return '12AM';
      case 12:
        return '12PM';
      default:
        if (hour < 12) {
          return `${hour}AM`;
        } else {
          return `${hour - 12}PM`;
        }
    }
  };

  // TODO: Make the dates and current (should be called current) dynamic
  const days = [
    { name: 'Monday', date: 19 },
    { name: 'Tuesday', date: 20 },
    { name: 'Wednesday', date: 21, current: true },
    { name: 'Thursday', date: 22 },
    { name: 'Friday', date: 23 },
  ];

  // Simulated dataset of events
  const events: Event[] = [
    {
      id: 'event-1',
      name: 'COS 423',
      description: '11:00 AM',
      startTime: '2022-01-12T06:00', // Assuming this is Wednesday
      endTime: '',
      color: 'blue',
      textColor: 'black',
      gridColumnStart: 3, // Wednesday
      gridRowStart: 24, // Assuming grid starts at 6:00 AM, each row is 15 minutes
      gridRowEnd: 12, // Span of 12 slots (3 hours)
    },
    {
      id: 'event-2',
      name: 'COS 418',
      description: '10:00 AM',
      startTime: '2022-01-12T07:30', // Also Wednesday
      endTime: '',
      color: 'pink',
      textColor: 'black',
      gridColumnStart: 3, // Wednesday
      gridRowStart: 38, // Assuming 7:30 AM start, each row is 15 minutes
      gridRowEnd: 30, // Span of 30 slots (7.5 hours)
    },
    {
      id: 'event-3',
      name: 'COS 333',
      description: '3:00 PM',
      startTime: '2022-01-14T10:00', // Assuming this is Friday
      endTime: '',
      color: 'gray',
      textColor: 'black',
      gridColumnStart: 5, // Friday
      gridRowStart: 64, // Assuming 10:00 AM start, each row is 15 minutes
      gridRowEnd: 24, // Span of 24 slots (6 hours)
    },
  ];

  useEffect(() => {
    if (container.current && containerNav.current && containerOffset.current) {
      // Calculate scroll position based on current time
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const totalMinutes = currentHour * 60 + currentMinute;
      const scrollPosition = (totalMinutes / (24 * 60)) * container.current.scrollHeight;

      // Apply calculated scroll position to the container
      container.current.scrollTop =
        scrollPosition - containerNav.current.clientHeight - containerOffset.current.clientHeight;
    }
  }, []);

  // TODO: User should be able to choose any hex color for classes (can change default)
  // Also, make sure that text colors are contrasted with the color they choose, so white text for black color
  // black for white, etc. Also, make sure that time of day color (we will have a dark mode) is not interfered.
  return (
    <>
      <Navbar />
      <div className='flex h-full flex-col'>
        <div ref={container} className='isolate flex flex-auto flex-col overflow-auto bg-white'>
          <div className='flex flex-auto flex-col'>
            <div
              ref={containerNav}
              className='sticky top-0 z-30 bg-white shadow ring-1 ring-black ring-opacity-5'
            >
              {/* Days Header */}
              <div className='grid grid-cols-5 border-1 border-r divide-x divide-gray-100 border-b border-gray-300 relative text-sm leading-6 text-gray-500'>
                {/* Days Mapping */}
                {days.map((day) => (
                  <div key={day.name} className='flex flex-col items-center p-2'>
                    <span
                      className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
                        day.current ? 'bg-indigo-600 text-white' : 'text-gray-900'
                      }`}
                    >
                      {day.date}
                    </span>
                    <span>{day.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='grid-container'>
              <div className='time-column'>
                {Array.from({ length: 15 }, (_, i) => i + 7).map((hour) => (
                  <div key={hour} className='border-b border-gray-300 py-2'>
                    {formatHour(hour)}
                  </div>
                ))}
              </div>
              {/* Events Grid */}
              <div className='events-grid'>
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`relative border border-gray-400 m-0.5 z-10 bg-${event.color}-200 text-${event.color}-800 rounded-lg p-2 text-xs leading-5`}
                    // Inline styles for dynamic values may still be needed here
                    style={{
                      gridColumnStart: event.gridColumnStart,
                      gridRowStart: calculateGridRow(event.startTime),
                      gridRowEnd: `span ${
                        calculateGridRow(event.endTime) - calculateGridRow(event.startTime)
                      }`,
                    }}
                  >
                    <div className='flex flex-col'>
                      <strong className='font-semibold'>{event.name}</strong>
                      <time dateTime={event.startTime}>{event.description}</time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef } from 'react';

// import { CalendarEvent } from '../types';

import CourseCard from './CalendarCard';
import CalendarDays from './CalendarDays'; // Assuming you have this component
// import CalendarTime from './CalendarTime'; // Assuming you have this component
import Navbar from './Navbar';

export default function Calendar() {
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);

  // const { calendarEvents, setCalendarEvents, addCalendarEvent } = useKairosStore((state) => ({
  //   calendarEvents: state.calendarEvents,
  //   setCalendarEvents: state.setCalendarEvents,
  //   addCalendarEvent: state.addCalendarEvent,
  // }));

  const calculateGridRow = (timeString) => {
    const time = new Date(timeString);
    const startHour = 6; // Grid starts at 6 AM
    const slotsPerHour = 4; // 15-minute time slots
    const hour = time.getHours();
    const minute = time.getMinutes();

    // Calculate the starting row based on the number of 15-minute intervals from 6 AM
    const rowStart = (hour - startHour) * slotsPerHour + Math.floor(minute / 15) + 1;
    return rowStart;
  };

  // const formatHour = (hour: number): string => {
  //   switch (hour) {
  //     case 0:
  //       return '12AM';
  //     case 12:
  //       return '12PM';
  //     default:
  //       if (hour < 12) {
  //         return `${hour}AM`;
  //       } else {
  //         return `${hour - 12}PM`;
  //       }
  //   }
  // };

  // TODO: Make the dates and current (should be called current) dynamic
  const days = [
    { name: '', date: null },
    { name: 'Monday', date: 26, current: true },
    { name: 'Tuesday', date: 27 },
    { name: 'Wednesday', date: 28 },
    { name: 'Thursday', date: 29 },
    { name: 'Friday', date: 30 },
  ];

  const initialEvents = [
    {
      id: 'event-1',
      name: 'COS 423',
      description: 'Theory of Algorithms',
      startTime: '2022-01-12T11:00', // 6:00 AM start
      endTime: '2022-01-12T11:30', // 9:00 AM end
      color: 'blue',
      textColor: 'white',
      gridColumnStart: 3, // Wednesday
    },
    {
      id: 'event-2',
      name: 'COS 418',
      description: 'Distributed Systems',
      startTime: '2022-01-12T07:30', // 7:30 AM start
      endTime: '2022-01-12T08:00', // 3:00 PM end
      color: 'pink',
      textColor: 'black',
      gridColumnStart: 3, // Wednesday
    },
    {
      id: 'event-3',
      name: 'COS 333',
      description: 'Advanced Programming Techniques',
      startTime: '2022-01-14T15:00', // 10:00 AM start
      endTime: '2022-01-14T16:20', // 4:00 PM end
      color: 'gray',
      textColor: 'black',
      gridColumnStart: 5, // Friday
    },
  ];
  const events = initialEvents.map((event) => {
    const startTimeRow = calculateGridRow(event.startTime);
    const endTimeRow = calculateGridRow(event.endTime);
    const durationRows = endTimeRow - startTimeRow; // Calculate the number of rows the event spans
    return {
      ...event,
      gridRowStart: startTimeRow,
      gridRowEnd: startTimeRow + durationRows,
    };
  });

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
      <div className='flex flex-col h-full bg-white'>
        <div className='sticky top-0 z-30 shadow'>
          {/* Days Header */}
          <CalendarDays days={days} />
        </div>
        <div className='flex-auto overflow-auto relative'>
          {/* Grid Background */}
          <div className='absolute inset-0 grid grid-rows-18 border border-gray-200'>
            {Array.from({ length: 18 }, (_, rowIndex) => (
              <div
                key={rowIndex}
                className={`border-b border-gray-200 ${rowIndex === 17 && 'border-r'}`}
              />
            ))}
          </div>
          {/* Vertical Lines */}
          {Array.from({ length: days.length }, (_, colIndex) => (
            <div
              key={colIndex}
              className='absolute h-full border-r border-gray-200'
              style={{ width: `${100 / days.length}%`, left: `${(100 / days.length) * colIndex}%` }}
            />
          ))}
          {/* Day Columns */}
          <div
            className='relative grid gap-4 p-4'
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((day, index) => (
              <div key={index} className='bg-white opacity-75 h-full' />
            ))}
            <div
              className='absolute top-0 grid gap-4 w-full'
              style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {events.map((event) => (
                <CourseCard key={event.id} event={event} calculateGridRow={calculateGridRow} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

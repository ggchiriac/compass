import { useEffect, useRef } from 'react';

import { Event } from '../types';

// import Navbar from '../../components/Navbar';

export default function Calendar() {
  const container = useRef(null);
  const containerNav = useRef(null);
  const containerOffset = useRef(null);
  const numberOfVerticalLines = 8;
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

  const days = [
    { name: 'Monday', date: 10 }, // Monday
    { name: 'Tuesday', date: 11 }, // Tuesday
    { name: 'Wednesday', date: 12, special: true }, // Wednesday
    { name: 'Thursday', date: 13 }, // Thursday
    { name: 'Friday', date: 14 }, // Friday
  ];

  // Simulated dataset of events
  const events: Event[] = [
    {
      id: 'event-1',
      name: 'Breakfast',
      description: '6:00 AM',
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
      name: 'Flight to Paris',
      description: '7:30 AM',
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
      name: 'Meeting with design team at Disney',
      description: '10:00 AM',
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
    // Set the container scroll position based on the current time.
    const currentMinute = new Date().getHours() * 60;
    container.current.scrollTop =
      ((container.current.scrollHeight -
        containerNav.current.offsetHeight -
        containerOffset.current.offsetHeight) *
        currentMinute) /
      1440;
  }, []);

  return (
    <div className='flex h-full flex-col'>
      <div ref={container} className='isolate flex flex-auto flex-col overflow-auto bg-white'>
        <div
          style={{ width: '165%' }}
          className='flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full'
        >
          <div
            ref={containerNav}
            className='sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black ring-opacity-5 sm:pr-8'
          >
            {/* Map days */}
            <div className='-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 sm:grid'>
              <div className='col-end-1 w-14' />
              {days.map((day) => (
                <button
                  key={day.name}
                  type='button'
                  className='flex flex-col items-center pb-3 pt-2'
                >
                  {day.name}{' '}
                  <span
                    className={`mt-1 flex h-8 w-8 items-center justify-center font-semibold ${
                      day.special ? 'rounded-full bg-indigo-600 text-white' : 'text-gray-900'
                    }`}
                  >
                    {day.date}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className='flex flex-auto'>
            <div className='sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100' />
            <div className='grid flex-auto grid-cols-1 grid-rows-1'>
              {/* Horizontal lines */}
              <div
                className='col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100'
                style={{ gridTemplateRows: 'repeat(48, minmax(3.5rem, 1fr))' }}
              >
                {/* Times */}
                <div ref={containerOffset} className='row-end-1 h-7'></div>
                {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                  <div key={hour}>
                    <div className='sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400'>
                      {formatHour(hour)}
                    </div>
                  </div>
                ))}
                <div />
              </div>

              {/* Vertical lines */}
              <div className='col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7'>
                {Array.from({ length: numberOfVerticalLines }).map((_, index) => (
                  <div
                    key={index}
                    className={`col-start-${index + 1} row-span-full ${index === 7 ? 'w-8' : ''}`}
                  />
                ))}
              </div>
              {/* Events */}
              <ol
                className='col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-5 sm:pr-8'
                style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
              >
                {events.map((event) => (
                  <li
                    key={event.id}
                    className={`relative mt-px flex sm:col-start-${event.gridColumnStart}`}
                    style={{ gridRow: `${event.gridRowStart} / span ${event.gridRowEnd}` }}
                  >
                    <a
                      href='#'
                      className='group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs leading-5'
                      style={{
                        backgroundColor: event.color,
                        color: event.textColor,
                      }}
                    >
                      <p className='order-1 font-semibold'>{event.name}</p>
                      <p>
                        <time dateTime={event.startTime}>{event.description}</time>
                      </p>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

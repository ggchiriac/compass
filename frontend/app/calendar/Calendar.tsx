import { useEffect, useRef } from 'react';

import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

import './Calendar.scss';
import { CalendarEvent } from '@/types';

import Navbar from '@/components/Navbar';
import useCalendarStore from '@/store/calendarSlice';

import CalendarCard from './CalendarCard';
import CalendarDays from './CalendarDays';

const startHour = 7;
const endHour = 21;

const formatHour = (hour: number) => {
  const formattedHour = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${formattedHour}:00 ${period}`;
};

const Calendar: React.FC = () => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const selectedCourses = useCalendarStore((state) => state.selectedCourses);
  const setSelectedCourses = useCalendarStore((state) => state.setSelectedCourses);

  // TODO: Should probably somehow standardize colors in one place across Canvas and here.
  const PRIMARY_COLOR_LIST: string[] = [
    '#ff7895',
    '#e38a62',
    '#cdaf7b',
    '#94bb77',
    '#e2c25e',
    '#ead196',
    '#e7bc7d',
    '#d0b895',
    '#72b4c9',
    '#2cdbca',
    '#a8cadc',
    '#c5bab6',
    '#bf91bd',
  ];

  // const SECONDARY_COLOR_LIST: string[] = [
  //   '#ff91a9',
  //   '#e9a88a',
  //   '#d7bf95',
  //   '#afcb9a',
  //   '#e9d186',
  //   '#f5db9d',
  //   '#f0d2a8',
  //   '#dcc9af',
  //   '#96c7d6',
  //   '#2ee8d6',
  //   '#a8d3dc',
  //   '#cac1be',
  //   '#c398c1',
  // ];

  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  const daysOfWeek = Array.from({ length: 5 }, (_, index) => addDays(startDate, index));

  const days = daysOfWeek.map((date) => ({
    name: format(date, 'EEEE'),
    date: Number(format(date, 'd')),
    current: isSameDay(date, today),
  }));

  const getRandomColor = (colorList) => {
    const randomIndex = Math.floor(Math.random() * colorList.length);
    return colorList[randomIndex];
  };

  const getTextColor = (backgroundColor) => {
    const rgb = parseInt(backgroundColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? 'text-white' : 'text-gray-800';
  };

  // Group events by start time and end time
  const groupedEvents: Record<string, CalendarEvent[]> = {};
  selectedCourses.forEach((event) => {
    const key = `${event.startColumnIndex}-${event.startRowIndex}-${event.endRowIndex}`;
    if (!groupedEvents[key]) {
      groupedEvents[key] = [];
    }
    // Assigning random colors here
    const primaryColor = getRandomColor(PRIMARY_COLOR_LIST);
    const textColor = getTextColor(primaryColor);
    groupedEvents[key].push({
      ...event,
      color: primaryColor,
      textColor: textColor,
    });
  });

  // Calculate the width for overlapping events and maintain color assignment
  const eventsWithWidth: CalendarEvent[] = Object.values(groupedEvents).flatMap((eventGroup) => {
    const width = 1 / eventGroup.length;
    return eventGroup.map((event, index) => ({
      ...event,
      width,
      offsetLeft: index * width,
    }));
  });

  const handleClick = (event: CalendarEvent) => {
    if (event.section) {
      const updatedCourses = selectedCourses.map((courseEvent) => {
        if (courseEvent.course.course_id === event.course.course_id) {
          return {
            ...courseEvent,
            selectedSection: event.section,
          };
        }
        return courseEvent;
      });

      setSelectedCourses(updatedCourses);
    }
  };

  useEffect(() => {
    if (calendarRef.current) {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const totalMinutes = currentHour * 60 + currentMinute;
      const scrollPosition = (totalMinutes / (24 * 60)) * calendarRef.current.scrollHeight;
      calendarRef.current.scrollTop = scrollPosition;
    }
  }, []);

  return (
    <>
      <Navbar />
      <div className='flex flex-col h-screen bg-white'>
        <div className='sticky top-0 z-30 shadow'>
          <div className='grid grid-cols-[60px_1fr]'>
            <div className='bg-white' />
            <CalendarDays days={days} />
          </div>
        </div>
        <div
          ref={calendarRef}
          className='flex-auto overflow-auto relative'
          style={
            {
              '--grid-columns': `repeat(${days.length}, 1fr)`,
              '--grid-rows': `repeat(${(endHour - startHour + 1) * 6}, 1fr)`,
            } as React.CSSProperties
          }
        >
          <div className='absolute inset-0 grid grid-cols-[60px_1fr]'>
            {/* Time Slots */}
            <div
              className='bg-white border-r border-gray-200 grid'
              style={{ gridTemplateRows: `repeat(${(endHour - startHour + 1) * 6}, 1fr)` }}
            >
              {Array.from({ length: endHour - startHour + 1 }, (_, rowIndex) => (
                <div
                  key={`time-${rowIndex}`}
                  className='border-b border-gray-200 flex items-center justify-end pr-2 text-gray-400'
                  style={{
                    fontSize: '0.6rem',
                    gridRow: `${rowIndex * 6 + 1} / span 6`,
                  }}
                >
                  {formatHour(rowIndex + startHour)}
                </div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div
              className='grid'
              style={{
                gridTemplateColumns: `repeat(${days.length}, 1fr)`,
                gridTemplateRows: `repeat(${(endHour - startHour + 1) * 6}, 1fr)`,
              }}
            >
              {/* Grid Lines */}
              {Array.from({ length: endHour - startHour + 1 }, (_, rowIndex) => (
                <div
                  key={`grid-row-${rowIndex}`}
                  className={`border-b border-gray-200 ${rowIndex === endHour - startHour ? 'border-b-0' : ''}`}
                  style={{ gridRow: (rowIndex + 1) * 6, gridColumn: '1 / -1' }}
                />
              ))}
              {days.map((_, colIndex) => (
                <div
                  key={`grid-col-${colIndex}`}
                  className='border-r border-gray-200'
                  style={{ gridRow: '1 / -1', gridColumn: colIndex + 1 }}
                />
              ))}
              {/* Events */}
              {eventsWithWidth.map((event) => (
                <CalendarCard
                  key={event.key}
                  event={event}
                  onSectionClick={() => handleClick(event)}
                  width={event.width}
                  offsetLeft={event.offsetLeft}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Calendar;

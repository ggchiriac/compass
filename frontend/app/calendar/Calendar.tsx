import { FC, useEffect, useRef } from 'react';

import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

import './Calendar.scss';
import { CalendarEvent } from '@/types';

import useCalendarStore from '@/store/calendarSlice';

import CalendarBody from './CalendarBody';

const START_HOUR: number = 8;
const END_HOUR: number = 21;

const Calendar: FC = () => {
  const calendarElementRef = useRef<HTMLDivElement>(null);
  const { selectedCourses, setSelectedCourse } = useCalendarStore((state) => ({
    selectedCourses: state.selectedCourses,
    setSelectedCourse: state.setSelectedCourse,
  }));

  const COLOR_PALETTE: string[] = [
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

  const today: Date = new Date();
  const weekStart: Date = startOfWeek(today, { weekStartsOn: 1 });
  const weekdays: Date[] = Array.from({ length: 5 }, (_, index) => addDays(weekStart, index));

  const formattedDays = weekdays.map((date) => ({
    name: format(date, 'EEEE'),
    date: Number(format(date, 'd')),
    current: isSameDay(date, today),
  }));

  const getRandomColor = (colors: string[]): string => {
    const randomIndex: number = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  const getTextColor = (backgroundColor: string): string => {
    const rgb: number = parseInt(backgroundColor.slice(1), 16);
    const r: number = (rgb >> 16) & 0xff;
    const g: number = (rgb >> 8) & 0xff;
    const b: number = (rgb >> 0) & 0xff;
    const brightness: number = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return brightness < 128 ? 'text-white' : 'text-gray-800';
  };

  const groupedEvents: Record<string, CalendarEvent[]> = {};
  selectedCourses.forEach((event) => {
    const key = `${event.startColumnIndex}-${event.startRowIndex}-${event.endRowIndex}`;
    if (!groupedEvents[key]) {
      groupedEvents[key] = [];
    }
    // Assigning random colors here
    const primaryColor = getRandomColor(COLOR_PALETTE);
    const textColor = getTextColor(primaryColor);
    groupedEvents[key].push({
      ...event,
      color: primaryColor,
      textColor: textColor,
    });
  });

  const events: CalendarEvent[] = Object.values(groupedEvents).flatMap((eventGroup) => {
    const width = 1 / eventGroup.length;
    return eventGroup.map((event, index) => ({
      ...event,
      width,
      offsetLeft: index * width,
    }));
  });
  console.log('Events with width:', events);

  const handleSectionSelection = (event: CalendarEvent): void => {
    setSelectedCourse(event);
    console.log('boop:', event.section.class_meetings);
  };

  useEffect(() => {
    if (calendarElementRef.current) {
      const currentHour: number = new Date().getHours();
      const currentMinute: number = new Date().getMinutes();
      const totalMinutes: number = currentHour * 60 + currentMinute;
      const scrollPosition: number =
        (totalMinutes / (24 * 60)) * calendarElementRef.current.scrollHeight;
      calendarElementRef.current.scrollTop = scrollPosition;
    }
  }, []);

  return (
    <div>
      <div className='calendar-main'>
        <CalendarBody
          calendarRef={calendarElementRef}
          days={formattedDays.map((day) => day.name)}
          startHour={START_HOUR}
          endHour={END_HOUR}
          events={events}
          onEventClick={handleSectionSelection}
        />
      </div>
    </div>
  );
};

export default Calendar;

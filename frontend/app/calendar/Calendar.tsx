import { FC, useEffect, useRef } from 'react';

import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

import './Calendar.scss';
import { CalendarEvent } from '@/types';

import useCalendarStore from '@/store/calendarSlice';
import useFilterStore from '@/store/filterSlice';

import CalendarBody from './CalendarBody';

const START_HOUR: number = 9;
const END_HOUR: number = 21;

const Calendar: FC = () => {
  const calendarElementRef = useRef<HTMLDivElement>(null);
  const { termFilter } = useFilterStore((state) => state);
  const { selectedCourses, fetchCalendarState } = useCalendarStore((state) => ({
    selectedCourses: state.getSelectedCourses(termFilter).filter((course) => course.isActive),
    fetchCalendarState: state.fetchCalendarState,
  }));

  const defaultColor: string = '#657786';

  const today: Date = new Date();
  const weekStart: Date = startOfWeek(today, { weekStartsOn: 1 });
  const weekdays: Date[] = Array.from({ length: 5 }, (_, index) => addDays(weekStart, index));

  const formattedDays = weekdays.map((date) => ({
    name: format(date, 'EEEE'),
    date: Number(format(date, 'd')),
    current: isSameDay(date, today),
  }));

  const getTextColor = (backgroundColor: string): string => {
    const rgb: number = parseInt(backgroundColor.slice(1), 16);
    const r: number = (rgb >> 16) & 0xff;
    const g: number = (rgb >> 8) & 0xff;
    const b: number = (rgb >> 0) & 0xff;
    const brightness: number = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return brightness < 128 ? 'text-white' : 'text-gray-800';
  };

  const isOverlapping = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
    return (
      event1.startColumnIndex === event2.startColumnIndex &&
      ((event1.startRowIndex >= event2.startRowIndex &&
        event1.startRowIndex < event2.endRowIndex) ||
        (event2.startRowIndex >= event1.startRowIndex && event2.startRowIndex < event1.endRowIndex))
    );
  };

  const groupedEvents: Record<string, CalendarEvent[]> = {};
  selectedCourses.forEach((event) => {
    const overlappingGroup = Object.values(groupedEvents).find((group) =>
      group.some((groupedEvent) => isOverlapping(event, groupedEvent))
    );

    if (overlappingGroup) {
      overlappingGroup.push(event);
    } else {
      const key = `${event.startColumnIndex}-${event.startRowIndex}-${event.endRowIndex}`;
      groupedEvents[key] = [event];
    }
  });

  const events: CalendarEvent[] = Object.values(groupedEvents).flatMap((eventGroup) => {
    const width = 1 / eventGroup.length;
    return eventGroup.map((event, index) => ({
      ...event,
      width,
      offsetLeft: index * width,
      color: defaultColor,
      textColor: getTextColor(defaultColor),
    }));
  });

  useEffect(() => {
    fetchCalendarState(termFilter);
  }, [fetchCalendarState, termFilter]);

  useEffect(() => {
    console.log('selected courses updated:', selectedCourses);
  }, [selectedCourses]);

  const handleClick = (event: CalendarEvent): void => {
    useCalendarStore.getState().activateSection(event, termFilter);
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
          onEventClick={handleClick}
        />
      </div>
    </div>
  );
};

export default Calendar;

import { FC, useEffect, useRef } from 'react';

import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

import './Calendar.scss';
import { AcademicTerm, CalendarEvent } from '@/types';

import useCalendarStore from '@/store/calendarSlice';
import useFilterStore from '@/store/filterSlice';
import { terms } from '@/utils/terms';

import CalendarBody from './CalendarBody';

const START_HOUR: number = 9;
const END_HOUR: number = 21;

const Calendar: FC = () => {
  const calendarElementRef = useRef<HTMLDivElement>(null);
  const defaultTerm = Object.keys(terms).reduce((latest, term) => {
    return terms[term] > terms[latest] ? term : latest;
  });

  const { distributionFilter, levelFilter, gradingFilter } = useFilterStore();
  const { activeConfiguration, getSelectedCourses, fetchCalendarState, activateSection } =
    useCalendarStore();

  const selectedCourses = getSelectedCourses(
    activeConfiguration.term,
    activeConfiguration.schedule
  ).filter((course) => {
    const { course: eventCourse, isActive } = course;
    return (
      isActive &&
      (!distributionFilter || eventCourse.distribution_area_short === distributionFilter) &&
      (levelFilter.length === 0 ||
        levelFilter.includes(String(Math.floor(eventCourse.catalog_number / 100) * 100))) &&
      (gradingFilter.length === 0 || gradingFilter.includes(eventCourse.grading_basis))
    );
  });

  const defaultColor: string = '#657786';

  const today: Date = new Date();
  const weekStart: Date = startOfWeek(today, { weekStartsOn: 1 });
  const weekdays: Date[] = Array.from({ length: 5 }, (_, calendarIndex) =>
    addDays(weekStart, calendarIndex)
  );

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
    return eventGroup.map((event, calendarIndex) => ({
      ...event,
      width,
      offsetLeft: calendarIndex * width,
      color: defaultColor,
      textColor: getTextColor(defaultColor),
    }));
  });

  useEffect(() => {
    const savedTerm = localStorage.getItem('activeTerm');
    if (savedTerm) {
      const term: AcademicTerm = JSON.parse(savedTerm);
      fetchCalendarState(term);
    } else {
      const term: AcademicTerm = {
        term_code: terms[defaultTerm],
        suffix: defaultTerm,
      };
      fetchCalendarState(term);
      localStorage.setItem('activeTerm', JSON.stringify(term));
    }
  }, [defaultTerm, fetchCalendarState]);

  useEffect(() => {
    const term: AcademicTerm = {
      term_code: terms[defaultTerm],
      suffix: defaultTerm,
    };
    fetchCalendarState(term);
  }, [fetchCalendarState]);

  useEffect(() => {
    fetchCalendarState(activeConfiguration.term);
  }, [fetchCalendarState, activeConfiguration]);

  useEffect(() => {
    console.log('selected courses updated:', selectedCourses);
  }, [selectedCourses]);

  const handleClick = (event: CalendarEvent): void => {
    activateSection(activeConfiguration.term, activeConfiguration.schedule, event);
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

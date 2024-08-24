// src/utils/timeUtils.ts

import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

import { CalendarEvent } from '@/types';

const START_HOUR = 9;

export const getTextColor = (backgroundColor: string): string => {
  const rgb = parseInt(backgroundColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return brightness < 128 ? 'text-white' : 'text-gray-800';
};

export const getDayIndex = (day: string): number => {
  const days = ['M', 'T', 'W', 'R', 'F'];
  return days.indexOf(day);
};

export const getRowIndex = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours - START_HOUR) * 2 + Math.floor(minutes / 30);
};

export const processEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  return events.flatMap((event) => {
    return event.days.split('').map((day) => ({
      ...event,
      startColumnIndex: getDayIndex(day),
      startRowIndex: getRowIndex(event.startTime),
      endRowIndex: getRowIndex(event.endTime),
    }));
  });
};

export const groupAndFlattenEvents = (
  events: CalendarEvent[],
  defaultColor: string
): CalendarEvent[] => {
  const groupedEvents: Record<string, CalendarEvent[]> = {};

  events.forEach((event) => {
    const key = `${event.startColumnIndex}-${event.startRowIndex}-${event.endRowIndex}`;
    if (!groupedEvents[key]) {
      groupedEvents[key] = [];
    }
    groupedEvents[key].push(event);
  });

  return Object.values(groupedEvents).flatMap((eventGroup) => {
    const width = 1 / eventGroup.length;
    return eventGroup.map((event, index) => ({
      ...event,
      width,
      offsetLeft: index * width,
      color: defaultColor,
      textColor: getTextColor(defaultColor),
    }));
  });
};

export const getFormattedDays = (): { name: string; date: number; current: boolean }[] => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekdays = Array.from({ length: 5 }, (_, index) => addDays(weekStart, index));

  return weekdays.map((date) => ({
    name: format(date, 'EEEE'),
    date: Number(format(date, 'd')),
    current: isSameDay(date, today),
  }));
};

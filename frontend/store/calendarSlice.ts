import { create } from 'zustand';

import { CalendarEvent, ClassMeeting, Course, Section } from '@/types';

interface calendarStore {
  calendarSearchResults: Course[];
  selectedCourses: CalendarEvent[];

  recentSearches: string[];

  error: string | null;
  loading: boolean;

  setCalendarSearchResults: (results: Course[]) => void; // Sets search results
  setSelectedCourse: (event: CalendarEvent) => void; // Adds course to selectedCourses

  addRecentSearch: (search: string) => void; // Caches search to recent searches

  addCourseToCalendar: (course: Course) => Promise<void>; // Render to calendar
  removeCourse: (guid: string) => void; // Removes course from calendar
  removeSelectedSection: (guid: string) => void; // Deactivates a selected section

  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const startHour = 8;
const dayToStartColumnIndex: Record<string, number> = {
  M: 1, // Monday
  T: 2, // Tuesday
  W: 3, // Wednesday
  Th: 4, // Thursday
  F: 5, // Friday
};

const headerRows = 2; // Rows taken up by the header
const calculateGridRow = (timeString: string) => {
  const [time, period] = timeString.split(' ');
  const [hour, minute] = time.split(':').map(Number);

  let adjustedHour = hour;
  if (period === 'PM' && hour !== 12) {
    adjustedHour += 12;
  } else if (period === 'AM' && hour === 12) {
    adjustedHour = 0;
  }

  const rowsPerHour = 6; // 10-minute increments (60 minutes / 10 minutes)
  const minuteOffset = Math.floor(minute / 10);

  return (adjustedHour - startHour) * rowsPerHour + minuteOffset + headerRows;
};

const getStartColumnIndexForDays = (daysString: string): number[] => {
  const daysArray = daysString.split(',');
  return daysArray.map((day) => dayToStartColumnIndex[day.trim()] || 0);
};

const useCalendarStore = create<calendarStore>((set, get) => ({
  calendarSearchResults: [],
  selectedCourses: [],
  recentSearches: [],
  error: null,
  loading: false,

  setCalendarSearchResults: (results) => set({ calendarSearchResults: results }),
  addRecentSearch: (search) =>
    set((state) => ({ recentSearches: [...state.recentSearches, search] })),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),

  addCourseToCalendar: async (course: Course) => {
    const selectedCourses = get().selectedCourses;

    if (selectedCourses.some((event) => event.course.guid === course.guid)) {
      console.log('Course already added:', course);
      // TODO: Return a snackbar/toast or something nice if the course is already added
      return;
    }

    set({ loading: true, error: null });

    try {
      const term = course.guid.substring(0, 4);
      const course_id = course.guid.substring(4);
      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_classes/${term}/${course_id}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch course details');
      }

      const sections = await response.json();

      const calendarEvents: CalendarEvent[] = sections.flatMap((section: Section) =>
        section.class_meetings.flatMap((classMeeting: ClassMeeting) => {
          const startColumnIndices = getStartColumnIndexForDays(classMeeting.days);
          return startColumnIndices.map((startColumnIndex) => ({
            key: `${course.guid}-${section.id}-${classMeeting.id}-${startColumnIndex}`,
            course: course,
            section: section,
            startTime: classMeeting.start_time,
            endTime: classMeeting.end_time,
            startColumnIndex,
            startRowIndex: calculateGridRow(classMeeting.start_time),
            endRowIndex: calculateGridRow(classMeeting.end_time),
            isActive: true,
          }));
        })
      );

      set((state) => ({
        selectedCourses: [...state.selectedCourses, ...calendarEvents],
        loading: false,
      }));
    } catch (error) {
      console.error('Error adding course:', error);
      set({ error: 'Failed to add course. Please try again.', loading: false });
    }
  },

  removeCourse: (guid) => {
    set((state) => ({
      selectedCourses: state.selectedCourses.filter((event) => String(event.course.guid) !== guid),
    }));
  },

  toggleSectionVisibility: (sectionId: number) => {
    set((state) => ({
      selectedCourses: state.selectedCourses.map((event) => {
        if (event.section.id === sectionId) {
          return { ...event, isActive: !event.isActive };
        }
        return event;
      }),
    }));
  },

  activateSection: (sectionId: number) => {
    set((state) => ({
      selectedCourses: state.selectedCourses.map((event) => {
        if (event.section.class_type === 'Precept' || event.section.class_type === 'Lab') {
          return { ...event, isActive: event.section.id === sectionId };
        }
        return event;
      }),
    }));
  },

  setSelectedCourse: (event: CalendarEvent) =>
    set((state) => {
      console.log('Attempting to add section to selected:', event.section);

      const newEvents: CalendarEvent[] = event.section.class_meetings.map(
        (classMeeting: ClassMeeting) => {
          const startColumnIndices = getStartColumnIndexForDays(classMeeting.days);
          return {
            key: `${event.section.class_section}-${classMeeting.id}`,
            course: event.course,
            section: event.section,
            startTime: classMeeting.start_time,
            endTime: classMeeting.end_time,
            startColumnIndex: startColumnIndices[0],
            startRowIndex: calculateGridRow(classMeeting.start_time),
            endRowIndex: calculateGridRow(classMeeting.end_time),
            isActive: state.selectedCourses.some(
              (selectedEvent: CalendarEvent) => selectedEvent.section.id === event.section.id
            ),
          };
        }
      );

      console.log('Updating calendar events:', newEvents);

      return {
        ...state,
        selectedCourses: state.selectedCourses.map((selectedEvent: CalendarEvent) => {
          const updatedEvent = newEvents.find(
            (newEvent: CalendarEvent) => newEvent.section.id === selectedEvent.section.id
          );
          return updatedEvent ? updatedEvent : selectedEvent;
        }),
      };
    }),

  removeSelectedSection: (guid) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((event) =>
        String(event.course.guid) === guid ? { ...event, selectedSection: undefined } : event
      ),
    })),
}));

export default useCalendarStore;

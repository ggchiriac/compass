import { create } from 'zustand';

import { CalendarEvent, ClassMeeting, Course, Section } from '@/types';

import SelectedCourses from '@/app/calendar/SelectedCourses';

import useFilterStore from './filterSlice';

interface calendarStore {
  calendarSearchResults: Course[];
  selectedCourses: CalendarEvent[];
  recentSearches: string[];
  error: string | null;
  loading: boolean;

  setCalendarSearchResults: (results: Course[]) => void;
  setSelectedCourses: (courses: CalendarEvent[]) => void;
  addRecentSearch: (search: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  addCourse: (course: Course) => Promise<void>;
  removeCourse: (courseId: string) => void;
  removeSelectedSection: (courseId: string) => void;
}

const startHour = 7;
const dayToStartColumnIndex: Record<string, number> = {
  M: 1, // Monday
  T: 2, // Tuesday
  W: 3, // Wednesday
  Th: 4, // Thursday
  F: 5, // Friday
};

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

  return (adjustedHour - startHour) * rowsPerHour + minuteOffset;
};

const getStartColumnIndexForDays = (daysString: string): number[] => {
  const daysArray = daysString.split(',');
  return daysArray.map((day) => dayToStartColumnIndex[day.trim()] || 0);
};

const useCalendarStore = create<calendarStore>((set) => ({
  calendarSearchResults: [],
  selectedCourses: [],
  recentSearches: [],
  error: null,
  loading: false,
  addCourse: async (course: Course) => {
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

      const details = await response.json();
      console.log('Calendar Search Results!:', details);
      const calendarEvents: CalendarEvent[] = details.sections.flatMap((section: Section) =>
        section.classMeetings.map((classMeeting: ClassMeeting) => ({
          key: `${course.courseId}-${section.sectionId}-${classMeeting.classMeetingId}`,
          course,
          section,
          startTime: classMeeting.startTime,
          endTime: classMeeting.endTime,
          startColumnIndex: getStartColumnIndexForDays(classMeeting.meetingDays)[0],
          startRowIndex: calculateGridRow(classMeeting.startTime),
          endRowIndex: calculateGridRow(classMeeting.endTime),
        }))
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
  removeCourse: (courseId) => {
    set((state) => ({
      selectedCourses: state.selectedCourses.filter(
        (event) => String(event.course.guid) !== courseId
      ),
    }));
  },
  setCalendarSearchResults: (results) => set({ calendarSearchResults: results }),
  setSelectedCourses: (courses) => set({ selectedCourses: courses }),
  addRecentSearch: (search) => {
    const trimmedSearch = search.trim().slice(0, 120);
    set((state) => ({
      recentSearches: [...new Set([trimmedSearch, ...state.recentSearches])].slice(0, 5),
    }));
  },
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  removeSelectedSection: (courseId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((event) =>
        String(event.course.guid) === courseId ? { ...event, selectedSection: undefined } : event
      ),
    })),
}));

export default useCalendarStore;

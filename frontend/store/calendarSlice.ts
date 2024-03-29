import { create } from 'zustand';

import { CalendarEvent, Course } from '@/types';

import useFilterStore from './filterSlice';

interface calendarStore {
  selectedCourses: CalendarEvent[];
  calendarSearchResults: Course[];
  recentSearches: string[];
  error: string | null;
  loading: boolean;
  addCourse: (newCourse: Course) => Promise<void>;
  removeCourse: (courseId: string) => void;
  setSelectedCourses: (courses: CalendarEvent[]) => void;
  setCalendarSearchResults: (results: Course[]) => void;
  addRecentSearch: (search: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  updateSelectedSection: (courseId: string, sectionId: string) => void;
  removeSelectedSection: (courseId: string) => void;
  // isCalendarConflict: (newEvent: CalendarEvent) => boolean;
  // getCalendarEvents: () => CalendarEvent[];
}

const useCalendarStore = create<calendarStore>((set) => ({
  selectedCourses: [],
  calendarSearchResults: [],
  recentSearches: [],
  error: null,
  loading: false,
  addCourse: async (newCourse) => {
    set({ loading: true, error: null });

    try {
      const selectedTerm = useFilterStore.getState().termFilter;
      console.log('Selected term in addCourse:', selectedTerm);
      const response = await fetch(
        `${process.env.BACKEND}/fetch_class_meetings/${newCourse.course_id}/?term=${selectedTerm}`
      );
      const courseDetails = await response.json();

      if (!response.ok) {
        throw new Error(courseDetails.error);
      }

      const courseToAdd: CalendarEvent = {
        ...newCourse,
        ...courseDetails,
        selectedSection: courseDetails.sections[0],
      };

      set((state) => ({
        selectedCourses: [...state.selectedCourses, courseToAdd],
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  removeCourse: (courseId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.filter(
        (event) => String(event.course.guid) !== courseId
      ),
    })),
  setSelectedCourses: (courses) => set({ selectedCourses: courses }),
  setCalendarSearchResults: (results) => set({ calendarSearchResults: results }),
  addRecentSearch: (search) => {
    const trimmedSearch = search.trim().slice(0, 120);
    set((state) => ({
      recentSearches: [...new Set([trimmedSearch, ...state.recentSearches])].slice(0, 5),
    }));
  },
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  updateSelectedSection: (courseId, sectionId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((event) =>
        String(event.course.guid) === courseId
          ? {
              ...event,
              selectedSection: event.course.sections.find(
                (section) => String(section.class_number) === sectionId
              ),
            }
          : event
      ),
    })),
  removeSelectedSection: (courseId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((event) =>
        String(event.course.guid) === courseId ? { ...event, selectedSection: undefined } : event
      ),
    })),
  // isCalendarConflict: (newEvent) => {
  //   const selectedCourses = get().selectedCourses;
  //   return selectedCourses.some((event) =>
  //     event.selectedSection.class_meetings.some((meeting) => {
  //       const newStartTime = new Date(
  //         `2000-01-01T${newEvent.selectedSection.class_meetings[0].start_time}`
  //       ).getTime();
  //       const newEndTime = new Date(
  //         `2000-01-01T${newEvent.selectedSection.class_meetings[0].end_time}`
  //       ).getTime();
  //       const existingStartTime = new Date(`2000-01-01T${meeting.start_time}`).getTime();
  //       const existingEndTime = new Date(`2000-01-01T${meeting.end_time}`).getTime();
  //       return (
  //         newStartTime < existingEndTime &&
  //         existingStartTime < newEndTime &&
  //         meeting.days.some((day) => newEvent.selectedSection.class_meetings[0].days.includes(day))
  //       );
  //     })
  //   );
  // },
  // getCalendarEvents: () => {
  //   const selectedCourses = get().selectedCourses;
  //   return selectedCourses.map((course) => ({
  //     ...course,
  //     startTime: course.selectedSection.class_meetings[0].start_time,
  //     endTime: course.selectedSection.class_meetings[0].end_time,
  //     startColumnIndex: getStartColumnIndexForDays(
  //       course.selectedSection.class_meetings[0].days
  //     )[0],
  //     startRowIndex: calculateGridRow(course.selectedSection.class_meetings[0].start_time),
  //     endRowIndex: calculateGridRow(course.selectedSection.class_meetings[0].end_time),
  //   }));
  // },
}));

export default useCalendarStore;

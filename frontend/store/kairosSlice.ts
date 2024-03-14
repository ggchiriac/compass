import { create } from 'zustand';

import { CalendarEvent, Section, ClassMeeting } from '@/types';

interface KairosStoreState {
  selectedCourses: CalendarEvent[];
  calendarSearchResults: CalendarEvent[];
  recentSearches: string[];
  error: string | null;
  loading: boolean;
  addCourse: (course: CalendarEvent) => void;
  removeCourse: (courseId: string) => void;
  updateCourse: (courseId: string, updatedCourse: Partial<CalendarEvent>) => void;
  setSelectedCourses: (courses: CalendarEvent[]) => void;
  setCalendarSearchResults: (results: Course[]) => void;
  addRecentSearch: (search: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  addSectionToSelectedCourse: (courseId: string, section: Section) => void;
  removeSectionFromSelectedCourse: (courseId: string, sectionId: string) => void;
  addClassMeetingToSelectedSection: (
    courseId: string,
    sectionId: string,
    classMeeting: ClassMeeting
  ) => void;
  removeClassMeetingFromSelectedSection: (
    courseId: string,
    sectionId: string,
    classMeetingId: string
  ) => void;
}

const useKairosStore = create<KairosStoreState>((set) => ({
  selectedCourses: [],
  calendarSearchResults: [],
  recentSearches: [],
  error: null,
  loading: false,
  setSelectedCourses: (courses: CalendarEvent[]) => set({ selectedCourses: courses }),
  addCourse: (course) =>
    set((state) => ({
      selectedCourses: [...state.selectedCourses, { ...course, sections: course.sections || [] }],
    })),
  removeCourse: (courseId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.filter((course) => String(course.guid) !== courseId),
    })),
  updateCourse: (courseId, updatedCourse) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((course) =>
        String(course.guid) === courseId ? { ...course, ...updatedCourse } : course
      ),
    })),
  setCalendarSearchResults: (results) => set({ calendarSearchResults: results }),
  addRecentSearch: (search) => {
    const trimmedSearch = search.trim();
    if (trimmedSearch.length === 0) {
      return;
    }
    const slicedSearch = trimmedSearch.length > 120 ? trimmedSearch.slice(0, 120) : trimmedSearch;
    set((state) => {
      const updatedRecentSearches = [...new Set([slicedSearch, ...state.recentSearches])].slice(
        0,
        5
      );
      return { recentSearches: updatedRecentSearches };
    });
  },
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  addSectionToSelectedCourse: (courseId, section) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((course) =>
        String(course.guid) === courseId
          ? {
              ...course,
              sections: [...(course.sections || []), section],
            }
          : course
      ),
    })),
  removeSectionFromSelectedCourse: (courseId, sectionId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((course) =>
        course.guid === courseId
          ? {
              ...course,
              sections: course.sections.filter(
                (section) => String(section.class_number) !== sectionId
              ),
            }
          : course
      ),
    })),
  addClassMeetingToSelectedSection: (courseId, sectionId, classMeeting) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((course) =>
        String(course.guid) === courseId
          ? {
              ...course,
              sections: course.sections.map((section) =>
                String(section.class_number) === sectionId
                  ? {
                      ...section,
                      class_meetings: [...(section.class_meetings || []), classMeeting],
                    }
                  : section
              ),
            }
          : course
      ),
    })),
  removeClassMeetingFromSelectedSection: (courseId, sectionId, classMeetingId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.map((course) =>
        String(course.guid) === courseId
          ? {
              ...course,
              sections: course.sections.map((section) =>
                String(section.class_number) === sectionId
                  ? {
                      ...section,
                      class_meetings: section.class_meetings.filter(
                        (classMeeting) => String(classMeeting.meeting_number) !== classMeetingId
                      ),
                    }
                  : section
              ),
            }
          : course
      ),
    })),
}));

export default useKairosStore;

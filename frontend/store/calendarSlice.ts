import { create } from 'zustand';

import { CalendarEvent, Section, ClassMeeting } from '@/types';

interface KairosStoreState {
  selectedCourses: CalendarEvent[];
  calendarSearchResults: CalendarEvent[];
  termFilter: string;
  setTermFilter: (term: string) => void;
  recentSearches: string[];
  error: string | null;
  loading: boolean;
  addCourse: (course: CalendarEvent) => void;
  removeCourse: (courseId: string) => void;
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

const useKairosStore = create<KairosStoreState>((set, get) => ({
  selectedCourses: [],
  calendarSearchResults: [],
  termFilter: '',
  setTermFilter: (term) => set({ termFilter: term }),
  recentSearches: [],
  error: null,
  loading: false,
  setSelectedCourses: (courses: CalendarEvent[]) => set({ selectedCourses: courses }),
  addCourse: async (newCourse) => {
    set({ loading: true, error: null });

    try {
      // Get the selected term from the FilterModal
      const selectedTerm = get().termFilter;

      // Include the selected term in the API URL
      const response = await fetch(
        `${process.env.BACKEND}/fetch_class_meetings/${newCourse.course_id}/?term=${selectedTerm}`
      );
      const courseDetails = await response.json();

      if (!response.ok) {
        throw new Error(courseDetails.error);
      }

      const courseToAdd = {
        ...newCourse,
        ...courseDetails,
        sections: courseDetails.sections || [],
      };

      set((state) => {
        const existingCourseIndex = state.selectedCourses.findIndex(
          (course) => course.guid === newCourse.guid
        );

        if (existingCourseIndex !== -1) {
          const existingCourse = state.selectedCourses[existingCourseIndex];
          const updatedSections = courseToAdd.sections.filter(
            (section) =>
              !existingCourse.sections.some(
                (existingSection) => existingSection.class_number === section.class_number
              )
          );

          if (updatedSections.length === 0) {
            return state;
          }

          const updatedCourse = {
            ...existingCourse,
            sections: [...existingCourse.sections, ...updatedSections],
          };

          return {
            ...state,
            selectedCourses: [
              ...state.selectedCourses.slice(0, existingCourseIndex),
              updatedCourse,
              ...state.selectedCourses.slice(existingCourseIndex + 1),
            ],
            loading: false,
          };
        }

        return {
          ...state,
          selectedCourses: [...state.selectedCourses, courseToAdd],
          loading: false,
        };
      });

      console.log('Course Added:', courseToAdd);
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  removeCourse: (courseId) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.filter((course) => String(course.guid) !== courseId),
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

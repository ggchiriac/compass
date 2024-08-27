import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  CalendarEvent,
  // ClassMeeting,
  Course,
  // Section,
  CalendarConfiguration,
  SemesterConfiguration,
  ScheduleSelection,
} from '@/types';

import { fetchCsrfToken } from '@/utils/csrf';

interface CalendarStore {
  calendarSearchResults: Course[];
  selectedCourses: Record<string, CalendarEvent[]>;
  recentSearches: string[];
  error: string | null;
  loading: boolean;
  configurations: CalendarConfiguration[];
  selectedConfiguration: CalendarConfiguration | null;

  setCalendarSearchResults: (results: Course[]) => void;
  addRecentSearch: (search: string) => void;
  fetchCalendarClasses: (term: string, courseId: string) => Promise<CalendarEvent[]>;
  addCourse: (course: Course) => Promise<void>;
  removeCourse: (sectionKey: string) => void;
  activateSection: (event: CalendarEvent) => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  getCalendarConfigurations: (termCode?: string) => Promise<void>;
  createCalendarConfiguration: (name: string) => Promise<void>;
  getSemesterConfiguration: (
    configurationId: number,
    termCode: string
  ) => Promise<SemesterConfiguration>;
  updateSemesterConfiguration: (
    configurationId: number,
    termCode: string,
    data: Partial<SemesterConfiguration>
  ) => Promise<void>;
  updateScheduleSelection: (
    configurationId: number,
    termCode: string,
    index: number,
    data: Partial<ScheduleSelection>
  ) => Promise<void>;
  getSelectedCourses: (semester: string) => CalendarEvent[];
  setSelectedConfiguration: (configuration: CalendarConfiguration | null) => void;
}

const startHour = 8;
const dayToStartColumnIndex: Record<string, number> = {
  M: 1,
  T: 2,
  W: 3,
  Th: 4,
  F: 5,
};

const headerRows = 2;
const calculateGridRow = (timeString: string) => {
  const [time, period] = timeString.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  let adjustedHour = hour;
  if (period === 'PM' && hour !== 12) {
    adjustedHour += 12;
  } else if (period === 'AM' && hour === 12) {
    adjustedHour = 0;
  }
  const rowsPerHour = 6;
  const minuteOffset = Math.floor(minute / 10);
  return (adjustedHour - startHour) * rowsPerHour + minuteOffset + headerRows;
};

const getStartColumnIndexForDays = (daysString: string): number[] => {
  const daysArray = daysString.split(',');
  return daysArray.map((day) => dayToStartColumnIndex[day.trim()] || 0);
};

const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      calendarSearchResults: [],
      selectedCourses: {},
      recentSearches: [],
      error: null,
      loading: false,
      configurations: [],
      selectedConfiguration: null,

      setCalendarSearchResults: (results) => set({ calendarSearchResults: results }),
      addRecentSearch: (search) =>
        set((state) => ({ recentSearches: [...state.recentSearches, search] })),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),

      fetchCalendarClasses: async (term: string, courseId: string) => {
        set({ loading: true, error: null });
        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(
            `${process.env.BACKEND}/fetch_calendar_classes/${term}/${courseId}`,
            {
              headers: { 'X-CSRFToken': csrfToken },
              credentials: 'include',
            }
          );
          if (!response.ok) {
            throw new Error('Failed to fetch calendar classes');
          }
          const sections = await response.json();
          set({ loading: false });
          return sections;
        } catch (error) {
          set({ error: 'Failed to fetch calendar classes. Please try again.', loading: false });
          return [];
        }
      },

      addCourse: async (course: Course) => {
        const term = course.guid.substring(0, 4);
        const selectedCourses = get().getSelectedCourses(term);

        if (selectedCourses.some((event) => event.course.guid === course.guid)) {
          return;
        }
        set({ loading: true, error: null });

        try {
          const course_id = course.guid.substring(4);
          const response = await fetch(
            `${process.env.BACKEND}/fetch_calendar_classes/${term}/${course_id}`
          );
          if (!response.ok) {
            throw new Error('Failed to fetch course details');
          }

          const sections = await response.json();

          const calendarEvents = sections.flatMap((section) =>
            section.class_meetings.flatMap((classMeeting) => {
              const startColumnIndices = getStartColumnIndexForDays(classMeeting.days);
              return startColumnIndices.map((startColumnIndex) => ({
                key: `guid: ${course.guid}, section id: ${section.id}, class meeting id: ${classMeeting.id}, column: ${startColumnIndex}`,
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
            selectedCourses: {
              ...state.selectedCourses,
              [term]: [...selectedCourses, ...calendarEvents],
            },
            loading: false,
          }));
        } catch (error) {
          console.error('Error adding course:', error);
          set({ error: 'Failed to add course. Please try again.', loading: false });
        }
      },

      removeCourse: async (sectionKey: string) => {
        set((state) => {
          const term = Object.keys(state.selectedCourses).find((semester) =>
            state.selectedCourses[semester].some((course) => course.key === sectionKey)
          );
          if (!term) {
            return { selectedCourses: state.selectedCourses };
          }
          const selectedCourses = state.selectedCourses[term];
          const courseToRemove = selectedCourses.find((course) => course.key === sectionKey)?.course
            .guid;
          const updatedCourses = selectedCourses.filter(
            (course) => course.course.guid !== courseToRemove
          );
          return {
            selectedCourses: {
              ...state.selectedCourses,
              [term]: updatedCourses,
            },
          };
        });
        // Update the semester configuration on the backend
        const { selectedConfiguration } = get();
        if (selectedConfiguration) {
          const term = Object.keys(get().selectedCourses).find((semester) =>
            get().selectedCourses[semester].some((course) => course.key === sectionKey)
          );
          if (term) {
            await get().updateSemesterConfiguration(selectedConfiguration.id, term, {
              schedule_selections: get().selectedCourses[term].map(
                (event): ScheduleSelection => ({
                  id: 0, // This will be assigned by the backend
                  semester_configuration: {} as SemesterConfiguration, // This will be assigned by the backend
                  section: event.section,
                  index: event.startColumnIndex,
                  name: `${event.course.course_id} - ${event.section.class_type}`,
                  is_active: event.isActive,
                })
              ),
            });
          }
        }
      },

      activateSection: async (clickedSection: CalendarEvent) => {
        set((state) => {
          const term = clickedSection.course.guid.substring(0, 4);
          const selectedCourses = state.selectedCourses[term] || [];
          const exceptions = ['Lecture', 'Seminar'];
          const isException =
            exceptions.includes(clickedSection.section.class_type) &&
            !(
              clickedSection.section.class_type === 'Seminar' &&
              clickedSection.course.title.includes('Independent Work')
            );
          if (isException) {
            return { selectedCourses: state.selectedCourses };
          }
          const isActiveSingle =
            selectedCourses.filter(
              (section) =>
                section.course.guid === clickedSection.course.guid &&
                section.isActive &&
                section.section.class_type === clickedSection.section.class_type
            ).length === 1;
          const updatedSections = selectedCourses.map((section) => {
            if (section.course.guid !== clickedSection.course.guid) {
              return section;
            }
            if (isActiveSingle && clickedSection.isActive) {
              return section.section.class_type === clickedSection.section.class_type
                ? { ...section, isActive: true }
                : section;
            } else {
              return section.section.class_type === clickedSection.section.class_type
                ? { ...section, isActive: section.key === clickedSection.key }
                : section;
            }
          });
          return {
            selectedCourses: {
              ...state.selectedCourses,
              [term]: updatedSections,
            },
          };
        });
        // Update the semester configuration on the backend
        const { selectedConfiguration } = get();
        if (selectedConfiguration) {
          const term = clickedSection.course.guid.substring(0, 4);
          await get().updateSemesterConfiguration(selectedConfiguration.id, term, {
            schedule_selections: get().selectedCourses[term].map(
              (event): ScheduleSelection => ({
                id: 0, // This will be assigned by the backend
                semester_configuration: {} as SemesterConfiguration, // This will be assigned by the backend
                section: event.section,
                index: event.startColumnIndex,
                name: `${event.course.course_id} - ${event.section.class_type}`,
                is_active: event.isActive,
              })
            ),
          });
        }
      },

      getCalendarConfigurations: async (termCode?: string) => {
        set({ loading: true, error: null });
        try {
          const csrfToken = await fetchCsrfToken();
          const url = termCode
            ? `${process.env.BACKEND}/calendar-configurations/?term_code=${termCode}`
            : `${process.env.BACKEND}/calendar-configurations/`;
          const response = await fetch(url, {
            headers: { 'X-CSRFToken': csrfToken },
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error('Failed to fetch calendar configurations');
          }
          const configurations = await response.json();
          set({ configurations, loading: false });
        } catch (error) {
          set({
            error: 'Failed to fetch calendar configurations. Please try again.',
            loading: false,
          });
        }
      },

      createCalendarConfiguration: async (name: string) => {
        set({ loading: true, error: null });
        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(`${process.env.BACKEND}/calendar-configurations/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ name }),
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error('Failed to create calendar configuration');
          }
          const newConfiguration = await response.json();
          set((state) => ({
            configurations: [...state.configurations, newConfiguration],
            selectedConfiguration: newConfiguration,
            loading: false,
          }));
        } catch (error) {
          set({
            error: 'Failed to create calendar configuration. Please try again.',
            loading: false,
          });
        }
      },

      getSemesterConfiguration: async (configurationId: number, termCode: string) => {
        set({ loading: true, error: null });
        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(
            `${process.env.BACKEND}/semester-configurations/${configurationId}/${termCode}/`,
            {
              headers: { 'X-CSRFToken': csrfToken },
              credentials: 'include',
            }
          );
          if (!response.ok) {
            throw new Error('Failed to fetch semester configuration');
          }
          const semesterConfiguration = await response.json();
          set({ loading: false });
          return semesterConfiguration;
        } catch (error) {
          set({
            error: 'Failed to fetch semester configuration. Please try again.',
            loading: false,
          });
          throw error;
        }
      },

      updateSemesterConfiguration: async (
        configurationId: number,
        termCode: string,
        data: Partial<SemesterConfiguration>
      ) => {
        set({ loading: true, error: null });
        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(
            `${process.env.BACKEND}/semester-configurations/${configurationId}/${termCode}/`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
              },
              body: JSON.stringify(data),
              credentials: 'include',
            }
          );
          if (!response.ok) {
            throw new Error('Failed to update semester configuration');
          }
          set({ loading: false });
        } catch (error) {
          set({
            error: 'Failed to update semester configuration. Please try again.',
            loading: false,
          });
        }
      },

      updateScheduleSelection: async (
        configurationId: number,
        termCode: string,
        index: number,
        data: Partial<ScheduleSelection>
      ) => {
        set({ loading: true, error: null });
        try {
          const csrfToken = await fetchCsrfToken();
          const response = await fetch(
            `${process.env.BACKEND}/schedule-selections/${configurationId}/${termCode}/${index}/`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
              },
              body: JSON.stringify(data),
              credentials: 'include',
            }
          );
          if (!response.ok) {
            throw new Error('Failed to update schedule selection');
          }
          set({ loading: false });
        } catch (error) {
          set({ error: 'Failed to update schedule selection. Please try again.', loading: false });
        }
      },

      getSelectedCourses: (semester) => get().selectedCourses[semester] || [],
      setSelectedConfiguration: (configuration) => set({ selectedConfiguration: configuration }),
    }),
    {
      name: 'calendar-store',
      partialize: (state) => ({
        selectedCourses: state.selectedCourses,
        selectedConfiguration: state.selectedConfiguration,
      }),
    }
  )
);

export default useCalendarStore;

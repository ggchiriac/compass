import { create } from 'zustand';

import { CalendarEvent, ClassMeeting, Course, Section } from '@/types';

import { fetchCsrfToken } from '@/utils/csrf';

interface CalendarStore {
  calendarSearchResults: Course[];
  configurations: Record<string, CalendarEvent[]>;
  activeConfiguration: string;
  recentSearches: string[];
  error: string | null;
  loading: boolean;

  setCalendarSearchResults: (results: Course[]) => void;
  addRecentSearch: (search: string) => void;
  addCourse: (course: Course, configurationId: string) => Promise<void>;
  removeCourse: (sectionId: string, configurationId: string) => void;
  activateSection: (event: CalendarEvent, configurationId: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  getSelectedCourses: (configurationId: string) => CalendarEvent[];
  fetchCalendarState: (termCode: string) => Promise<void>;
  saveCalendarState: (configurationId: string) => Promise<void>;
  // setActiveConfiguration: (configurationId: string) => void;
  // createConfiguration: (termCode: string, name: string) => Promise<void>;
  // deleteConfiguration: (configurationId: string) => Promise<void>;
  // renameConfiguration: (configurationId: string, newName: string) => Promise<void>;
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

const createCalendarEvents = (course: Course, sections: Section[]): CalendarEvent[] => {
  return sections.flatMap((section: Section) =>
    section.class_meetings.flatMap((classMeeting: ClassMeeting) => {
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
};
const useCalendarStore = create<CalendarStore>((set, get) => ({
  calendarSearchResults: [],
  configurations: {},
  activeConfiguration: '',
  recentSearches: [],
  error: null,
  loading: false,

  setCalendarSearchResults: (results) => set({ calendarSearchResults: results }),

  addRecentSearch: (search) =>
    set((state) => ({ recentSearches: [...state.recentSearches, search] })),

  setError: (error) => set({ error }),

  setLoading: (loading) => set({ loading }),

  addCourse: async (course: Course, configurationId: string) => {
    const selectedCourses = get().getSelectedCourses(configurationId);

    if (selectedCourses.some((event) => event.course.guid === course.guid)) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const term = course.guid.substring(0, 4);
      const courseId = course.guid.substring(4);
      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_classes/${term}/${courseId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      const sections = await response.json();
      const calendarEvents: CalendarEvent[] = createCalendarEvents(course, sections);

      set((state) => ({
        configurations: {
          ...state.configurations,
          [configurationId]: [...selectedCourses, ...calendarEvents],
        },
        loading: false,
      }));

      await get().saveCalendarState(configurationId);
    } catch (error) {
      console.error('Error adding course:', error);
      set({ error: 'Failed to add course. Please try again.', loading: false });
    }
  },

  activateSection: (clickedSection, configurationId) => {
    set((state) => {
      const selectedCourses = state.configurations[configurationId] || [];
      const exceptions = ['Lecture', 'Seminar'];

      if (exceptions.includes(clickedSection.section.class_type)) {
        return { configurations: state.configurations };
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
        configurations: {
          ...state.configurations,
          [configurationId]: updatedSections,
        },
      };
    });

    get().saveCalendarState(configurationId);
  },

  removeCourse: (sectionId: string, configurationId: string) => {
    set((state) => {
      const updatedCourses = (state.configurations[configurationId] || []).filter(
        (course) => String(course.section.id) !== sectionId
      );

      return {
        configurations: {
          ...state.configurations,
          [configurationId]: updatedCourses,
        },
      };
    });

    get().saveCalendarState(configurationId);
  },

  getSelectedCourses: (configurationId: string): CalendarEvent[] => {
    configurationId = 'hi';
    return get().configurations[configurationId] || [];
  },

  fetchCalendarState: async (termCode: string) => {
    console.log('fetchcalstate was just hit');

    set({ loading: true, error: null });

    try {
      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_configuration/?term=${termCode}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar configurations');
      }

      const configurations = await response.json();

      const calendarConfigurations: Record<string, CalendarEvent[]> = {};

      for (const configuration of configurations) {
        const calendarEvents: CalendarEvent[] = [];

        for (const selection of configuration.selections) {
          const calendarEvent: CalendarEvent = createCalendarEvents(selection.section.course, [
            selection.section,
          ])[0];
          calendarEvents.push({ ...calendarEvent, isActive: selection.is_active });
        }

        calendarConfigurations[configuration.id] = calendarEvents;
      }

      set({
        configurations: calendarConfigurations,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching calendar configurations:', error);
      set({ error: 'Failed to fetch calendar configurations. Please try again.', loading: false });
    }
  },

  saveCalendarState: async (configurationId: string) => {
    console.log('savecalstate was just hit');

    if (!configurationId) {
      console.error('Invalid configurationId');
      return;
    }
    console.log('Starting to save calendar state...', { configurationId });
    set({ loading: true, error: null });

    try {
      const csrfToken = await fetchCsrfToken();
      console.log('CSRF Token fetched:', { csrfToken });

      const bodyData = {
        selections: get().configurations[configurationId].map((event) => ({
          section: event.section.id,
          is_active: event.isActive,
        })),
      };
      console.log('Prepared body data for PUT request:', { bodyData });

      const response = await fetch(
        `${process.env.BACKEND}/fetch_calendar_configuration/${configurationId}/`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify(bodyData),
        }
      );

      console.log('Response status from saveCalendarState:', response.status);

      if (!response.ok) {
        throw new Error('Failed to save calendar configuration');
      }

      set({ loading: false });
    } catch (error) {
      console.error('Error saving calendar configuration:', error);
      set({ error: 'Failed to save calendar configuration. Please try again.', loading: false });
    }
  },
}));

export default useCalendarStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  ScheduleConfiguration,
  SemesterConfiguration,
  CalendarEvent,
  ClassMeeting,
  Course,
  Section,
  AcademicTerm,
} from '@/types';

import { fetchCsrfToken } from '@/utils/csrf';

type BackendScheduleConfig = {
  id: number;
  scheduleIndex: number;
  name: string;
  courses: CalendarEvent[];
};

type BackendSemesterConfig = {
  id: number;
  term: AcademicTerm;
  configurations: BackendScheduleConfig[];
};

interface CalendarStore {
  calendarSearchResults: Course[];
  configurations: Record<string, SemesterConfiguration>;
  activeConfiguration: { term: AcademicTerm; schedule: ScheduleConfiguration };
  recentSearches: string[];
  error: string | null;
  loading: boolean;

  setCalendarSearchResults: (results: Course[]) => void;
  addRecentSearch: (search: string) => void;
  addCourse: (term: AcademicTerm, schedule: ScheduleConfiguration, course: Course) => Promise<void>;
  removeCourse: (term: AcademicTerm, schedule: ScheduleConfiguration, event: CalendarEvent) => void;
  activateSection: (
    term: AcademicTerm,
    schedule: ScheduleConfiguration,
    event: CalendarEvent
  ) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  getSelectedCourses: (term: AcademicTerm, schedule: ScheduleConfiguration) => CalendarEvent[];
  fetchCalendarState: (term: AcademicTerm) => Promise<void>;
  saveCalendarState: (term: AcademicTerm) => Promise<void>;
  fetchConfigurations: () => Promise<void>;
  setActiveConfiguration: (term: AcademicTerm, schedule: ScheduleConfiguration) => void;
  createConfiguration: (term: AcademicTerm, name: string) => Promise<void>;
  deleteConfiguration: (term: AcademicTerm) => Promise<void>;
  renameConfiguration: (
    term: AcademicTerm,
    configuration: ScheduleConfiguration,
    newName: string
  ) => Promise<void>;
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

const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      calendarSearchResults: [],
      configurations: {},
      activeConfiguration: {
        term: { term_code: '', suffix: '' },
        schedule: {
          id: 0,
          index: 0,
          name: 'Default Schedule', // TODO: Rename to something more dynamic
          courses: [],
        },
      },
      recentSearches: [],
      error: null,
      loading: false,

      setCalendarSearchResults: (results) => set({ calendarSearchResults: results }),
      setActiveConfiguration: (term: AcademicTerm, schedule: ScheduleConfiguration) => {
        console.log('Setting active configuration:', term, schedule);
        set({ activeConfiguration: { term, schedule } });
      },
      addRecentSearch: (search) =>
        set((state) => ({ recentSearches: [...state.recentSearches, search] })),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      getSelectedCourses: (
        term: AcademicTerm,
        schedule: ScheduleConfiguration
      ): CalendarEvent[] => {
        console.log('Getting selected courses for term:', term, 'and schedule:', schedule);
        const semesterConfiguration = get().configurations[term?.term_code];
        if (!semesterConfiguration) {
          return [];
        }

        const scheduleConfiguration = semesterConfiguration.schedule_configurations.find(
          (config) => config.id === schedule.id
        );
        return scheduleConfiguration ? scheduleConfiguration.courses : [];
      },

      addCourse: async (term: AcademicTerm, schedule: ScheduleConfiguration, course: Course) => {
        console.log('Adding course:', course.guid, 'to term:', term, 'and schedule:', schedule);
        const selectedCourses = get().getSelectedCourses(term, schedule);

        if (selectedCourses.some((event) => event.course.guid === course.guid)) {
          console.log('Course already exists in the configuration');
          return;
        }

        set({ loading: true, error: null });

        try {
          const response = await fetch(
            `${process.env.BACKEND}/fetch_calendar_classes/${term?.term_code}/${course.guid}`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch course details');
          }

          const sections = await response.json();
          const calendarEvents: CalendarEvent[] = createCalendarEvents(course, sections);

          set((state) => {
            const semesterConfiguration = state.configurations[term?.term_code];
            const updatedScheduleConfigurations = semesterConfiguration.schedule_configurations.map(
              (config) =>
                config.index === schedule.index
                  ? { ...config, courses: [...config.courses, ...calendarEvents] }
                  : config
            );

            return {
              configurations: {
                ...state.configurations,
                [term?.term_code]: {
                  ...semesterConfiguration,
                  schedule_configurations: updatedScheduleConfigurations,
                },
              },
              loading: false,
            };
          });

          console.log('Course added successfully');
          await get().saveCalendarState(term);
        } catch (error) {
          console.error('Error adding course:', error);
          set({ error: 'Failed to add course. Please try again.', loading: false });
        }
      },

      activateSection: (
        term: AcademicTerm,
        schedule: ScheduleConfiguration,
        clickedEvent: CalendarEvent
      ) => {
        console.log(
          'Activating section:',
          clickedEvent.section.id,
          'in term:',
          term,
          'and schedule:',
          schedule
        );
        set((state) => {
          const semesterConfiguration = state.configurations[term?.term_code];
          if (!semesterConfiguration) {
            return { configurations: state.configurations };
          }

          const scheduleConfiguration = semesterConfiguration.schedule_configurations.find(
            (config) => config.index === schedule.index
          );
          if (!scheduleConfiguration) {
            return { configurations: state.configurations };
          }

          const selectedCourses = scheduleConfiguration.courses;
          const exceptions = ['Lecture', 'Seminar'];

          if (exceptions.includes(clickedEvent.section.class_type)) {
            console.log('Section is a lecture or seminar, no activation needed');
            return { configurations: state.configurations };
          }

          const isActiveSingle =
            selectedCourses.filter(
              (section) =>
                section.course.guid === clickedEvent.course.guid &&
                section.isActive &&
                section.section.class_type === clickedEvent.section.class_type
            ).length === 1;

          const updatedSections = selectedCourses.map((section) => {
            if (section.course.guid !== clickedEvent.course.guid) {
              return section;
            }

            if (isActiveSingle && clickedEvent.isActive) {
              return section.section.class_type === clickedEvent.section.class_type
                ? { ...section, isActive: true }
                : section;
            } else {
              return section.section.class_type === clickedEvent.section.class_type
                ? { ...section, isActive: section.key === clickedEvent.key }
                : section;
            }
          });

          console.log('Section activation updated');
          return {
            configurations: {
              ...state.configurations,
              [term?.term_code]: {
                ...semesterConfiguration,
                schedule_configurations: semesterConfiguration.schedule_configurations.map(
                  (config) =>
                    config.index === schedule.index
                      ? { ...config, courses: updatedSections }
                      : config
                ),
              },
            },
          };
        });

        get().saveCalendarState(term);
      },

      removeCourse: (term: AcademicTerm, schedule: ScheduleConfiguration, event: CalendarEvent) => {
        console.log(
          'Removing course with section ID:',
          event.section.id,
          'from term:',
          term,
          'and schedule:',
          schedule
        );
        set((state) => {
          const semesterConfiguration = state.configurations[term?.term_code];
          if (!semesterConfiguration) {
            return { configurations: state.configurations };
          }

          const updatedScheduleConfigurations = semesterConfiguration.schedule_configurations.map(
            (config) => {
              if (config.index === schedule.index) {
                const updatedCourses = config.courses.filter(
                  (course) => course.section.id !== event.section.id
                );
                return { ...config, courses: updatedCourses };
              }
              return config;
            }
          );

          console.log('Course removed');
          return {
            configurations: {
              ...state.configurations,
              [term?.term_code]: {
                ...semesterConfiguration,
                schedule_configurations: updatedScheduleConfigurations,
              },
            },
          };
        });

        get().saveCalendarState(term);
      },

      fetchCalendarState: async (term: AcademicTerm) => {
        console.log('Fetching calendar state for term:', term);
        set({ loading: true, error: null });

        try {
          const response = await fetch(
            `${process.env.BACKEND}/calendar-configurations/?term_code=${term?.term_code}`,
            {
              credentials: 'include',
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch calendar configuration');
          }

          const configurations = await response.json();
          console.log('Fetched configurations:', configurations);

          if (configurations.length > 0) {
            const configuration = configurations[0];
            const semesterConfiguration: SemesterConfiguration = {
              id: configuration.id,
              term: configuration.term,
              schedule_configurations: configuration.semester_configurations
                ? configuration.semester_configurations.map((config: any) => ({
                    id: config.id,
                    index: config.index,
                    name: config.name,
                    courses: config.schedule_selections
                      ? config.schedule_selections.map((selection: any) => {
                          const calendarEvent: CalendarEvent = createCalendarEvents(
                            selection.section_details?.course,
                            [selection.section_details]
                          )[0];
                          return { ...calendarEvent, isActive: selection.is_active };
                        })
                      : [],
                  }))
                : [],
            };

            console.log('Calendar state fetched successfully');
            set({
              configurations: {
                ...get().configurations,
                [term?.term_code]: semesterConfiguration,
              },
              loading: false,
            });
          } else {
            console.log('No calendar configuration found for the term');
            set({
              configurations: {
                ...get().configurations,
                [term?.term_code]: null,
              },
              loading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching calendar configuration:', error);
          set({
            error: 'Failed to fetch calendar configuration. Please try again.',
            loading: false,
          });
        }
      },

      saveCalendarState: async (term: AcademicTerm) => {
        console.log('Saving calendar state for term:', term);
        if (!term) {
          console.error('Invalid term');
          return;
        }

        set({ loading: true, error: null });

        try {
          const csrfToken = await fetchCsrfToken();
          console.log('CSRF token fetched');

          const semesterConfiguration = get().configurations[term?.term_code];
          const bodyData = {
            term: semesterConfiguration.term,
            configurations: semesterConfiguration.schedule_configurations.map((config) => ({
              scheduleIndex: config.index,
              name: config.name,
              selections: config.courses.map((event) => ({
                section: event.section.id,
                is_active: event.isActive,
              })),
            })),
          };

          const response = await fetch(
            `${process.env.BACKEND}/calendar-configuration/${term?.term_code}/`,
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

          if (!response.ok) {
            throw new Error('Failed to save calendar configuration');
          }

          console.log('Calendar state saved successfully');
          set({ loading: false });
        } catch (error) {
          console.error('Error saving calendar configuration:', error);
          set({
            error: 'Failed to save calendar configuration. Please try again.',
            loading: false,
          });
        }
      },

      fetchConfigurations: async () => {
        // Does this all ONCE at the beginning to cache all semester config info
        // Implement some caching mechenaism for when we should fetch
        console.log('Fetching configurations');
        try {
          const response = await fetch(`${process.env.BACKEND}/calendar-configurations/`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch configurations');
          }

          // Retrieve and map the response to the expected types
          const configurations: BackendSemesterConfig[] = await response.json();
          console.log('Fetched configurations:', configurations);

          // Map the backend response to the SemesterConfiguration type
          const configurationObjects: Record<string, SemesterConfiguration> = {};
          configurations.forEach((config) => {
            const semesterConfig: SemesterConfiguration = {
              id: config.id,
              term: config.term,
              schedule_configurations: config.configurations
                ? config.configurations.map(
                    (scheduleConfig): ScheduleConfiguration => ({
                      id: scheduleConfig.id,
                      index: scheduleConfig.scheduleIndex,
                      name: scheduleConfig.name,
                      courses: scheduleConfig.courses || [],
                    })
                  )
                : [],
            };

            // Check if config.term exists and has a term_code property
            if (config.term && config.term?.term_code) {
              // Use the term_code as a key in the configuration record
              configurationObjects[config.term?.term_code] = semesterConfig;
            } else {
              console.warn('Invalid or missing term in configuration:', config);
            }
          });

          // Update the state with the correctly typed configuration objects
          set({ configurations: configurationObjects });

          // Check if there are any existing configurations
          const termCodes = Object.keys(configurationObjects);
          if (termCodes.length > 0) {
            // Set the first configuration as the active configuration
            const firstTermCode = termCodes[0];
            const firstConfig = configurationObjects[firstTermCode];
            const firstScheduleConfig = firstConfig.schedule_configurations[0];

            console.log(
              'Setting active configuration:',
              firstConfig.term,
              firstScheduleConfig.index
            );
            get().setActiveConfiguration(
              { term_code: firstConfig.term?.term_code, suffix: firstConfig.term.suffix },
              {
                id: firstScheduleConfig.id,
                index: firstScheduleConfig.index,
                name: firstScheduleConfig.name,
                courses: firstScheduleConfig.courses,
              }
            );
          } else {
            // Create a new default configuration and set it as the active configuration
            const defaultTerm: AcademicTerm = { term_code: 'default', suffix: 'Default' };
            const defaultSchedule: ScheduleConfiguration = {
              id: 0,
              index: 0,
              name: 'Default Schedule',
              courses: [],
            };

            console.log('Creating default configuration');
            await get().createConfiguration(defaultTerm, defaultSchedule.name);
            get().setActiveConfiguration(defaultTerm, defaultSchedule);
          }
        } catch (error) {
          console.error('Error fetching configurations:', error);
        }
      },

      createConfiguration: async (term: AcademicTerm, name: string) => {
        console.log('Creating configuration for term:', term, 'with name:', name);
        try {
          const csrfToken = await fetchCsrfToken();
          console.log('CSRF Token fetched:', csrfToken);

          const response = await fetch(`${process.env.BACKEND}/calendar-configurations/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ term, name }),
          });

          if (!response.ok) {
            throw new Error('Failed to create configuration');
          }

          const newConfiguration = await response.json();
          console.log('Created configuration:', newConfiguration);

          set((state) => ({
            configurations: {
              ...state.configurations,
              [term?.term_code]: {
                id: newConfiguration.id,
                term: newConfiguration.term,
                schedule_configurations: newConfiguration.configurations
                  ? newConfiguration.configurations.map((config: any) => ({
                      id: config.id,
                      scheduleIndex: config.scheduleIndex,
                      name: config.name,
                      courses: [],
                    }))
                  : [],
              },
            },
            activeConfiguration: {
              term: newConfiguration.term,
              schedule: newConfiguration.configurations?.[0],
            },
          }));
        } catch (error) {
          console.error('Error creating configuration:', error);
        }
      },

      deleteConfiguration: async (term: AcademicTerm) => {
        console.log('Deleting configuration:', term);
        try {
          const csrfToken = await fetchCsrfToken();
          console.log('CSRF Token fetched:', csrfToken);

          const response = await fetch(
            `${process.env.BACKEND}/calendar-configuration/${term?.term_code}/`,
            {
              method: 'DELETE',
              credentials: 'include',
              headers: {
                'X-CSRFToken': csrfToken,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to delete configuration');
          }

          console.log('Configuration deleted successfully');

          // Update the state using the `set` function
          set((state) => {
            const updatedConfigurations = { ...state.configurations };
            delete updatedConfigurations[term?.term_code];

            // Determine the new active configuration if any remain, or reset to defaults
            const remainingTermCodes = Object.keys(updatedConfigurations);
            let newActiveConfiguration: {
              term: AcademicTerm;
              schedule: ScheduleConfiguration;
            };

            if (remainingTermCodes.length > 0) {
              const firstTermCode = remainingTermCodes[0];
              const firstSchedule = updatedConfigurations[firstTermCode].schedule_configurations[0];

              newActiveConfiguration = {
                term: {
                  term_code: firstTermCode,
                  suffix: updatedConfigurations[firstTermCode].term.suffix,
                },
                schedule: firstSchedule,
              };
            } else {
              newActiveConfiguration = {
                term: { term_code: '', suffix: '' },
                schedule: {
                  id: 0,
                  index: 0,
                  name: '',
                  courses: [],
                },
              };
            }

            return {
              configurations: updatedConfigurations,
              activeConfiguration: newActiveConfiguration,
            };
          });
        } catch (error) {
          console.error('Error deleting configuration:', error);
        }
      },

      renameConfiguration: async (
        term: AcademicTerm,
        configuration: ScheduleConfiguration,
        newName: string
      ) => {
        console.log('Renaming configuration:', term, configuration, 'to:', newName);
        try {
          const csrfToken = await fetchCsrfToken();
          console.log('CSRF Token fetched:', csrfToken);

          const response = await fetch(
            `${process.env.BACKEND}/schedule-configuration/${term?.term_code}/${configuration.id}/`,
            {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
              },
              body: JSON.stringify({ name: newName }),
            }
          );

          if (!response.ok) {
            throw new Error('Failed to rename configuration');
          }

          console.log('Configuration renamed successfully');
          set((state) => ({
            configurations: {
              ...state.configurations,
              [term?.term_code]: {
                ...state.configurations[term?.term_code],
                schedule_configurations: state.configurations[
                  term?.term_code
                ].schedule_configurations.map((config) =>
                  config.id === configuration.id ? { ...config, name: newName } : config
                ),
              },
            },
          }));
        } catch (error) {
          console.error('Error renaming configuration:', error);
        }
      },
    }),
    {
      name: 'calendar-settings',
    }
  )
);

export default useCalendarStore;

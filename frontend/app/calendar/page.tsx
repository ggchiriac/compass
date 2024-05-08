'use client';

import { useEffect, useState, FC, useMemo } from 'react';

import { Pane, Tablist, Tab, IconButton, ChevronLeftIcon, ChevronRightIcon } from 'evergreen-ui';
import { debounce } from 'lodash'; // TODO: Debounce useEffects?

import { AcademicTerm } from '@/types';

import BackgroundGradient from '@/components/BackgroundGradient';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SkeletonApp from '@/components/SkeletonApp';
import tabStyles from '@/components/TabbedMenu/TabbedMenu.module.scss';
import useAuthStore from '@/store/authSlice';
import useCalendarStore from '@/store/calendarSlice';
import useFilterStore from '@/store/filterSlice';
import UserState from '@/store/userSlice';

import './Calendar.scss';
import Calendar from './Calendar';
import ConfigurationSelector from './CalendarConfigurationSelector';
import CalendarSearch from './CalendarSearch';
import SelectedCourses from './SelectedCourses';

const CalendarUI: FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { checkAuthentication } = useAuthStore((state) => state);
  const userProfile = UserState((state) => state.profile);
  const { terms, termsInverse, termFilter, setTermFilter } = useFilterStore((state) => state);

  const {
    configurations,
    activeConfiguration,
    setActiveConfiguration,
    fetchConfigurations,
    createConfiguration,
    deleteConfiguration,
    renameConfiguration,
  } = useCalendarStore((state) => state);

  const semesterList = useMemo(() => Object.keys(terms), [terms]);
  const semestersPerPage = 5;
  const totalPages = useMemo(
    () => Math.ceil(semesterList.length / semestersPerPage),
    [semesterList]
  );

  useEffect(() => {
    const authenticate = async () => {
      await checkAuthentication();
    };
    authenticate();
  }, [checkAuthentication]);

  useEffect(() => {
    const loadConfigurations = async () => {
      await fetchConfigurations(); // Fetching configurations
      setIsLoading(false); // Setting loading to false after fetching
      if (!termFilter) {
        // If no term is currently selected
        const latestTerm = terms[semesterList[semesterList.length - 1]]; // Default to the latest term
        setTermFilter(latestTerm);
        setCurrentPage(totalPages); // Set the current page to the last one
      } else {
        // Find and set the current page based on the selected term
        const selectedTermIndex = semesterList.findIndex((term) => terms[term] === termFilter);
        const selectedPage = Math.ceil(
          (semesterList.length - selectedTermIndex) / semestersPerPage
        );
        setCurrentPage(selectedPage);
      }
      if (Object.keys(configurations).length > 0) {
        const firstKey = parseInt(Object.keys(configurations)[0]); // Default to the first configuration
        setActiveConfiguration(firstKey);
      }
    };
    loadConfigurations();
  }, [
    // Dependencies for the useEffect
    termFilter,
    terms,
    setTermFilter,
    fetchConfigurations,
    setActiveConfiguration,
    // configurations,
    totalPages,
    semesterList,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const selectedSemester =
      semesterList[semesterList.length - ((page - 1) * semestersPerPage + 1)];
    setTermFilter(selectedSemester);
  };

  const handleTermFilterChange = (semester: string) => {
    setTermFilter(semester);
  };

  const startIndex = (currentPage - 1) * semestersPerPage;
  const endIndex = startIndex + semestersPerPage;
  const displayedSemesters = useMemo(
    () => semesterList.slice(startIndex, endIndex),
    [semesterList, startIndex, endIndex]
  );

  return (
    <>
      <Navbar />

      <div className='flex flex-col min-h-screen pt-24'>
        <BackgroundGradient />

        <div className='flex flex-col bg-[#FAFAFA] shadow-xl z-10 rounded overflow-hidden'>
          <div className='flex flex-col items-center p-4'>
            <Pane display='flex' justifyContent='center' alignItems='center' marginBottom={16}>
              <IconButton
                icon={ChevronLeftIcon}
                appearance='minimal'
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                marginRight={8}
              />

              <Tablist>
                {displayedSemesters.map((semester) => (
                  <Tab
                    key={semester}
                    isSelected={termFilter === terms[semester]}
                    onSelect={() => handleTermFilterChange(semester)}
                    marginRight={8}
                    paddingX={12}
                    paddingY={8}
                  >
                    {semester}
                  </Tab>
                ))}
              </Tablist>

              <IconButton
                icon={ChevronRightIcon}
                appearance='minimal'
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                marginLeft={8}
                size='medium'
              />
            </Pane>

            <Pane
              display='flex'
              justifyContent='center'
              alignItems='center'
              backgroundColor='white'
              padding={16}
              borderRadius={8}
              boxShadow='0 2px 4px rgba(0, 0, 0, 0.1)'
            >
              <ConfigurationSelector
                configurations={configurations}
                activeConfiguration={activeConfiguration}
                onConfigurationChange={(configurationId) => setActiveConfiguration(configurationId)}
                onConfigurationCreate={(term: AcademicTerm, name: string) =>
                  createConfiguration(term, name)
                }
                onConfigurationDelete={(configurationId: number) =>
                  deleteConfiguration(configurationId)
                }
                onConfigurationRename={(configurationId: number, index: number, newName: string) =>
                  renameConfiguration(configurationId, index, newName)
                }
                getTermSuffix={(termCode: string) => termsInverse[termCode]}
              />
            </Pane>
          </div>

          <main className='flex flex-grow'>
            <div className='flex w-full h-full'>
              {/* Left Section for Search and Search Results */}
              <div>
                <CalendarSearch />
                <SelectedCourses />
              </div>

              {/* Center Section for Calendar */}
              <div className='flex-grow p-4'>
                {!isLoading && userProfile && userProfile.netId !== '' ? (
                  <Calendar />
                ) : (
                  <SkeletonApp />
                )}
              </div>

              {/* Right Section for Event Details */}
              <div className={tabStyles.tabContainer} style={{ width: '20%' }}>
                <div className={tabStyles.tabContent}>
                  <div className='text-sm font-medium text-gray-500'>
                    <strong>More calendar features</strong> will be available soon. Stay tuned!
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CalendarUI;

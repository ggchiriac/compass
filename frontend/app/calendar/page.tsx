'use client';

import { useEffect, useState, FC, useMemo } from 'react';

import { Pane, Tablist, Tab, IconButton, ChevronLeftIcon, ChevronRightIcon } from 'evergreen-ui';
import { debounce } from 'lodash';

import BackgroundGradient from '@/components/BackgroundGradient';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SkeletonApp from '@/components/SkeletonApp';
import tabStyles from '@/components/TabbedMenu/TabbedMenu.module.scss';
import useAuthStore from '@/store/authSlice';
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
  const {
    terms,
    termFilter,
    setTermFilter,
    fetchFilters,
    saveFilters,
    configurations,
    activeConfiguration,
    setActiveConfiguration,
    fetchConfigurations,
    createConfiguration,
    deleteConfiguration,
    renameConfiguration,
  } = useFilterStore((state) => state);
  const semesterList = Object.keys(terms);
  const semestersPerPage = 5;
  const totalPages = Math.ceil(semesterList.length / semestersPerPage);

  const debouncedSaveFilters = useMemo(() => debounce(saveFilters, 500), [saveFilters]);

  useEffect(() => {
    const init = async () => {
      await checkAuthentication();
      await fetchConfigurations(termFilter);
      setIsLoading(false);

      if (!termFilter) {
        const latestTerm = terms[semesterList[semesterList.length - 1]];
        setTermFilter(latestTerm);
        setCurrentPage(totalPages);
      } else {
        const selectedTermIndex = semesterList.findIndex((term) => terms[term] === termFilter);
        const selectedPage = Math.ceil(
          (semesterList.length - selectedTermIndex) / semestersPerPage
        );
        setCurrentPage(selectedPage);
      }

      if (activeConfiguration) {
        await fetchFilters(activeConfiguration);
      }
    };

    init();
  }, [checkAuthentication, terms, setTermFilter, fetchConfigurations, activeConfiguration]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const selectedSemester =
      semesterList[semesterList.length - ((page - 1) * semestersPerPage + 1)];
    setTermFilter(terms[selectedSemester]);
    debouncedSaveFilters(activeConfiguration);
  };

  const handleTermFilterChange = (semester: string) => {
    setTermFilter(terms[semester]);
    debouncedSaveFilters(activeConfiguration);
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
                onConfigurationChange={setActiveConfiguration}
                onConfigurationCreate={async (name) => {
                  console.log('Configuration Name:', name);
                  await createConfiguration(name);
                }}
                onConfigurationDelete={deleteConfiguration}
                onConfigurationRename={renameConfiguration}
                getTermSuffix={(configId) => terms[configId]}
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

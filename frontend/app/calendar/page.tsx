'use client';

import { useEffect, useState, FC, useMemo } from 'react';

import {
  Pane,
  Tablist,
  Tab,
  IconButton,
  ChevronLeftIcon,
  ChevronRightIcon,
  Button,
  toaster,
} from 'evergreen-ui';

import BackgroundGradient from '@/components/BackgroundGradient';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SkeletonApp from '@/components/SkeletonApp';
import useAuthStore from '@/store/authSlice';
import useFilterStore from '@/store/filterSlice';
import UserState from '@/store/userSlice';

import './Calendar.scss';
import Calendar from './Calendar';
import ConfigurationSelector from './CalendarConfigurationSelector';
import CalendarSearch from './CalendarSearch';
import SelectedCourses from './SelectedCourses';

const CalendarUI: FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(2);
  const { checkAuthentication } = useAuthStore((state) => state);
  const userProfile = UserState((state) => state.profile);
  const { terms, termFilter, setTermFilter } = useFilterStore((state) => state);
  const semesterList = useMemo(() => Object.keys(terms).reverse(), [terms]);
  const semestersPerPage = 5;
  const totalPages = Math.ceil(semesterList.length / semestersPerPage);

  const [configurations, setConfigurations] = useState([]);
  const [activeConfiguration, setActiveConfiguration] = useState(null);

  // const fetchConfigurations = async () => {
  //   try {
  //     const response = await fetch(`${process.env.BACKEND}/calendar-configurations/`);
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch calendar configurations');
  //     }
  //     const data = await response.json();
  //     setConfigurations(data);
  //     if (data.length > 0 && !activeConfiguration) {
  //       setActiveConfiguration(data[0].id);
  //     }
  //   } catch (error) {
  //     toaster.danger('Error fetching configurations');
  //   }
  // };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkAuthentication();
        // await fetchConfigurations(); // TODO: Things may break when this is uncommented
      } catch (error) {
        toaster.danger('Error initializing the application');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [checkAuthentication]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const selectedSemester =
        semesterList[semesterList.length - ((page - 1) * semestersPerPage + 1)];
      setTermFilter(terms[selectedSemester]);
    }
  };

  const startIndex = (currentPage - 1) * semestersPerPage;
  const endIndex = startIndex + semestersPerPage;
  const displayedSemesters = semesterList.slice(startIndex, endIndex);

  // Mock functions for configuration management (replace with actual API calls)
  const handleConfigurationChange = (configId: string) => {
    setActiveConfiguration(configId);
  };

  const handleConfigurationCreate = async (name: string) => {
    const newConfig = { id: String(configurations.length + 1), name };
    setConfigurations([...configurations, newConfig]);
  };

  const handleConfigurationDelete = async (configId: string) => {
    setConfigurations(configurations.filter((config) => config.id !== configId));
  };

  const handleConfigurationRename = (configId: string, newName: string) => {
    setConfigurations(
      configurations.map((config) =>
        config.id === configId ? { ...config, name: newName } : config
      )
    );
  };

  const getTermSuffix = (configId: string) => {
    // Mock function to get term suffix (replace with actual logic)
    return `Term ${configId}`;
  };

  return (
    <>
      <Navbar />
      <div className='flex flex-col min-h-screen pt-24'>
        <BackgroundGradient />
        <div className='flex flex-col bg-[#FAFAFA] shadow-xl z-10 rounded overflow-hidden'>
          <main className='flex flex-grow'>
            <div className='w-1/3 p-4'>
              <div className='flex justify-center mb-4'>
                <Pane display='flex' justifyContent='center' alignItems='center'>
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
                        onSelect={() => setTermFilter(terms[semester])}
                        marginX={4}
                        paddingX={8}
                        paddingY={6}
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
              </div>
              <CalendarSearch />
              <SelectedCourses />
            </div>

            <div className='flex-grow p-4'>
              <div className='mb-4 flex justify-between items-center'>
                <ConfigurationSelector
                  configurations={configurations}
                  activeConfiguration={activeConfiguration}
                  onChangeConfiguration={handleConfigurationChange}
                  onCreateConfiguration={handleConfigurationCreate}
                  onDeleteConfiguration={handleConfigurationDelete}
                  onRenameConfiguration={handleConfigurationRename}
                  getTermSuffix={getTermSuffix}
                />
                <div className='flex space-x-2'>
                  <Button>Optimize</Button>
                  <Button>Difficulty</Button>
                  <Button>Export</Button>
                </div>
              </div>
              {!loading && userProfile && userProfile.netId !== '' ? <Calendar /> : <SkeletonApp />}
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CalendarUI;

import { FC } from 'react';

import { Virtuoso } from 'react-virtuoso';

import { SearchResults } from '@/types';

import containerStyles from '@/components/Container/Container.module.scss';

import CalendarSearchItem from './CalendarSearchItem';
import styles from './CalendarSelectedCourses.module.scss';

const CalendarSearchResults: FC<SearchResults> = ({ courses = [] }) => {
  return (
    <div className={`${containerStyles.Container} ${styles.Container}`}>
      <div className={containerStyles.Header}></div>
      <div className='flex-1 overflow-hidden rounded-lg shadow-md'>
        <Virtuoso
          style={{ height: '400px' }}
          data={courses}
          itemContent={(_, course) => <CalendarSearchItem course={course} />}
        />
      </div>
    </div>
  );
};

export default CalendarSearchResults;

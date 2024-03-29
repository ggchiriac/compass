import { useEffect } from 'react';

import { Virtuoso } from 'react-virtuoso';

import { SearchResults } from '@/types';

import { Item } from '@/components/Item';

import styles from './CalendarSelectedCourses.module.scss';
import SelectedCourses from './SelectedCourses';

const CalendarSearchResults: React.FC<SearchResults> = ({ courses = [] }) => {
  useEffect(() => {
    console.log('Search Results:', courses);
  }, [courses]);

  return (
    <div className={styles.Container}>
      <div className={styles.Header}></div>
      <Virtuoso
        style={{ height: '50%' }}
        data={courses}
        itemContent={(index, course) => (
          <Item
            key={course.guid}
            value={`${course.department_code} ${course.catalog_number} | ${course.title}`}
            // className={styles.Item}
            // TODO: Maybe add color.
            // color_primary={`#${course.color_primary}`}
            // color_secondary={`#${course.color_secondary}`}
          />
        )}
      />
      <div className={styles.SelectedCoursesWrapper}>
        <SelectedCourses />
      </div>
    </div>
  );
};

export default CalendarSearchResults;

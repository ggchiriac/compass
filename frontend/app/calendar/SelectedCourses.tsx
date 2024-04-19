import { FC, useMemo } from 'react';

import { Virtuoso } from 'react-virtuoso';

import containerStyles from '@/components/Container/Container.module.scss';
import useCalendarStore from '@/store/calendarSlice';
import useFilterStore from '@/store/filterSlice';

import styles from './CalendarSelectedCourses.module.scss';

const SelectedCourses: FC = () => {
  const { termFilter } = useFilterStore((state) => state);
  const selectedCourses = useCalendarStore((state) => state.getSelectedCourses(termFilter));

  const removeCourse = useCalendarStore((state) => state.removeCourse);

  const uniqueCourses = useMemo(() => {
    const seenGuids = new Set();

    return selectedCourses.filter((course) => {
      const isNew = !seenGuids.has(course.course.guid);

      if (isNew) {
        seenGuids.add(course.course.guid);
      }

      return isNew;
    });
  }, [selectedCourses]);

  return (
    <div className={`${containerStyles.Container} ${styles.Container}`}>
      <div className={containerStyles.Header}>
        <h3>Selected Courses</h3>
      </div>

      <div className='flex-1 overflow-hidden rounded-lg shadow-md'>
        {uniqueCourses.length === 0 ? (
          <p>No courses selected yet.</p>
        ) : (
          <Virtuoso
            data={uniqueCourses}
            itemContent={(_, course) => (
              <div key={course.course.guid} className={styles.item}>
                <div className={styles.textContainer}>
                  {`${course.course.department_code} ${course.course.catalog_number} - ${course.course.title}`}
                </div>

                <div className={styles.actions}>
                  <button onClick={() => removeCourse(course.key)}>Remove</button>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default SelectedCourses;

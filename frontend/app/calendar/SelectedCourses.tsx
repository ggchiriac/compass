import { Virtuoso } from 'react-virtuoso';

import { Item } from '@/components/Item';
import useCalendarStore from '@/store/calendarSlice';

import styles from './CalendarSelectedCourses.module.scss';

const SelectedCourses: React.FC = () => {
  const selectedCourses = useCalendarStore((state) => state.selectedCourses);
  return (
    <div className={styles.SelectedCourses}>
      <div className={styles.Header}>
        <h3>Selected Courses</h3>
      </div>
      <Virtuoso
        style={{ height: '100%' }}
        data={selectedCourses}
        itemContent={(_, course) => (
          <Item
            key={course.course.guid}
            value={`${course.course.department_code} ${course.course.catalog_number}`}
          />
        )}
      />
    </div>
  );
};

export default SelectedCourses;

import { Virtuoso } from 'react-virtuoso';

import { Item } from '@/components/Item';
import useCalendarStore from '@/store/calendarSlice';

import styles from './CalendarSelectedCourses.module.scss';

// function simpleHash(str: string): number {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i);
//     hash = (hash << 5) - hash + char;
//     hash &= hash; // Convert to 32bit integer
//   }
//   return Math.abs(hash);
// }

// const PRIMARY_COLOR_LIST = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#6C5CE7'];
// const SECONDARY_COLOR_LIST = ['#FF8E8E', '#FFE27D', '#8EDFA2', '#7EAEFF', '#9B8DF2'];

// function getPrimaryColor(id: String) {
//   const hash = simpleHash(String(id).split('|')[1].slice(0, 3));
//   return PRIMARY_COLOR_LIST[hash % PRIMARY_COLOR_LIST.length];
// }

// function getSecondaryColor(id: String) {
//   const hash = simpleHash(String(id).split('|')[1].slice(0, 3));
//   return SECONDARY_COLOR_LIST[hash % SECONDARY_COLOR_LIST.length];
// }

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
            // color_primary={getPrimaryColor(course.course.guid)}
            // color_secondary={getSecondaryColor(course.course.guid)}
          />
        )}
      />
    </div>
  );
};

export default SelectedCourses;

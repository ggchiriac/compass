// import { FC } from 'react';

// import { Virtuoso } from 'react-virtuoso';

// import { Item } from '@/components/Item';
// import useCalendarStore from '@/store/calendarSlice';

// import styles from './CalendarSelectedCourses.module.scss';

// const SelectedCourses: FC = () => {
//   const selectedCourses = useCalendarStore((state) => state.selectedCourses);
//   const removeCourse = useCalendarStore((state) => state.removeCourse);

//   return (
//     <div className={styles.SelectedCourses}>
//       <div className={styles.Header}>
//         <h3>Selected Courses</h3>
//       </div>
//       {selectedCourses.length === 0 ? (
//         <p>No courses selected yet.</p>
//       ) : (
//         <Virtuoso
//           style={{ height: '100%' }}
//           data={selectedCourses}
//           itemContent={(_, event) => (
//             <Item
//               key={event.key}
//               value={`${event.course.department_code} ${event.course.catalog_number}`}
//               onRemove={() => removeCourse(String(event.course.guid))}
//             />
//           )}
//         />
//       )}
//     </div>
//   );
// };

// export default SelectedCourses;

import { FC } from 'react';

import useCalendarStore from '@/store/calendarSlice';

import styles from './CalendarSelectedCourses.module.scss';

const SelectedCourses: FC = () => {
  const selectedCourses = useCalendarStore((state) => state.selectedCourses);
  const removeCourse = useCalendarStore((state) => state.removeCourse);

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <h3>Selected Courses</h3>
      </div>
      {selectedCourses.length === 0 ? (
        <p>No courses selected yet.</p>
      ) : (
        <ul>
          {selectedCourses.map((event) => (
            <li key={event.key} className={styles.item}>
              <div className={styles.textContainer}>
                {`${event.course.department_code} ${event.course.catalog_number}`}
              </div>
              <div className={styles.actions}>
                <button onClick={() => removeCourse(String(event.course.guid))}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectedCourses;

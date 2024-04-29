// CalendarSearchItem.jsx
import useCalendarStore from '@/store/calendarSlice';
import { termsInverse } from '@/utils/terms';

import styles from './CalendarSearchItem.module.scss';

const CalendarSearchItem = ({ course }) => {
  const addCourse = useCalendarStore((state) => state.addCourse);

  const handleClick = () => {
    addCourse(course);
  };

  const termCode = course.guid.slice(0, 4);
  const semester = termsInverse[termCode];

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.crosslistings}>{course.crosslistings}</div>
        </div>
        <div className={styles.title}>{course.title}</div>
      </div>
      <div className={styles.meta}>
        <div className={styles.semester}>{semester}</div>
        <div className={styles.actions}>
          <button className={styles.button}>Add</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarSearchItem;

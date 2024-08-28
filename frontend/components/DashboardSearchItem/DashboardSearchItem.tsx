import { termsInverse } from '@/utils/terms';

import styles from './DashboardSearchItem.module.scss';

const DashboardSearchItem = ({ course }) => {
  const handleClick = () => {
    console.log('Search result clicked');
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

export default DashboardSearchItem;

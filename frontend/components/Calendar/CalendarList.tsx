// Renders course list and selected courses section

import Paper from '@mui/material/Paper';
import { FixedSizeList as VirtualList } from 'react-window';

import { CalendarEvent } from '@/types';

import useKairosStore from '@/store/kairosSlice';

import CourseListItem from './CourseListItem';
import SelectedCourses from './SelectedCourses';

const styles = {
  paper: {
    margin: '20px 0',
    overflow: 'auto',
  },
  virtualList: {
    outline: 'none',
  },
};

interface CalendarListProps {
  items?: CalendarEvent[];
}

const CalendarList: React.FC<CalendarListProps> = ({ items = [] }) => {
  return (
    <div>
      <Paper style={{ ...styles.paper, height: 350, width: '100%' }}>
        <VirtualList
          height={350}
          width='100%'
          itemSize={46}
          itemCount={items.length}
          itemData={items}
          style={styles.virtualList}
        >
          {CourseListItem}
        </VirtualList>
      </Paper>
      <SelectedCourses />
    </div>
  );
};

export default CalendarList;

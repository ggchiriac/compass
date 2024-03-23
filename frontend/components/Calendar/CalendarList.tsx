import { useState } from 'react';

import { Paper, Box } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';

import { CalendarEvent } from '@/types';

// import useKairosStore from '@/store/calendarSlice';

import CourseListItem from './CourseListItem';
import SelectedCourses from './SelectedCourses';

interface CalendarListProps {
  items?: CalendarEvent[];
}

const CalendarList: React.FC<CalendarListProps> = ({ items = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <Box display='flex' flexDirection='column' height='100%'>
      <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'hidden', borderRadius: '8px' }}>
        <Virtuoso
          style={{ height: '400px' }}
          data={items}
          itemContent={(index, item) => (
            <CourseListItem
              item={item}
              selected={selectedIndex === index}
              onClick={() => handleItemClick(index)}
            />
          )}
        />
      </Paper>
      <Box mt={4}>
        <SelectedCourses />
      </Box>
    </Box>
  );
};

export default CalendarList;

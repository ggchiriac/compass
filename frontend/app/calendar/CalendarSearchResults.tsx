import { Paper, Box } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';

import { SearchResults } from '@/types';

import CalendarSearchItem from './CalendarSearchItem';
import SelectedCourses from './SelectedCourses';

const CalendarSearchResults: React.FC<SearchResults> = ({ courses = [] }) => {
  return (
    <Box display='flex' flexDirection='column' height='100%'>
      <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'hidden', borderRadius: '8px' }}>
        <Virtuoso
          style={{ height: '400px' }}
          data={courses}
          itemContent={(_, course) => <CalendarSearchItem course={course} />}
        />
      </Paper>
      <Box mt={4}>
        <SelectedCourses />
      </Box>
    </Box>
  );
};

export default CalendarSearchResults;

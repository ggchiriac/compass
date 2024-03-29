// Renders the selected courses section

import List from '@mui/material/List';
import Paper from '@mui/material/Paper';

import useCalendarStore from '@/store/calendarSlice';

import SelectedCourseItem from './SelectedCourseItem';

const SelectedCourses: React.FC = () => {
  const selectedCourses = useCalendarStore((state) => state.selectedCourses);

  return (
    <Paper className='p-2.5 overflow-auto max-h-[calc(50vh-4rem)]'>
      <h3 className='text-lg font-semibold'>Selected Courses</h3>
      <List>
        {selectedCourses.map((courses) => (
          <SelectedCourseItem key={courses.course.guid} course={courses} />
        ))}
      </List>
    </Paper>
  );
};

export default SelectedCourses;

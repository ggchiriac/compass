// Renders the selected courses section

import List from '@mui/material/List';
import Paper from '@mui/material/Paper';

import useKairosStore from '@/store/kairosSlice';

import SelectedCourseItem from './SelectedCourseItem';

const SelectedCourses: React.FC = () => {
  const selectedCourses = useKairosStore((state) => state.selectedCourses);

  return (
    <Paper className='p-2.5 overflow-auto max-h-[calc(50vh-4rem)]'>
      <h3 className='text-lg font-semibold'>Selected Courses</h3>
      <List>
        {selectedCourses.map((course) => (
          <SelectedCourseItem key={course.guid} course={course} />
        ))}
      </List>
    </Paper>
  );
};

export default SelectedCourses;

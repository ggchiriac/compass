import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import { FixedSizeList as List } from 'react-window';

import useKairosStore from '@/store/kairosSlice';

// Refactored RenderRow function into a React functional component
const RenderRow = (props) => {
  const { index, style, data } = props;
  const item = data[index];
  // Correctly access the addItem function from the store
  const addItem = useKairosStore((state) => state.addItem);

  // Function to handle click event
  const handleClick = () => {
    addItem(item); // Add the item to the store on click
  };

  return (
    <div className='flex overflow-x-auto overflow-y-auto p-4 space-x-2'>
      <ListItem
        button
        style={style}
        key={index}
        component='div'
        disablePadding
        onClick={handleClick}
      >
        <ListItemText
          primary={item.title}
          secondary={item.department_code + ' ' + item.catalog_number}
        />
      </ListItem>
    </div>
  );
};

// Updated CalendarList component to use RenderRow correctly
export default function CalendarList({ items = [] }) {
  return (
    <Paper style={{ height: 700, width: 380, overflow: 'auto' }}>
      <List
        height={700}
        width={380}
        itemSize={46} // Adjust based on the item height
        itemCount={items.length} // Safe to access length
        itemData={items} // Pass the items as data for the List
        overscanCount={5}
      >
        {RenderRow}
      </List>
    </Paper>
  );
}

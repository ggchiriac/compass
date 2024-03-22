// FilterModal.tsx
import { FC } from 'react';

import {
  Button,
  Checkbox,
  Autocomplete,
  FormLabel,
  AutocompleteOption,
  ListItemContent,
} from '@mui/joy';

interface FilterModalProps {
  terms: { [key: string]: string };
  termsInverse: { [key: string]: string };
  distributionAreas: { [key: string]: string };
  distributionAreasInverse: { [key: string]: string };
  levels: { [key: string]: string };
  gradingBases: string[];
  termFilter: string;
  distributionFilter: string;
  levelFilter: string[];
  gradingFilter: string[];
  onTermFilterChange: (term: string) => void;
  onDistributionFilterChange: (distribution: string) => void;
  onLevelFilterChange: (level: string) => void;
  onGradingFilterChange: (grading: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const FilterModal: FC<FilterModalProps> = ({
  terms,
  termsInverse,
  distributionAreas,
  distributionAreasInverse,
  levels,
  gradingBases,
  termFilter,
  distributionFilter,
  levelFilter,
  gradingFilter,
  onTermFilterChange,
  onDistributionFilterChange,
  onLevelFilterChange,
  onGradingFilterChange,
  onSave,
  onCancel,
}) => {
  return (
    <div>
      <div className='grid grid-cols-1 gap-6'>
        {/* Semester */}
        <div>
          <FormLabel>Semester</FormLabel>
          <Autocomplete
            multiple={false}
            autoHighlight
            options={Object.keys(terms)}
            placeholder='Semester'
            variant='soft'
            value={termFilter ? termsInverse[termFilter] : 'Spring 2024'}
            isOptionEqualToValue={(option, value) => value === '' || option === value}
            onChange={(event, newTermName: string | undefined) => {
              event.stopPropagation();
              onTermFilterChange(terms[newTermName] ?? '');
            }}
            getOptionLabel={(option) => option.toString()}
            renderOption={(props, option) => (
              <AutocompleteOption {...props} key={option}>
                <ListItemContent>{option}</ListItemContent>
              </AutocompleteOption>
            )}
          />
        </div>
        {/* Distribution area */}
        <div>
          <FormLabel>Distribution area</FormLabel>
          <Autocomplete
            multiple={false}
            autoHighlight
            options={Object.keys(distributionAreas)}
            placeholder='Distribution area'
            variant='soft'
            value={distributionAreasInverse[distributionFilter]}
            isOptionEqualToValue={(option, value) => value === '' || option === value}
            onChange={(event, newDistributionName: string | undefined) => {
              event.stopPropagation();
              onDistributionFilterChange(distributionAreas[newDistributionName] ?? '');
            }}
            getOptionLabel={(option) => option.toString()}
            renderOption={(props, option) => (
              <AutocompleteOption {...props} key={option}>
                <ListItemContent>{option}</ListItemContent>
              </AutocompleteOption>
            )}
          />
        </div>
        {/* Course level */}
        <div>
          <FormLabel>Course level</FormLabel>
          <div className='grid grid-cols-3'>
            {Object.keys(levels).map((level) => (
              <div key={level} className='flex items-center mb-2'>
                <Checkbox
                  size='sm'
                  id={`level-${level}`}
                  name='level'
                  checked={levelFilter.includes(levels[level])}
                  onChange={() => onLevelFilterChange(levels[level])}
                />
                <span className='ml-2 text-sm font-medium text-gray-800'>{level}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Allowed grading */}
        <div>
          <FormLabel>Allowed grading</FormLabel>
          <div className='grid grid-cols-3'>
            {gradingBases.map((grading) => (
              <div key={grading} className='flex items-center mb-2'>
                <Checkbox
                  size='sm'
                  id={`grading-${grading}`}
                  name='grading'
                  checked={gradingFilter.includes(grading)}
                  onChange={() => onGradingFilterChange(grading)}
                />
                <span className='ml-2 text-sm font-medium text-gray-800'>{grading}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className='mt-auto text-right'>
        <div className='mt-5 text-right'>
          <Button variant='soft' color='primary' onClick={onSave} size='md'>
            Save
          </Button>
          <Button variant='soft' color='neutral' onClick={onCancel} sx={{ ml: 2 }} size='md'>
            Cancel
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default FilterModal;

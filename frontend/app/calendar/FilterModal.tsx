import { FC } from 'react';

import {
  Button,
  Checkbox,
  Autocomplete,
  FormLabel,
  AutocompleteOption,
  ListItemContent,
} from '@mui/joy';

import { AcademicTerm } from '@/types';

import { distributionAreas } from '@/utils/distributionAreas';
import { grading } from '@/utils/grading';
import { levels } from '@/utils/levels';
import { terms, termsInverse } from '@/utils/terms';

interface FilterModalProps {
  currentTerm: AcademicTerm | null;
  distributionFilter: string;
  levelFilter: string[];
  gradingFilter: string[];
  setCurrentTerm: (term: AcademicTerm) => void;
  setDistributionFilter: (distribution: string) => void;
  setLevelFilter: (level: string[]) => void;
  setGradingFilter: (grading: string[]) => void;
  handleSave: () => void;
  handleCancel: () => void;
}

const FilterModal: FC<FilterModalProps> = ({
  currentTerm,
  distributionFilter,
  levelFilter,
  gradingFilter,
  setCurrentTerm,
  setDistributionFilter,
  setLevelFilter,
  setGradingFilter,
  handleSave,
  handleCancel,
}) => {
  const handleLevelFilterChange = (level: string) => {
    const updatedLevelFilter = levelFilter.includes(level)
      ? levelFilter.filter((l) => l !== level)
      : [...levelFilter, level];
    setLevelFilter(updatedLevelFilter);
  };

  const handleGradingFilterChange = (grading: string) => {
    const updatedGradingFilter = gradingFilter.includes(grading)
      ? gradingFilter.filter((g) => g !== grading)
      : [...gradingFilter, grading];
    setGradingFilter(updatedGradingFilter);
  };

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
            value={currentTerm ? termsInverse[currentTerm.term_code] : ''}
            isOptionEqualToValue={(option, value) => value === '' || option === value}
            onChange={(event, newTermName: string | null) => {
              event.stopPropagation();
              const termCode = terms[newTermName ?? ''] ?? '';
              setCurrentTerm({ term_code: termCode, suffix: newTermName || '' });
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
            value={distributionAreas[distributionFilter] || ''}
            isOptionEqualToValue={(option, value) => value === '' || option === value}
            onChange={(event, newDistributionName: string | null) => {
              event.stopPropagation();
              setDistributionFilter(distributionAreas[newDistributionName ?? ''] ?? '');
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
                  onChange={() => handleLevelFilterChange(levels[level])}
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
            {grading.map((grading) => (
              <div key={grading} className='flex items-center mb-2'>
                <Checkbox
                  size='sm'
                  id={`grading-${grading}`}
                  name='grading'
                  checked={gradingFilter.includes(grading)}
                  onChange={() => handleGradingFilterChange(grading)}
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
          <Button variant='soft' color='primary' onClick={handleSave} size='md'>
            Save
          </Button>
          <Button variant='soft' color='neutral' onClick={handleCancel} sx={{ ml: 2 }} size='md'>
            Cancel
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default FilterModal;

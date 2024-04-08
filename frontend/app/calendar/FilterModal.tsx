import { FC } from 'react';

import {
  Button,
  Checkbox,
  Autocomplete,
  FormLabel,
  AutocompleteOption,
  ListItemContent,
} from '@mui/joy';

import useFilterStore from '@/store/filterSlice';

const FilterModal: FC = () => {
  const {
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
    setTermFilter,
    setDistributionFilter,
    setLevelFilter,
    setGradingFilter,
    setShowPopup,
  } = useFilterStore();

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

  const handleSave = () => {
    setShowPopup(false);
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
            value={termsInverse[termFilter]}
            isOptionEqualToValue={(option, value) => value === '' || option === value}
            onChange={(event, newTermName: string | undefined) => {
              event.stopPropagation();
              setTermFilter(terms[newTermName] ?? '');
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
              setDistributionFilter(distributionAreas[newDistributionName] ?? '');
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
            {gradingBases.map((grading) => (
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
          <Button
            variant='soft'
            color='neutral'
            onClick={() => setShowPopup(false)}
            sx={{ ml: 2 }}
            size='md'
          >
            Cancel
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default FilterModal;

import { useEffect, useState, FC } from 'react';

import {
  Pane,
  Tablist,
  Tab,
  TextInput,
  IconButton,
  PlusIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  toaster,
} from 'evergreen-ui';

import { AcademicTerm, SemesterConfiguration } from '@/types';

import { terms } from '@/utils/terms';

interface ConfigurationSelectorProps {
  configurations: Record<string, SemesterConfiguration>;
  activeConfiguration: { term: AcademicTerm };
  onConfigurationChange: (term: AcademicTerm) => void;
  onConfigurationCreate: (term: AcademicTerm, name: string) => Promise<void>;
  onConfigurationDelete: (term: AcademicTerm) => Promise<void>;
  onConfigurationRename: (term: AcademicTerm, newName: string) => Promise<void>;
}

const ConfigurationSelector: FC<ConfigurationSelectorProps> = ({
  configurations,
  activeConfiguration,
  onConfigurationChange,
  onConfigurationCreate,
  onConfigurationDelete,
  onConfigurationRename,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [configurationName, setConfigurationName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const response = await fetch(`${process.env.BACKEND}/calendar-configurations/`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch configurations');
        }

        const data = await response.json();

        if (data.length === 0) {
          // Create a new default configuration for the current semester
          const latestTermCode = Object.keys(terms).reduce((latest, term) =>
            terms[term] > terms[latest] ? term : latest
          );
          const currentTerm: AcademicTerm = {
            term_code: terms[latestTermCode],
            suffix: latestTermCode,
          };
          await onConfigurationCreate(currentTerm, 'Default Configuration');
        }
      } catch (error) {
        console.error('Error fetching configurations:', error);
        setError('Failed to fetch configurations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigurations();
  }, [onConfigurationCreate]);

  if (loading) {
    return <Pane>Loading...</Pane>;
  }
  if (error) {
    return <Pane>{error}</Pane>;
  }

  const configurationsPerPage = 5;

  const configurationList = Object.values(configurations);
  const totalPages = Math.ceil(configurationList.length / configurationsPerPage);

  const handleConfigurationClick = (term: AcademicTerm) => {
    onConfigurationChange(term);
    setEditingTerm(null);
  };

  const handleConfigurationRename = async () => {
    if (editingTerm && configurationName.trim() !== '') {
      try {
        await onConfigurationRename(editingTerm, configurationName.trim());
        setEditingTerm(null);
        setConfigurationName('');
        toaster.success('Configuration renamed successfully');
      } catch (error) {
        console.error('Error renaming configuration:', error);
        toaster.danger('Failed to rename configuration. Please try again.');
      }
    }
  };

  const handleConfigurationCreate = async () => {
    const newTerm: AcademicTerm = {
      term_code: `new-${Date.now()}`,
      suffix: 'New Configuration',
    };
    try {
      await onConfigurationCreate(newTerm, `Configuration ${configurationList.length + 1}`);
      toaster.success('Configuration created successfully');
    } catch (error) {
      console.error('Error creating configuration:', error);
      toaster.danger('Failed to create configuration. Please try again.');
    }
  };

  const handleConfigurationDelete = async (term: AcademicTerm) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this configuration? This action cannot be undone.'
    );
    if (confirmDelete) {
      try {
        await onConfigurationDelete(term);
        toaster.success('Configuration deleted successfully');
      } catch (error) {
        console.error('Error deleting configuration:', error);
        toaster.danger('Failed to delete configuration. Please try again.');
      }
    }
  };

  const startIndex = currentPage * configurationsPerPage;
  const endIndex = startIndex + configurationsPerPage;
  const displayedConfigurations = configurationList.slice(startIndex, endIndex);

  return (
    <Pane display='flex' alignItems='center' background='tint1' padding={16}>
      <IconButton
        icon={ChevronLeftIcon}
        appearance='minimal'
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 0}
        marginRight={8}
      />

      <Tablist>
        {displayedConfigurations.map((configuration) => (
          <Tab
            key={configuration?.term?.term_code}
            isSelected={activeConfiguration?.term?.term_code === configuration?.term?.term_code}
            onSelect={() => handleConfigurationClick(configuration.term)}
            marginRight={8}
            paddingX={12}
            paddingY={8}
          >
            {editingTerm?.term_code === configuration?.term?.term_code ? (
              <TextInput
                value={configurationName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfigurationName(e.target.value)
                }
                onBlur={handleConfigurationRename}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleConfigurationRename();
                  }
                }}
                width={100}
              />
            ) : (
              <Pane display='flex' alignItems='center'>
                <span>{configuration.term.suffix}</span>
                <IconButton
                  icon={EditIcon}
                  appearance='minimal'
                  marginLeft={8}
                  onClick={() => {
                    setEditingTerm(configuration.term);
                    setConfigurationName(configuration.term.suffix);
                  }}
                />
              </Pane>
            )}
          </Tab>
        ))}
      </Tablist>

      <IconButton
        icon={ChevronRightIcon}
        appearance='minimal'
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        marginLeft={8}
      />

      <IconButton
        icon={PlusIcon}
        appearance='minimal'
        onClick={handleConfigurationCreate}
        marginLeft={16}
      />

      {activeConfiguration?.term && (
        <IconButton
          icon={TrashIcon}
          appearance='minimal'
          intent='danger'
          onClick={() => handleConfigurationDelete(activeConfiguration.term)}
          marginLeft={8}
        />
      )}
    </Pane>
  );
};

export default ConfigurationSelector;

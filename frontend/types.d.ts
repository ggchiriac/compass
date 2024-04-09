// TODO: Check all of these with Cmd + Shift + F and delete any unused ones

export type AuthState = {
  user?: Profile;
  isAuthenticated: boolean | null;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  checkAuthentication: () => Promise<void>;
  login: () => void;
  logout: () => void;
};

export type UserState = {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
};

export type MajorMinorType = {
  code: string;
  name: string;
};

export type Profile = {
  firstName: string;
  lastName: string;
  classYear: number;
  major: MajorMinorType;
  minors?: MajorMinorType[];
  netId: string;
  universityId: string;
  email: string;
  department: string;
  timeFormat24h: boolean;
  themeDarkMode: boolean;
};

export type ProfileProps = {
  profile: Profile;
  onClose: () => void;
  onSave: (updatedProfile: Profile) => void;
};

export type SettingsModalProps = {
  children: React.ReactNode;
};

export type Filter = {
  termFilter: string;
  distributionFilter: string;
  levelFilter: string[];
  gradingFilter: string[];
};

export type SearchStoreState = {
  searchResults: Course[];
  setSearchResults: (results: Course[]) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  searchFilter: Filter;
  setSearchFilter: (filter: Filter) => void;
};

export type CourseProps = {
  id: number;
  course: Course;
};

export type Semester = {
  id: string;
  courses: Course[];
};

export type SemesterBinProps = {
  children?: React.ReactNode;
  semester: Semester;
  className?: string;
};

export type DraggableProps = {
  id: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type DroppableProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export type DndState = {
  semesters: Semester[];
  addCourseToSemester: (course: Course, semesterId: string) => void;
  moveCourseWithinSemester: (courseID: string, oldIndex: number, newIndex: number) => void;
};

export type SearchResults = {
  courses: Course[];
};

export type MobileMenuState = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

export type MenuItemProps = {
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

export type Dictionary = {
  [key: string]: string | Dictionary;
};

// Calendar
export type CalendarEvent = {
  key: string;
  course: Course;
  section: Section;
  startTime: string;
  endTime: string;
  startColumnIndex: number;
  startRowIndex: number;
  endRowIndex: number;
  width?: number;
  offsetLeft?: number;
  color?: string;
  textColor?: string;
};

// Note: types from the API, fields in snake_case.

export type Department = {
  // From model
  id: string;
  code: string;
  name: string;
};

export type Instructor = {
  // From model
  emplid: string;
  first_name: string;
  last_name: string;
  full_name: string;
};

export type Course = {
  // From model
  department: Department;
  guid: string;
  course_id: number;
  catalog_number: number;
  title: string;
  description: string;
  crosslistings?: string;

  // Defined fields
  sections: Section[];
  origin_semester_id?: string;
};

export type Section = {
  // From model
  id: number;
  class_section: string;
  class_type: string;
  instructor: Instructor;
  track: string;
  capacity: number;
  enrollment: number;
  seat_reservations: string;
  status: string;

  // Defined fields
  class_meetings: ClassMeeting[];
};

export type ClassMeeting = {
  // From model
  id: number;
  start_time: string;
  end_time: string;
  building_name: string;
  room: string;
  days: string;
};

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

export type Course = {
  course_id?: number;
  guid: number;
  department_code: string;
  catalog_number: number;
  title: string;
  originSemesterId?: string;
  crosslistings?: string;
  // Calendar portion (might need to rewrite to make cleaner)
  sections?: Section[];
  course_id?: string;
  description?: string;
  drop_consent?: string;
  add_consent?: string;
};

export type Filter = {
  termFilter: string;
  distributionFilter: string;
  levelFilter: string[];
  gradingFilter: string[];
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
  style?: CSSProperties;
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

export type DragDropContextProps = {
  searchResults: Course[];
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

export type Planner = {
  classYear: number | null;
  semesters: Record<string, Semester>;
  setClassYear: (classYear: number) => void;
  addCourseToSemester: (semesterId: string, course: Course) => void;
  removeCourseFromSemester: (semesterId: string, courseId: string) => void;
};

export type Dictionary = {
  [key: string]: string | Dictionary;
};

// Calendar
type CalendarEvent = {
  key: string;
  guid: string;
  course_id: string;
  catalog_number: string;
  title: string;
  description: string;
  drop_consent: string;
  add_consent: string;
  web_address: string;
  transcript_title: string;
  long_title: string;
  distribution_area_long: string;
  distribution_area_short: string;
  reading_writing_assignment: string;
  grading_basis: string;
  reading_list: string;
  department_code: string;
  sections: Section[];
  crosslistings: string;
  sections: Section[];
  selectedSection?: Section;
  // Additional fields for UI representation
  color?: string;
  textColor?: string;
  // Additional fields for event rendering
  startTime?: string;
  endTime?: string;
  startColumnIndex?: number;
  startRowIndex?: number;
  endRowIndex?: number;
  width?: number;
  offsetLeft?: number;
};

export type Section = {
  class_number: number;
  class_type: string;
  class_section: string;
  track: string;
  seat_reservations: string;
  capacity: number;
  status: string;
  enrollment: number;
  class_meetings: ClassMeeting[];
};

export type ClassMeeting = {
  meeting_number: number;
  start_time: string;
  end_time: string;
  room: string;
  days: string;
  building_name: string;
};

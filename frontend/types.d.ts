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

// Courses returned from the API.
export type Course = {
  courseId: number;
  guid: string;
  departmentCode: string;
  catalogNumber: number;
  title: string;
  description: string;
  sections: Section[];
  originSemesterId?: string;
  crosslistings?: string;
};

export type Section = {
  sectionId: number;
  classSection: string;
  classType: string;
  instructorId: number;
  track: string;
  capacity: number;
  enrollment: number;
  seatReservations: string;
  status: string;
  classMeetings: ClassMeeting[];
};

export type ClassMeeting = {
  classMeetingId: number;
  meetingDays: string;
  startTime: string;
  endTime: string;
  buildingName: string;
  room: string;
};

// Calendar
type CalendarEvent = {
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

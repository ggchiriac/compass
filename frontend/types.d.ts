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
  onClose: () => void;
};

export type Course = {
  id: number;
  guid: number;
  department_code: string;
  catalog_number: number;
  title: string;
  originSemesterId?: string;
  crosslistings?: string;
};

export type SearchStoreState = {
  searchResults: Course[];
  setSearchResults: (results: Course[]) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  activeDraggableCourse: Course | null;
  setActiveDraggableCourse: (course: Course | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
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
type Event = {
  id: string; // Unique identifier for the event
  name: string; // Name of the event, e.g., "Breakfast", "Flight to Paris"
  description: string; // Description or additional details, e.g., "6:00 AM"
  startTime: string; // ISO 8601 date string indicating the start time of the event
  endTime: string; // ISO 8601 date string indicating the end time of the event (can be empty if not applicable)
  color: string; // Color code for UI representation, e.g., "blue", "pink"
  textColor: string; // Text color code for UI representation
  gridColumnStart: number; // Numeric representation aligning with the day of the week (1 = Monday, ..., 5 = Friday)
  gridRowStart: number; // The starting grid row for the event, based on its start time
  gridRowEnd: number; // The number of rows the event spans, indicating its duration
};

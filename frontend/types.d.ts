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
};

export type ClassMeeting = {
  meeting_number: string;
  start_time: string;
  end_time: string;
  room: string;
  days: string[];
  building_name: string;
};

export type Section = {
  class_number: string;
  class_type: string;
  class_section: string;
  track: string;
  seat_reservations: number;
  instructor_name: string;
  capacity: number;
  status: string;
  enrollment: number;
  class_meetings: ClassMeeting[];
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
type CalendarEvent = {
  id: string; // Unique identifier for the event, could be the course or section ID
  title: string; // Title of the course, e.g., "Advanced Programming Techniques"
  description: string; // Description of the course, could include catalog number, e.g., "COS 333"
  departmentCode: string; // Department code, e.g., "COS"
  catalogNumber: string; // Catalog number of the course, e.g., "333"
  instructorName: string; // Name of the instructor
  startTime: string; // ISO 8601 date string indicating the start time of the first class meeting
  endTime: string; // ISO 8601 date string indicating the end time of the last class meeting
  meetingDays: string[]; // Days of the week when the course meets, e.g., ["Monday", "Wednesday"]
  color: string; // Color code for UI representation, e.g., "#3498db"
  textColor: string; // Text color code for UI representation, ideally contrasted with `color`
  gridColumnStart: number; // Numeric representation aligning with the day of the week (1 = Monday, ..., 7 = Sunday)
  gridRowStart: number; // Calculated starting grid row based on the start time
  gridRowEnd: number; // Calculated grid row end based on the duration
  // Additional fields from the ClassMeetingSerializer, if necessary
  room?: string; // Room number or location of the class meeting
  buildingName?: string; // Name of the building where the class meets
};

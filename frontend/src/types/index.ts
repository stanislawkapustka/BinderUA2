export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameUa?: string;
  lastNameUa?: string;
  fullName?: string;
  role: 'PRACOWNIK' | 'MANAGER' | 'DYREKTOR';
  contractType: 'UOP' | 'B2B';
  language: 'PL' | 'EN' | 'UA';
  uopGrossRate?: number;
  b2bHourlyNetRate?: number;
  active?: boolean;
  passwordChangeRequired?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  projectId?: number;
  number?: string;
  billingType?: 'HOURLY' | 'UNIT';
  unitPrice?: number | null;
  unitName?: string | null;
}

export interface TimeEntry {
  id: number;
  userId: number;
  userName?: string;
  projectId?: number;
  projectName?: string;
  taskId?: number;
  taskNumber?: string;
  billingType?: 'HOURLY' | 'UNIT';
  unitName?: string;
  date: string;
  hours?: number;
  quantity?: number;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  description?: string;
  status?: 'ZGLOSZONY' | 'ZATWIERDZONY' | 'ODRZUCONY';
  approvedBy?: number;
  approvedAt?: string;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description?: string;
  managerId?: number;
  active: boolean;
}

export interface Report {
  userId: number;
  userFullName: string;
  month: number;
  year: number;
  totalHours: number;
  totalCost: number;
  currency: string;
  contractType: string;
  rateInfo: {
    hourlyRate?: number;
    grossRate?: number;
  };
  entries: TimeEntry[];
}

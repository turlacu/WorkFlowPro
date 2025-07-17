import { Assignment, User } from '@prisma/client';

export interface AssignmentWithUsers extends Assignment {
  assignedTo?: Pick<User, 'id' | 'name' | 'email'>;
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
  lastUpdatedBy: Pick<User, 'id' | 'name' | 'email'>;
}

export interface CreateAssignmentData {
  name: string;
  description?: string;
  dueDate: string;
  priority: 'LOW' | 'NORMAL' | 'URGENT';
  assignedToId?: string;
  sourceLocation?: string;
}

export interface UpdateAssignmentData extends CreateAssignmentData {
  id: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  comment?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'PRODUCER' | 'OPERATOR';
}

export interface UpdateUserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PRODUCER' | 'OPERATOR';
  password?: string;
}

export interface TeamScheduleData {
  date: string;
  userIds: string[];
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `/api${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  // Assignment APIs
  async getAssignments(params?: { date?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<AssignmentWithUsers[]>(`/assignments${query}`);
  }

  async createAssignment(data: CreateAssignmentData) {
    return this.request<AssignmentWithUsers>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(data: UpdateAssignmentData) {
    return this.request<AssignmentWithUsers>('/assignments', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string) {
    return this.request<{ message: string }>(`/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async getAssignment(id: string) {
    return this.request<AssignmentWithUsers>(`/assignments/${id}`);
  }

  // User APIs
  async getUsers(role?: string) {
    const query = role ? `?role=${role}` : '';
    return this.request<User[]>(`/users${query}`);
  }

  async createUser(data: CreateUserData) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(data: UpdateUserData) {
    return this.request<User>('/users', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Team Schedule APIs
  async getTeamSchedule(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request<any[]>(`/team-schedule${query}`);
  }

  async createTeamSchedule(data: TeamScheduleData) {
    return this.request<any[]>('/team-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // File Upload API
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  }
}

export const api = new ApiClient();
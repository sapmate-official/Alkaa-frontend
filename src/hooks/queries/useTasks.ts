import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'

// Types
export interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  groupId?: string
  createdById: string
  organizationId: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  group?: TaskGroup
  assignments: TaskAssignment[]
  updates: TaskUpdate[]
  _count?: {
    assignments: number
    updates: number
  }
}

export interface TaskGroup {
  id: string
  name: string
  description?: string
  createdById: string
  organizationId: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  tasks: Task[]
  members: TaskGroupMember[]
  _count?: {
    tasks: number
    members: number
  }
}

export interface TaskGroupMember {
  id: string
  userId: string
  groupId: string
  role: 'ADMIN' | 'MEMBER'
  addedAt: string
  addedBy: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface TaskAssignment {
  id: string
  taskId: string
  assignedToId: string
  assignedById: string
  assignedAt: string
  status: 'ASSIGNED' | 'ACCEPTED' | 'DECLINED'
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assignedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface TaskUpdate {
  id: string
  taskId: string
  message: string
  status?: string
  updatedById: string
  createdAt: string
  updatedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  groupId?: string
  assignees?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
}

export interface CreateTaskGroupRequest {
  name: string
  description?: string
  members?: string[]
}

export interface UpdateTaskGroupRequest {
  name?: string
  description?: string
}

export interface CreateTaskUpdateRequest {
  message: string
  status?: string
}

export interface AssignTaskRequest {
  userIds: string[]
}

// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  userTasks: (userId: string) => [...taskKeys.all, 'user', userId] as const,
  managerTasks: (managerId: string) => [...taskKeys.all, 'manager', managerId] as const,
  groupTasks: (groupId: string) => [...taskKeys.all, 'group', groupId] as const,
  assignments: (taskId: string) => [...taskKeys.all, 'assignments', taskId] as const,
  updates: (taskId: string) => [...taskKeys.all, 'updates', taskId] as const,
}

export const taskGroupKeys = {
  all: ['taskGroups'] as const,
  lists: () => [...taskGroupKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskGroupKeys.lists(), { filters }] as const,
  details: () => [...taskGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskGroupKeys.details(), id] as const,
  members: (groupId: string) => [...taskGroupKeys.all, 'members', groupId] as const,
}

// API Functions
const tasksApi = {
  // Task CRUD
  async getAllTasks(filters?: Record<string, any>): Promise<Task[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.task}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await axios.get(APIDictionary.taskDetails(id), { withCredentials: true })
    return response.data.data || response.data
  },

  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await axios.post(APIDictionary.task, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await axios.put(`${APIDictionary.task}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteTask(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.task}/${id}`, { withCredentials: true })
  },

  // Task assignments
  async getTasksByUser(userId: string): Promise<Task[]> {
    const response = await axios.get(APIDictionary.tasksByUser(userId), { withCredentials: true })
    return response.data.data || response.data
  },

  async getTasksByManager(managerId: string): Promise<Task[]> {
    const response = await axios.get(APIDictionary.tasksByManager(managerId), { withCredentials: true })
    return response.data.data || response.data
  },

  async getTasksByGroup(groupId: string): Promise<Task[]> {
    const response = await axios.get(APIDictionary.tasksByGroup(groupId), { withCredentials: true })
    return response.data.data || response.data
  },

  async assignTask(taskId: string, data: AssignTaskRequest): Promise<TaskAssignment[]> {
    const response = await axios.post(APIDictionary.taskAssignment(taskId), data, { withCredentials: true })
    return response.data.data || response.data
  },

  async unassignTask(taskId: string, userId: string): Promise<void> {
    await axios.delete(APIDictionary.taskUnassignment(taskId), {
      data: { userId },
      withCredentials: true
    })
  },

  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    const response = await axios.get(APIDictionary.taskAssignmentByTask(taskId), { withCredentials: true })
    return response.data.data || response.data
  },

  async updateAssignmentStatus(assignmentId: string, status: 'ASSIGNED' | 'ACCEPTED' | 'DECLINED'): Promise<TaskAssignment> {
    const response = await axios.put(`${APIDictionary.taskAssignment}/${assignmentId}`, {
      status
    }, { withCredentials: true })
    return response.data.data || response.data
  },

  // Task updates
  async getTaskUpdates(taskId: string): Promise<TaskUpdate[]> {
    const response = await axios.get(APIDictionary.taskUpdate(taskId), { withCredentials: true })
    return response.data.data || response.data
  },

  async createTaskUpdate(taskId: string, data: CreateTaskUpdateRequest): Promise<TaskUpdate> {
    const response = await axios.post(APIDictionary.taskUpdate(taskId), data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteTaskUpdate(taskId: string, updateId: string): Promise<void> {
    await axios.delete(`${APIDictionary.taskUpdate(taskId)}/${updateId}`, { withCredentials: true })
  },
}

const taskGroupsApi = {
  async getAllTaskGroups(): Promise<TaskGroup[]> {
    const response = await axios.get(APIDictionary.taskGroups, { withCredentials: true })
    return response.data.data || response.data
  },

  async getTaskGroupById(id: string): Promise<TaskGroup> {
    const response = await axios.get(APIDictionary.taskGroupById(id), { withCredentials: true })
    return response.data.data || response.data
  },

  async createTaskGroup(data: CreateTaskGroupRequest): Promise<TaskGroup> {
    const response = await axios.post(APIDictionary.taskGroup, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateTaskGroup(id: string, data: UpdateTaskGroupRequest): Promise<TaskGroup> {
    const response = await axios.put(`${APIDictionary.taskGroup}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteTaskGroup(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.taskGroup}/${id}`, { withCredentials: true })
  },

  async addGroupMembers(groupId: string, userIds: string[]): Promise<void> {
    await axios.post(`${APIDictionary.taskGroup}/${groupId}/members`, {
      userIds
    }, { withCredentials: true })
  },

  async removeGroupMembers(groupId: string, userIds: string[]): Promise<void> {
    await axios.delete(`${APIDictionary.taskGroup}/${groupId}/members`, {
      data: { userIds },
      withCredentials: true
    })
  },

  async updateMemberRole(groupId: string, userId: string, role: 'ADMIN' | 'MEMBER'): Promise<void> {
    await axios.put(`${APIDictionary.taskGroup}/${groupId}/members/role`, {
      userId,
      role
    }, { withCredentials: true })
  }
}

// Query Hooks - Tasks
export function useTasks(filters?: Record<string, any>) {
  return useQuery<Task[]>({
    queryKey: taskKeys.list(filters || {}),
    queryFn: () => tasksApi.getAllTasks(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getTaskById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useUserTasks(userId: string) {
  return useQuery<Task[]>({
    queryKey: taskKeys.userTasks(userId),
    queryFn: () => tasksApi.getTasksByUser(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useManagerTasks(managerId: string) {
  return useQuery<Task[]>({
    queryKey: taskKeys.managerTasks(managerId),
    queryFn: () => tasksApi.getTasksByManager(managerId),
    enabled: !!managerId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGroupTasks(groupId: string) {
  return useQuery<Task[]>({
    queryKey: taskKeys.groupTasks(groupId),
    queryFn: () => tasksApi.getTasksByGroup(groupId),
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useTaskAssignments(taskId: string) {
  return useQuery<TaskAssignment[]>({
    queryKey: taskKeys.assignments(taskId),
    queryFn: () => tasksApi.getTaskAssignments(taskId),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000,
  })
}

export function useTaskUpdates(taskId: string) {
  return useQuery<TaskUpdate[]>({
    queryKey: taskKeys.updates(taskId),
    queryFn: () => tasksApi.getTaskUpdates(taskId),
    enabled: !!taskId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Query Hooks - Task Groups
export function useTaskGroups() {
  return useQuery<TaskGroup[]>({
    queryKey: taskGroupKeys.lists(),
    queryFn: taskGroupsApi.getAllTaskGroups,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useTaskGroup(id: string) {
  return useQuery<TaskGroup>({
    queryKey: taskGroupKeys.detail(id),
    queryFn: () => taskGroupsApi.getTaskGroupById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

// Mutation Hooks - Tasks
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      if (newTask.groupId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.groupTasks(newTask.groupId) })
        queryClient.invalidateQueries({ queryKey: taskGroupKeys.detail(newTask.groupId) })
      }
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      tasksApi.updateTask(id, data),
    onSuccess: (updatedTask, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      if (updatedTask.groupId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.groupTasks(updatedTask.groupId) })
      }
      // Invalidate user tasks for all assignees
      updatedTask.assignments.forEach(assignment => {
        queryClient.invalidateQueries({ queryKey: taskKeys.userTasks(assignment.assignedToId) })
      })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.deleteTask,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.lists() })
    },
  })
}

export function useAssignTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: AssignTaskRequest }) =>
      tasksApi.assignTask(taskId, data),
    onSuccess: (_, { taskId, data }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.assignments(taskId) })
      // Invalidate user tasks for all newly assigned users
      data.userIds.forEach(userId => {
        queryClient.invalidateQueries({ queryKey: taskKeys.userTasks(userId) })
      })
    },
  })
}

export function useUnassignTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      tasksApi.unassignTask(taskId, userId),
    onSuccess: (_, { taskId, userId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.assignments(taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.userTasks(userId) })
    },
  })
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assignmentId, status }: { assignmentId: string; status: 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' }) =>
      tasksApi.updateAssignmentStatus(assignmentId, status),
    onSuccess: (updatedAssignment) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(updatedAssignment.taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.assignments(updatedAssignment.taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.userTasks(updatedAssignment.assignedToId) })
    },
  })
}

export function useCreateTaskUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: CreateTaskUpdateRequest }) =>
      tasksApi.createTaskUpdate(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.updates(taskId) })
    },
  })
}

export function useDeleteTaskUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, updateId }: { taskId: string; updateId: string }) =>
      tasksApi.deleteTaskUpdate(taskId, updateId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.updates(taskId) })
    },
  })
}

// Mutation Hooks - Task Groups
export function useCreateTaskGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: taskGroupsApi.createTaskGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.lists() })
    },
  })
}

export function useUpdateTaskGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskGroupRequest }) =>
      taskGroupsApi.updateTaskGroup(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.lists() })
    },
  })
}

export function useDeleteTaskGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: taskGroupsApi.deleteTaskGroup,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: taskGroupKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export function useAddGroupMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
      taskGroupsApi.addGroupMembers(groupId, userIds),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.detail(groupId) })
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.lists() })
    },
  })
}

export function useRemoveGroupMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
      taskGroupsApi.removeGroupMembers(groupId, userIds),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.detail(groupId) })
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.lists() })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userId, role }: { groupId: string; userId: string; role: 'ADMIN' | 'MEMBER' }) =>
      taskGroupsApi.updateMemberRole(groupId, userId, role),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: taskGroupKeys.detail(groupId) })
    },
  })
}

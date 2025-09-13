import axios from 'axios';
import { APIDictionary } from '@/services/api/v2/APIdict';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AddMembersResponse {
  success: boolean;
  message: string;
  data: {
    groupId: string;
    addedMembers: User[];
    skippedMembers: User[];
  };
}

interface RemoveMembersResponse {
  success: boolean;
  message: string;
  data: {
    groupId: string;
    removedMembers: User[];
    deletedAssignments: number;
  };
}

export class TaskGroupMemberService {
  /**
   * Add members to a task group
   * @param groupId - The ID of the task group
   * @param userIds - Array of user IDs to add to the group
   * @returns Promise with the response data
   */
  static async addMembers(groupId: string, userIds: string[]): Promise<AddMembersResponse> {
    try {
      const response = await axios.post(
        `${APIDictionary.taskGroup}/${groupId}/members`,
        { userIds },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding members to group:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to add members to group'
      );
    }
  }

  /**
   * Remove members from a task group
   * @param groupId - The ID of the task group
   * @param userIds - Array of user IDs to remove from the group
   * @returns Promise with the response data
   */
  static async removeMembers(groupId: string, userIds: string[]): Promise<RemoveMembersResponse> {
    try {
      const response = await axios.delete(`${APIDictionary.taskGroup}/${groupId}/members`, {
        data: { userIds },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error removing members from group:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to remove members from group'
      );
    }
  }

  /**
   * Update member role in a task group
   * @param groupId - The ID of the task group
   * @param userId - The ID of the user whose role to update
   * @param role - The new role ('ADMIN' or 'MEMBER')
   * @returns Promise with the response data
   */
  static async updateMemberRole(groupId: string, userId: string, role: 'ADMIN' | 'MEMBER'): Promise<any> {
    try {
      const response = await axios.put(`${APIDictionary.taskGroup}/${groupId}/members/role`, {
        userId,
        role
      }, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to update member role'
      );
    }
  }

  /**
   * Get all users in an organization
   * @param orgId - The organization ID
   * @returns Promise with array of users
   */
  static async getOrganizationUsers(orgId: string): Promise<User[]> {
    try {
      const response = await axios.get(`${APIDictionary.user}/org/${orgId}?onlyActive=true`, {
        withCredentials: true,
      });
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error fetching organization users:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to fetch organization users'
      );
    }
  }

  /**
   * Get task group details
   * @param groupId - The ID of the task group
   * @returns Promise with task group data
   */
  static async getGroupDetails(groupId: string): Promise<TaskGroup> {
    try {
      const response = await axios.get(`${APIDictionary.taskGroup}/${groupId}`, {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching group details:', error);
      throw new Error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to fetch group details'
      );
    }
  }

  /**
   * Extract unique members from the group's members array (using new TaskGroupMember table)
   * Falls back to extracting from task assignments for backwards compatibility
   * @param group - The task group object with members or tasks and assignments
   * @returns Array of unique users who are members of the group
   */
  static extractGroupMembers(group: any): User[] {
    // Use the new members array if available
    if (group?.members && Array.isArray(group.members)) {
      return group.members.map((member: any) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role,
        addedAt: member.addedAt,
        addedBy: member.addedBy
      }));
    }
    
    // Fallback to old method for backwards compatibility
    if (!group?.tasks) return [];

    const memberMap = new Map<string, User>();
    group.tasks.forEach((task: any) => {
      // Skip placeholder tasks
      if (task.title?.startsWith('[GROUP_PLACEHOLDER]')) return;
      
      task.assignments?.forEach((assignment: any) => {
        const user = assignment.assignedTo;
        if (user && !memberMap.has(user.id)) {
          memberMap.set(user.id, user);
        }
      });
    });

    return Array.from(memberMap.values());
  }

  /**
   * Check if a user is the owner of a task group
   * @param userId - The user ID to check
   * @param group - The task group object
   * @returns Boolean indicating if the user is the owner
   */
  static isGroupOwner(userId: string, group: TaskGroup): boolean {
    return userId === group.createdBy.id;
  }

  /**
   * Filter users that are not already members of a group
   * @param allUsers - Array of all available users
   * @param currentMembers - Array of current group members
   * @returns Array of users who are not members
   */
  static getAvailableUsers(allUsers: User[], currentMembers: User[]): User[] {
    return allUsers.filter(user => 
      !currentMembers.some(member => member.id === user.id)
    );
  }

  /**
   * Search users by name or email
   * @param users - Array of users to search
   * @param searchTerm - The search term
   * @returns Filtered array of users
   */
  static searchUsers(users: User[], searchTerm: string): User[] {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }

  /**
   * Get member count for a task group
   * @param group - The task group object
   * @returns Number of unique members in the group
   */
  static getMemberCount(group: any): number {
    return this.extractGroupMembers(group).length;
  }

  /**
   * Check if a user is a member of a task group
   * @param userId - The user ID to check
   * @param group - The task group object
   * @returns Boolean indicating if the user is a member
   */
  static isGroupMember(userId: string, group: any): boolean {
    const members = this.extractGroupMembers(group);
    return members.some(member => member.id === userId);
  }

  /**
   * Get members by their role in the group (owner vs regular member)
   * @param group - The task group object
   * @returns Object with owner and members arrays
   */
  static getMembersByRole(group: any): { owner: User | null; members: User[] } {
    const members = this.extractGroupMembers(group);
    const owner = group.createdBy;
    const regularMembers = members.filter(member => member.id !== owner.id);
    
    return {
      owner: owner,
      members: regularMembers
    };
  }

  /**
   * Get task assignment count for a member in a group
   * @param userId - The user ID
   * @param group - The task group object
   * @returns Number of tasks assigned to the user in this group
   */
  static getMemberTaskCount(userId: string, group: any): number {
    if (!group?.tasks) return 0;
    
    return group.tasks.filter((task: any) => {
      // Skip placeholder tasks
      if (task.title?.startsWith('[GROUP_PLACEHOLDER]')) return false;
      return task.assignments?.some((assignment: any) => assignment.assignedTo.id === userId);
    }).length;
  }

  /**
   * Validate if users can be added to a group
   * @param userIds - Array of user IDs to validate
   * @param allUsers - Array of all available users
   * @param currentMembers - Array of current group members
   * @returns Object with valid and invalid user IDs
   */
  static validateUsersForAddition(
    userIds: string[], 
    allUsers: User[], 
    currentMembers: User[]
  ): { valid: string[]; invalid: string[]; alreadyMembers: string[] } {
    const currentMemberIds = currentMembers.map(member => member.id);
    const allUserIds = allUsers.map(user => user.id);
    
    const valid: string[] = [];
    const invalid: string[] = [];
    const alreadyMembers: string[] = [];
    
    userIds.forEach(userId => {
      if (!allUserIds.includes(userId)) {
        invalid.push(userId);
      } else if (currentMemberIds.includes(userId)) {
        alreadyMembers.push(userId);
      } else {
        valid.push(userId);
      }
    });
    
    return { valid, invalid, alreadyMembers };
  }

  /**
   * Batch add multiple members with validation
   * @param groupId - The ID of the task group
   * @param userIds - Array of user IDs to add
   * @param allUsers - Array of all available users
   * @param currentMembers - Array of current group members
   * @returns Promise with detailed response including validation results
   */
  static async addMembersWithValidation(
    groupId: string, 
    userIds: string[], 
    allUsers: User[], 
    currentMembers: User[]
  ): Promise<AddMembersResponse & { validation: any }> {
    const validation = this.validateUsersForAddition(userIds, allUsers, currentMembers);
    
    if (validation.valid.length === 0) {
      throw new Error('No valid users to add to the group');
    }
    
    const result = await this.addMembers(groupId, validation.valid);
    return {
      ...result,
      validation
    };
  }

  /**
   * Get group membership summary
   * @param group - The task group object
   * @returns Summary object with member statistics
   */
  static getGroupMembershipSummary(group: any): {
    totalMembers: number;
    owner: User;
    activeMembers: User[];
    membersWithTasks: number;
    membersWithoutTasks: number;
  } {
    const members = this.extractGroupMembers(group);
    const owner = group.createdBy;
    
    const membersWithTasks = members.filter(member => 
      this.getMemberTaskCount(member.id, group) > 0
    );
    
    return {
      totalMembers: members.length,
      owner,
      activeMembers: members,
      membersWithTasks: membersWithTasks.length,
      membersWithoutTasks: members.length - membersWithTasks.length
    };
  }
}

// Export default functions for easier usage
export const addMembersToGroup = TaskGroupMemberService.addMembers;
export const removeMembersFromGroup = TaskGroupMemberService.removeMembers;
export const updateMemberRole = TaskGroupMemberService.updateMemberRole;
export const getOrganizationUsers = TaskGroupMemberService.getOrganizationUsers;
export const getGroupDetails = TaskGroupMemberService.getGroupDetails;
export const extractGroupMembers = TaskGroupMemberService.extractGroupMembers;
export const isGroupOwner = TaskGroupMemberService.isGroupOwner;
export const getAvailableUsers = TaskGroupMemberService.getAvailableUsers;
export const searchUsers = TaskGroupMemberService.searchUsers;
export const getMemberCount = TaskGroupMemberService.getMemberCount;
export const isGroupMember = TaskGroupMemberService.isGroupMember;
export const getMembersByRole = TaskGroupMemberService.getMembersByRole;
export const getMemberTaskCount = TaskGroupMemberService.getMemberTaskCount;
export const validateUsersForAddition = TaskGroupMemberService.validateUsersForAddition;
export const addMembersWithValidation = TaskGroupMemberService.addMembersWithValidation;
export const getGroupMembershipSummary = TaskGroupMemberService.getGroupMembershipSummary;

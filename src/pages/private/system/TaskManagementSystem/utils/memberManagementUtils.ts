/**
 * Enhanced Task Group Member Management Utilities
 * 
 * This file contains utility functions and hooks that demonstrate
 * advanced member management capabilities for task groups.
 */

import { TaskGroupMemberService } from '../services/taskGroupMemberService';

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
  createdBy: User;
  tasks: any[];
}

/**
 * Utility function for batch member operations with comprehensive validation
 */
export const batchMemberOperations = {
  /**
   * Add multiple members with detailed validation and feedback
   */
  async addMembersWithValidation(
    groupId: string,
    selectedUserIds: string[],
    allUsers: User[],
    currentMembers: User[]
  ) {
    try {
      // Pre-validate the operation
      const validation = TaskGroupMemberService.validateUsersForAddition(
        selectedUserIds, 
        allUsers, 
        currentMembers
      );
      
      // Check if there are any valid users to add
      if (validation.valid.length === 0) {
        throw new Error('No valid users selected for addition');
      }
      
      // Provide detailed feedback about the validation
      const feedback = {
        willAdd: validation.valid.length,
        alreadyMembers: validation.alreadyMembers.length,
        invalidUsers: validation.invalid.length,
        details: {
          validUsers: allUsers.filter(u => validation.valid.includes(u.id)),
          existingMembers: allUsers.filter(u => validation.alreadyMembers.includes(u.id)),
          invalidUsers: validation.invalid
        }
      };
      
      // Proceed with the API call for valid users only
      const result = await TaskGroupMemberService.addMembers(groupId, validation.valid);
      
      return {
        ...result,
        validation: feedback,
        summary: `Successfully added ${validation.valid.length} new member${validation.valid.length !== 1 ? 's' : ''} to the group`
      };
    } catch (error) {
      console.error('Error in batch member addition:', error);
      throw error;
    }
  },

  /**
   * Remove multiple members with confirmation
   */
  async removeMembersWithConfirmation(
    groupId: string,
    userIdsToRemove: string[],
    currentMembers: User[]
  ) {
    try {
      // Validate that all users to remove are actually members
      const validMembers = userIdsToRemove.filter(userId =>
        currentMembers.some(member => member.id === userId)
      );
      
      if (validMembers.length === 0) {
        throw new Error('No valid members selected for removal');
      }
      
      // Get details of members being removed for confirmation
      const membersToRemove = currentMembers.filter(member =>
        validMembers.includes(member.id)
      );
      
      // Proceed with removal
      const result = await TaskGroupMemberService.removeMembers(groupId, validMembers);
      
      return {
        ...result,
        removedMemberDetails: membersToRemove,
        summary: `Successfully removed ${validMembers.length} member${validMembers.length !== 1 ? 's' : ''} from the group`
      };
    } catch (error) {
      console.error('Error in batch member removal:', error);
      throw error;
    }
  }
};

/**
 * Advanced member analysis utilities
 */
export const memberAnalytics = {
  /**
   * Get comprehensive member activity analysis
   */
  getMemberActivityAnalysis(group: TaskGroup) {
    const members = TaskGroupMemberService.extractGroupMembers(group);
    const analysis = members.map(member => {
      const taskCount = TaskGroupMemberService.getMemberTaskCount(member.id, group);
      const assignedTasks = group.tasks.filter(task =>
        task.assignments?.some((assignment: any) => assignment.assignedTo.id === member.id)
      );
      
      const completedTasks = assignedTasks.filter(task => task.status === 'COMPLETED');
      const pendingTasks = assignedTasks.filter(task => task.status === 'PENDING');
      const inProgressTasks = assignedTasks.filter(task => task.status === 'IN_PROGRESS');
      
      return {
        member,
        stats: {
          totalTasks: taskCount,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
          inProgressTasks: inProgressTasks.length,
          completionRate: taskCount > 0 ? (completedTasks.length / taskCount) * 100 : 0
        }
      };
    });
    
    return analysis.sort((a, b) => b.stats.totalTasks - a.stats.totalTasks);
  },

  /**
   * Get group health metrics
   */
  getGroupHealthMetrics(group: TaskGroup) {
    const summary = TaskGroupMemberService.getGroupMembershipSummary(group);
    const memberCount = summary.totalMembers;
    const taskCount = group.tasks.length;
    
    // Calculate various health metrics
    const tasksPerMember = memberCount > 0 ? taskCount / memberCount : 0;
    const activeMemberPercentage = memberCount > 0 ? (summary.membersWithTasks / memberCount) * 100 : 0;
    
    const completedTasks = group.tasks.filter(task => task.status === 'COMPLETED').length;
    const completionRate = taskCount > 0 ? (completedTasks / taskCount) * 100 : 0;
    
    return {
      memberMetrics: {
        totalMembers: memberCount,
        activeMembers: summary.membersWithTasks,
        inactiveMembers: summary.membersWithoutTasks,
        activeMemberPercentage: Math.round(activeMemberPercentage)
      },
      taskMetrics: {
        totalTasks: taskCount,
        averageTasksPerMember: Math.round(tasksPerMember * 100) / 100,
        completionRate: Math.round(completionRate)
      },
      healthScore: Math.round((activeMemberPercentage + completionRate) / 2)
    };
  }
};

/**
 * Member recommendation utilities
 */
export const memberRecommendations = {
  /**
   * Suggest members for task assignment based on workload
   */
  suggestMembersForTask(group: TaskGroup, preferLowWorkload = true) {
    const members = TaskGroupMemberService.extractGroupMembers(group);
    const memberWorkloads = members.map(member => ({
      member,
      workload: TaskGroupMemberService.getMemberTaskCount(member.id, group),
      activeTasks: group.tasks.filter(task =>
        task.assignments?.some((assignment: any) => 
          assignment.assignedTo.id === member.id && task.status !== 'COMPLETED'
        )
      ).length
    }));
    
    // Sort by workload (ascending for low workload preference)
    return memberWorkloads.sort((a, b) => 
      preferLowWorkload ? a.workload - b.workload : b.workload - a.workload
    );
  },

  /**
   * Identify members who might need assistance
   */
  identifyMembersNeedingAssistance(group: TaskGroup) {
    const members = TaskGroupMemberService.extractGroupMembers(group);
    const averageTaskCount = members.length > 0 
      ? group.tasks.length / members.length 
      : 0;
    
    return members.filter(member => {
      const memberTaskCount = TaskGroupMemberService.getMemberTaskCount(member.id, group);
      const overloadedThreshold = averageTaskCount * 1.5; // 50% more than average
      
      return memberTaskCount > overloadedThreshold;
    }).map(member => ({
      member,
      taskCount: TaskGroupMemberService.getMemberTaskCount(member.id, group),
      overloadFactor: TaskGroupMemberService.getMemberTaskCount(member.id, group) / averageTaskCount
    }));
  }
};

/**
 * Member management hooks for React components
 */
export const useMemberManagement = (group: TaskGroup | null) => {
  const isValidGroup = group !== null;
  
  const getMemberStats = () => {
    if (!isValidGroup) return null;
    return TaskGroupMemberService.getGroupMembershipSummary(group);
  };
  
  const getMembersByRole = () => {
    if (!isValidGroup) return { owner: null, members: [] };
    return TaskGroupMemberService.getMembersByRole(group);
  };
  
  const checkMembership = (userId: string) => {
    if (!isValidGroup) return false;
    return TaskGroupMemberService.isGroupMember(userId, group);
  };
  
  const getMemberTaskCount = (userId: string) => {
    if (!isValidGroup) return 0;
    return TaskGroupMemberService.getMemberTaskCount(userId, group);
  };
  
  const getHealthMetrics = () => {
    if (!isValidGroup) return null;
    return memberAnalytics.getGroupHealthMetrics(group);
  };
  
  const getActivityAnalysis = () => {
    if (!isValidGroup) return [];
    return memberAnalytics.getMemberActivityAnalysis(group);
  };
  
  return {
    getMemberStats,
    getMembersByRole,
    checkMembership,
    getMemberTaskCount,
    getHealthMetrics,
    getActivityAnalysis,
    isValidGroup
  };
};

/**
 * Advanced search and filtering utilities
 */
export const memberFilters = {
  /**
   * Filter members by various criteria
   */
  filterMembers(
    allUsers: User[], 
    currentMembers: User[], 
    filters: {
      searchTerm?: string;
      excludeMembers?: boolean;
      includeMembers?: boolean;
      hasTasksInGroup?: boolean;
      group?: TaskGroup;
    }
  ) {
    let filtered = allUsers;
    
    // Apply search term filter
    if (filters.searchTerm) {
      filtered = TaskGroupMemberService.searchUsers(filtered, filters.searchTerm);
    }
    
    // Apply membership filters
    if (filters.excludeMembers) {
      filtered = TaskGroupMemberService.getAvailableUsers(filtered, currentMembers);
    } else if (filters.includeMembers) {
      filtered = filtered.filter(user => 
        currentMembers.some(member => member.id === user.id)
      );
    }
    
    // Apply task-based filters
    if (filters.hasTasksInGroup !== undefined && filters.group) {
      filtered = filtered.filter(user => {
        const hasActiveTasks = TaskGroupMemberService.getMemberTaskCount(user.id, filters.group!) > 0;
        return filters.hasTasksInGroup ? hasActiveTasks : !hasActiveTasks;
      });
    }
    
    return filtered;
  }
};

export default {
  batchMemberOperations,
  memberAnalytics,
  memberRecommendations,
  useMemberManagement,
  memberFilters
};

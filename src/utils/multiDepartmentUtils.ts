import { User, Department, MultiDepartmentUser } from '@/interface/general';

/**
 * Utility functions for multi-department operations
 */

export const multiDepartmentUtils = {
  /**
   * Get user's primary department from userDepartments array
   */
  getPrimaryDepartment: (user: User): Department | null => {
    if (!user.userDepartments) {
      // Fallback to legacy department field
      return user.department || null;
    }
    
    const primaryAssignment = user.userDepartments.find(ud => ud.isPrimary);
    return primaryAssignment?.department || null;
  },

  /**
   * Get all departments for a user (excluding primary)
   */
  getSecondaryDepartments: (user: User): Department[] => {
    if (!user.userDepartments) return [];
    
    return user.userDepartments
      .filter(ud => !ud.isPrimary)
      .map(ud => ud.department);
  },

  /**
   * Get all departments for a user
   */
  getAllDepartments: (user: User): Department[] => {
    if (!user.userDepartments) {
      // Fallback to legacy fields
      return user.department ? [user.department] : [];
    }
    
    return user.userDepartments.map(ud => ud.department);
  },

  /**
   * Check if user belongs to a specific department
   */
  isUserInDepartment: (user: User, departmentId: string): boolean => {
    if (!user.userDepartments) {
      // Fallback to legacy department field
      return user.departmentId === departmentId;
    }
    
    return user.userDepartments.some(ud => ud.departmentId === departmentId);
  },

  /**
   * Get user's role in a specific department
   */
  getUserRoleInDepartment: (user: User, departmentId: string): string | null => {
    if (!user.userDepartments) return null;
    
    const assignment = user.userDepartments.find(ud => ud.departmentId === departmentId);
    return assignment?.role || null;
  },

  /**
   * Check if department is user's primary department
   */
  isPrimaryDepartment: (user: User, departmentId: string): boolean => {
    if (!user.userDepartments) {
      // Fallback to legacy department field
      return user.departmentId === departmentId;
    }
    
    const primaryAssignment = user.userDepartments.find(ud => ud.isPrimary);
    return primaryAssignment?.departmentId === departmentId;
  },

  /**
   * Transform regular User to MultiDepartmentUser with computed fields
   */
  transformToMultiDepartmentUser: (user: User): MultiDepartmentUser => {
    const allDepartments = user.userDepartments?.map(ud => ({
      id: ud.department.id,
      name: ud.department.name,
      isPrimary: ud.isPrimary,
      role: ud.role,
      assignedAt: ud.assignedAt
    })) || [];

    const primaryDepartment = multiDepartmentUtils.getPrimaryDepartment(user);
    const primaryDepartmentInfo = primaryDepartment ? {
      id: primaryDepartment.id,
      name: primaryDepartment.name,
      code: primaryDepartment.code
    } : null;

    return {
      ...user,
      allDepartments,
      primaryDepartmentInfo
    };
  },

  /**
   * Filter users by department (supports both primary and secondary)
   */
  filterUsersByDepartment: (users: User[], departmentId: string, primaryOnly = false): User[] => {
    return users.filter(user => {
      if (primaryOnly) {
        return multiDepartmentUtils.isPrimaryDepartment(user, departmentId);
      }
      return multiDepartmentUtils.isUserInDepartment(user, departmentId);
    });
  },

  /**
   * Get department statistics
   */
  getDepartmentStats: (department: Department, users: User[]) => {
    const allUsers = multiDepartmentUtils.filterUsersByDepartment(users, department.id);
    const primaryUsers = multiDepartmentUtils.filterUsersByDepartment(users, department.id, true);
    const secondaryUsers = allUsers.filter(user => 
      !multiDepartmentUtils.isPrimaryDepartment(user, department.id)
    );

    return {
      totalUsers: allUsers.length,
      primaryUsers: primaryUsers.length,
      secondaryUsers: secondaryUsers.length,
      department
    };
  },

  /**
   * Format department display text with multi-department context
   */
  formatDepartmentDisplay: (user: User): string => {
    if (!user.userDepartments || user.userDepartments.length === 0) {
      // Fallback to legacy department
      return user.department?.name || 'No Department';
    }

    const primary = multiDepartmentUtils.getPrimaryDepartment(user);
    const secondaryCount = user.userDepartments.length - 1;

    if (secondaryCount === 0) {
      return primary?.name || 'No Department';
    }

    return `${primary?.name || 'No Primary'}${secondaryCount > 0 ? ` +${secondaryCount} more` : ''}`;
  },

  /**
   * Validate department assignment request
   */
  validateDepartmentAssignment: (
    departmentIds: string[], 
    primaryDepartmentId: string | undefined,
    availableDepartments: Department[]
  ): { isValid: boolean; error?: string } => {
    if (departmentIds.length === 0) {
      return { isValid: false, error: 'At least one department must be selected' };
    }

    if (primaryDepartmentId && !departmentIds.includes(primaryDepartmentId)) {
      return { isValid: false, error: 'Primary department must be in the selected departments' };
    }

    const invalidDepartments = departmentIds.filter(id => 
      !availableDepartments.some(dept => dept.id === id)
    );

    if (invalidDepartments.length > 0) {
      return { isValid: false, error: 'Some selected departments are invalid' };
    }

    return { isValid: true };
  },

  /**
   * Sort users by primary department name
   */
  sortUsersByPrimaryDepartment: (users: User[]): User[] => {
    return [...users].sort((a, b) => {
      const deptA = multiDepartmentUtils.getPrimaryDepartment(a)?.name || 'ZZZ';
      const deptB = multiDepartmentUtils.getPrimaryDepartment(b)?.name || 'ZZZ';
      return deptA.localeCompare(deptB);
    });
  },

  /**
   * Group users by their primary department
   */
  groupUsersByPrimaryDepartment: (users: User[]): { [departmentName: string]: User[] } => {
    return users.reduce((groups, user) => {
      const primaryDept = multiDepartmentUtils.getPrimaryDepartment(user);
      const deptName = primaryDept?.name || 'No Department';
      
      if (!groups[deptName]) {
        groups[deptName] = [];
      }
      groups[deptName].push(user);
      
      return groups;
    }, {} as { [departmentName: string]: User[] });
  }
};

export default multiDepartmentUtils;

export interface Permission {
  id: string
  name: string
  description?: string
  module?: string
  key?: string
  action: string
  category: string
  resource: string
  createdAt?: string
  updatedAt?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  orgId: string
  organizationId: string
  permissions: Permission[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
  }
}

export interface RawPermission {
  id: string
  name: string
  description?: string | null
  module?: string | null
  key?: string | null
  action: string
  createdAt?: string
  updatedAt?: string
}

export interface RawRolePermission {
  id: string
  roleId: string
  permissionId: string
  permission: RawPermission
}

export interface RawRole {
  id: string
  orgId: string
  name: string
  description?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
  permissions?: RawRolePermission[]
  _count?: {
    users: number
  }
}

export const normalizePermission = (permission: RawPermission): Permission => ({
  id: permission.id,
  name: permission.name,
  description: permission.description ?? undefined,
  module: permission.module ?? undefined,
  key: permission.key ?? undefined,
  action: permission.action,
  category: permission.module ?? 'General',
  resource: permission.module ?? 'general',
  createdAt: permission.createdAt,
  updatedAt: permission.updatedAt,
})

export const normalizeRole = (role: RawRole): Role => ({
  id: role.id,
  name: role.name,
  description: role.description ?? undefined,
  orgId: role.orgId,
  organizationId: role.orgId,
  permissions: (role.permissions ?? []).map((rolePermission) =>
    normalizePermission(rolePermission.permission)
  ),
  isDefault: role.isDefault,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
  _count: role._count,
})

export const unwrapList = <T>(payload: T[] | { data?: T[] }): T[] =>
  Array.isArray(payload) ? payload : payload.data ?? []

export const unwrapItem = <T>(payload: T | { data?: T }): T => {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    const data = (payload as { data?: T }).data
    if (data !== undefined) {
      return data
    }
  }
  return payload as T
}

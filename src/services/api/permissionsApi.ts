import axios from 'axios'
import { APIDictionary } from '@/services/api/v2/APIdict'
import type { Permission } from '@/types/general'

export const permissionsApi = {
  async getAllPermissions(): Promise<Permission[]> {
    const { data } = await axios.get(APIDictionary.Permission, { withCredentials: true })
    return data
  }
}

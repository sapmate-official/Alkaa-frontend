import axios from 'axios';
import { APIDictionary } from '@/api/v2/APIdict';

export const taskGroupService = {
  async getAllGroups() {
    const response = await axios.get(APIDictionary.taskGroups, { withCredentials: true });
    return response.data;
  },

  async getGroupById(groupId: string) {
    const response = await axios.get(APIDictionary.taskGroupById(groupId), { withCredentials: true });
    return response.data;
  }
};

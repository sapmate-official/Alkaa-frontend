import { APIDictionary } from '@/api/APIdict';
import { useAuth } from '@/services/AuthContext';
import axios from 'axios';
import  { useEffect } from 'react'

const ListOfEmployee = () => {
    const { user } = useAuth()
    const fetchListOfEmployee = async () => {
        try {
            const response = await axios.get(`${APIDictionary.Organization}/employees/${user?.organization?.id}`);
            console.log(response.data);
        } catch (error) {
            console.error('Failed to fetch employee list:', error);
        }
    }
    useEffect(() => {
        if (user?.organization?.id) {
            fetchListOfEmployee()
        }
    }, [user])
  return (
    <div>ListOfEmployee</div>
  )
}

export default ListOfEmployee
import  { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { APIDictionary } from '../../../api/APIdict'
import { useToast } from '@/hooks/use-toast'

interface LeaveTypeForm {
  name: string
  description: string
  annualLimit: number
}

export const CreateLeaveType = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LeaveTypeForm>()
  const {toast} = useToast()

  const onSubmit = async (data: LeaveTypeForm) => {
    setIsSubmitting(true)
    try {
      const dataa = await axios.post(APIDictionary.leaveTypeCreate, data)
console.log(dataa.data);

      toast({title:'Leave type created successfully',
        description: 'Leave type has been created successfully',
      })
      reset()
    } catch (err) {
      toast({
        title: 'Failed to create leave type',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  console.log("CreateLeaveType - Rendering...");
  

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create Leave Type</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            {...register('name', { required: 'Name is required' })}
            className="w-full border p-2 rounded"
            disabled={isSubmitting}
          />
          {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            className="w-full border p-2 rounded"
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Annual Limit</label>
          <input
            type="number"
            {...register('annualLimit', { 
              required: 'Annual limit is required',
              min: { value: 1, message: 'Must be greater than 0' }
            })}
            className="w-full border p-2 rounded"
            disabled={isSubmitting}
          />
          {errors.annualLimit && <span className="text-red-500 text-sm">{errors.annualLimit.message}</span>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Leave Type'}
        </button>
      </form>
    </div>
  )
}
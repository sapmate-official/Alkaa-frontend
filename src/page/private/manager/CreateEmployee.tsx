// import  { useState } from 'react';
// import axios from 'axios';
// import { APIDictionary } from '../../../api/v2/APIdict';
// import { useToast } from '@/hooks/use-toast';


// const CreateEmployee = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//   });
//   const { toast } = useToast();

//   const handleChange = (e:any) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e:any) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post(APIDictionary.create_employee, formData);
//       if (response.status === 201) {
//         toast({
//             title: 'Employee created successfully',
//             description: 'Employee has been created successfully',
//         })
//         setFormData({ name: '', email: '' });
//       }
//     } catch (error) {
//         console.log(error);
        
//       toast({
//         title: 'Failed to create employee',
//         description: 'Please try again later',
//         variant: 'destructive',
//       })
//     }
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-2xl font-bold mb-4">Create New Employee</h2>
//       <form onSubmit={handleSubmit} className="max-w-md">
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-1">Name</label>
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-1">Email</label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>
//         <button
//           type="submit"
//           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//         >
//           Create Employee
//         </button>
//       </form>
//     </div>
//   );
// };

// export default CreateEmployee;


// // Personal information: 

// //   1.Full name
// // 2. Address 
// // 3. Adhar number 
// // 4. Pan number 
// // 5. Mobile number 
// // 6. Date of birth 

// // Employment & Compensation:

// // 1. Hiring date 
// // 2. Company name ( picklist)
// // 3. Department 
// // 4. Bank details ( A/C Holder Name , A/C number, IFSc code & Bank name)
// // 5. Annual package 
// // 6. Monthly salary
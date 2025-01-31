import  { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { APIDictionary } from '../../lib/APIdict';

const SetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
const navigate = useNavigate()
  const handleSubmit = async (e:any) => {
    e.preventDefault();
    try {
      const response = await axios.post(APIDictionary.setPassword, {
        password,
        verificationToken: token,
      });
      console.log(response.data);
      navigate('/sign-in')
      setMessage('Password has been set successfully.');
    } catch (error) {
      setMessage('Error setting password.');
    }
  };

  return (
    <div>
      <h1>Set Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />
        <button type="submit">Set Password</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default SetPassword;
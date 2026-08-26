import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [currState, setCurrState] = useState('Sign up');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext);

  const submitHandler = (e) => {
    e.preventDefault();

    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    const endpoint = currState === 'Sign up' ? 'Signup' : 'login';
    const credentials = { fullName, email, password, bio };
    
    login(endpoint, credentials);
  };

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'
      style={{ backgroundImage: `url(${assets.bgImage})` }}
    >
      <img src={assets.logo} alt="Logo" className='w-[min(30vw,250px)]' />

      <form onSubmit={submitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg w-full max-w-md'>
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState}
          {isDataSubmitted && (
            <img 
              onClick={() => setIsDataSubmitted(false)} 
              src={assets.arrow_icon} 
              className='w-5 cursor-pointer' 
              alt="Back" 
            />
          )}
        </h2>

        {currState === 'Sign up' && !isDataSubmitted && (
          <input 
            onChange={(e) => setFullName(e.target.value)} 
            value={fullName} 
            type="text" 
            placeholder='Enter your name' 
            className='p-2 border border-gray-500 rounded-md focus:outline-none bg-transparent text-white placeholder-gray-400' 
            required 
          />
        )}

        {!isDataSubmitted && (
          <>
            <input 
              onChange={(e) => setEmail(e.target.value)} 
              value={email} 
              type="email" 
              placeholder='Enter your email' 
              className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-white placeholder-gray-400' 
              required 
            />
            <input 
              onChange={(e) => setPassword(e.target.value)} 
              value={password} 
              type="password" 
              placeholder='Enter your password' 
              className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-white placeholder-gray-400' 
              required 
              // ✅ NO minLength HERE!
            />
          </>
        )}

        {currState === 'Sign up' && isDataSubmitted && (
          <textarea 
            onChange={(e) => setBio(e.target.value)} 
            value={bio} 
            rows={4} 
            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-white placeholder-gray-400' 
            placeholder='Provide a Short Bio' 
            required 
          />
        )}

        <button 
          type='submit' 
          className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'
        >
          {currState === 'Sign up' ? 'Create Account' : 'Login Now'}
        </button>

        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <input type="checkbox" required />
          <p>Agree to the terms of use & privacy policy</p>
        </div>

        <div className='flex flex-col gap-2'>
          {currState === 'Sign up' ? (
            <p className='text-sm text-gray-300'>
              Already have an account?{' '}
              <span 
                onClick={() => { setCurrState("Login"); setIsDataSubmitted(false); }} 
                className='font-medium text-violet-400 cursor-pointer hover:text-violet-300'
              >
                Login here
              </span>
            </p>
          ) : (
            <p className='text-sm text-gray-300'>
              Don't have an account?{' '}
              <span 
                onClick={() => { setCurrState("Sign up"); }} 
                className='font-medium text-violet-400 cursor-pointer hover:text-violet-300'
              >
                Sign up
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
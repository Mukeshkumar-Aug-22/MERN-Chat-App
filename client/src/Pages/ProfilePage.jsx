import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState(authUser?.fullName || '');
  const [bio, setBio] = useState(authUser?.bio || '');
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!selectedImage) {
        const success = await updateProfile({ fullName: name, bio });
        if (success) {
          toast.success('Profile updated successfully!');
          navigate('/');
        }
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        const base64Image = reader.result;
        const success = await updateProfile({ 
          profilePic: base64Image, 
          fullName: name, 
          bio 
        });
        if (success) {
          toast.success('Profile updated with image!');
          navigate('/');
        }
      };
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center p-4'
      style={{ backgroundImage: `url(${assets.bgImage})` }}
    >
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex justify-between items-center max-sm:flex-col-reverse rounded-lg'>
        
        <form onSubmit={submitHandler} className='flex flex-col gap-5 p-10 flex-1 w-full'>
          <h3 className='text-white text-2xl font-semibold'>Profile Details</h3>

          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer hover:text-white transition-colors'>
            <input 
              onChange={(e) => setSelectedImage(e.target.files[0])} 
              type="file" 
              id="avatar" 
              accept='.png, .jpg, .jpeg' 
              hidden
            />
            <img 
              src={selectedImage ? URL.createObjectURL(selectedImage) : (authUser?.profilePic || assets.avatar_icon)} 
              alt="Profile" 
              className='w-12 h-12 object-cover rounded-full'
            />
            <span className='text-sm'>Upload Profile Image</span>
          </label>

          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className='p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white placeholder-gray-400' 
            placeholder='Your name' 
            required 
          />
          
          <textarea 
            rows={4} 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            className='p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white placeholder-gray-400' 
            placeholder='Write Profile Bio' 
            required
          />
          
          <button 
            type='submit' 
            className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50'
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <img 
          src={authUser?.profilePic || assets.logo_icon} 
          className='max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10' 
          alt="Profile" 
        />
      </div>
    </div>
  );
};

export default ProfilePage;
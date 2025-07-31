import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth(); // your actual user from context
  // Local state for editing
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [profilePic, setProfilePic] = useState(null); // for preview

  // File upload handler
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
      // You'll also want to update user profilePic on backend in a real app
    }
  };

  // Dummy save handler (replace with API call)
  const handleSave = (e) => {
    e.preventDefault();
    // Do update call here
    setEditing(false);
  };

  // Dummy cancel handler
  const handleCancel = () => {
    setEditing(false);
    setFullName(user.full_name);
    setEmail(user.email);
    setProfilePic(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-2 text-lg text-gray-600">Manage your account information and settings</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Account Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="w-32 h-32 mx-auto flex items-center justify-center rounded-xl bg-gray-100 border-2 border-dashed overflow-hidden">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    // Default avatar
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4a4 4 0 110 8 4 4 0 010-8zm0 10c-5 0-8 2.5-8 5v1h16v-1c0-2.5-3-5-8-5z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                {!editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="text-lg">{user.full_name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="text-lg">{user.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                      <div className="text-lg capitalize">{user.role}</div>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSave}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        className="w-full border rounded px-3 py-2"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        className="w-full border rounded px-3 py-2"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Save</button>
                      <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            {!editing && (
              <button
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

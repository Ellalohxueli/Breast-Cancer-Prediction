'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiSun, FiMoon, FiBell, FiMessageCircle, FiChevronDown, FiX } from 'react-icons/fi';
import { FaUserDoctor } from 'react-icons/fa6';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import axios from 'axios';

const DoctorsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDeleteSuccessMessage, setShowDeleteSuccessMessage] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);
  const [isEditDoctorModalOpen, setIsEditDoctorModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    operatingHours: '',
    bio: '',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEditSuccessMessage, setShowEditSuccessMessage] = useState(false);
  const [isViewDoctorModalOpen, setIsViewDoctorModalOpen] = useState(false);
  const [viewDoctor, setViewDoctor] = useState<any>(null);

  // Define the type for doctor fields
  type DoctorFields = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';
  type DoctorForm = Record<DoctorFields, string>;

  const [newDoctor, setNewDoctor] = useState<DoctorForm>({
    name: '',
    email: '',
    phone: '+60',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  useEffect(() => {
    try {
      const storedFirstname = localStorage.getItem('firstname');
      if (storedFirstname) {
        setFirstName(storedFirstname);
      }
    } catch (error) {
      console.error('Error getting firstname from localStorage:', error);
    }

    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('firstname');
    window.location.href = '/login';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      // Only allow digits
      const numbersOnly = value.replace(/\D/g, '');
      
      // Limit to 10 digits after +60
      if (numbersOnly.length <= 10) {
        setNewDoctor(prev => ({
          ...prev,
          [name]: '+60' + numbersOnly
        }));
      }
    } else {
      setNewDoctor(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/admin/doctors');
      if (response.data.data) {
        setDoctors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter((doctor: any) => {
      const nameMatch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase());
      const specializationMatch = doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || specializationMatch;
    });
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors]);

  const handleDeleteDoctor = async (doctorId: string) => {
    setDoctorToDelete(doctorId);
    setDeleteConfirmationModal(true);
  };

  const confirmDelete = async () => {
    if (doctorToDelete) {
      try {
        await axios.delete(`/api/admin/doctors?id=${doctorToDelete}`);
        setDeleteConfirmationModal(false);
        setDoctorToDelete(null);
        // Show delete success message
        setShowDeleteSuccessMessage(true);
        setTimeout(() => {
          setShowDeleteSuccessMessage(false);
        }, 3000);
        // Refresh the doctors list
        await fetchDoctors();
      } catch (error) {
        console.error('Error deleting doctor:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    
    // Basic validation
    if (!newDoctor.name) {
      newErrors.name = 'Name is required';
    }
    if (!newDoctor.email) {
      newErrors.email = 'Email is required';
    } else if (!newDoctor.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!newDoctor.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (newDoctor.phone.length < 12) { // +60 + 9 digits
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!newDoctor.password) {
      newErrors.password = 'Password is required';
    } else if (newDoctor.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (!newDoctor.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newDoctor.password !== newDoctor.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Clear the fields with errors
      const errorFields = Object.keys(newErrors) as DoctorFields[];
      setNewDoctor(prev => {
        const updated = { ...prev };
        errorFields.forEach(field => {
          updated[field] = '';
        });
        return updated;
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log('Attempting to register doctor with data:', {
        name: newDoctor.name,
        email: newDoctor.email,
        phone: newDoctor.phone
      });

      const response = await axios.post('/api/admin/doctors', {
        name: newDoctor.name,
        email: newDoctor.email,
        phone: newDoctor.phone,
        password: newDoctor.password
      });

      console.log('Registration successful:', response.data);

      if (response.data.message) {
        // Reset form and close modal
        setNewDoctor({
          name: '',
          email: '',
          phone: '+60',
          password: '',
          confirmPassword: ''
        });
        setIsAddDoctorModalOpen(false);
        setShowSuccessMessage(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);

        // Refresh the doctors list
        await fetchDoctors();
      }
      
    } catch (error: any) {
      console.error('Registration error details:', {
        name: error.name,
        message: error.message,
        response: {
          data: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        },
        stack: error.stack
      });
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 400) {
          // Handle validation errors from the server
          if (error.response.data?.errors) {
            // If server returns multiple field-specific errors
            setErrors(error.response.data.errors);
            // Clear the fields with errors
            const errorFields = Object.keys(error.response.data.errors) as DoctorFields[];
            setNewDoctor(prev => {
              const updated = { ...prev };
              errorFields.forEach(field => {
                updated[field] = '';
              });
              return updated;
            });
          } else if (error.response.data?.error) {
            // If server returns a single error message
            if (typeof error.response.data.error === 'object') {
              setErrors(error.response.data.error);
              // Clear the fields with errors
              const errorFields = Object.keys(error.response.data.error) as DoctorFields[];
              setNewDoctor(prev => {
                const updated = { ...prev };
                errorFields.forEach(field => {
                  updated[field] = '';
                });
                return updated;
              });
            } else if (error.response.data.error.toLowerCase().includes('email')) {
              setErrors({ email: error.response.data.error });
              // Clear email field
              setNewDoctor(prev => ({ ...prev, email: '' }));
            } else {
              setErrors({ general: error.response.data.error });
            }
          } else {
            // Generic 400 error
            setErrors({ general: 'Invalid data provided. Please check your inputs.' });
          }
        } else if (error.response.status === 409) {
          setErrors({ email: 'A doctor with this email already exists.' });
          // Clear email field
          setNewDoctor(prev => ({ ...prev, email: '' }));
        } else if (error.response.status === 500) {
          setErrors({ general: 'Server error occurred. Please try again later.' });
        } else {
          setErrors({ general: `Registration failed: ${error.response.statusText}` });
        }
      } else if (error.request) {
        // Request was made but no response received
        setErrors({ general: 'No response received from server. Please check your connection and try again.' });
      } else if (error.message === 'Network Error') {
        setErrors({ general: 'Unable to connect to the server. Please check your internet connection.' });
      } else {
        // Something else went wrong
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setEditFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization || '',
      operatingHours: doctor.operatingHours || '',
      bio: doctor.bio || '',
      image: doctor.image || ''
    });
    setImagePreview(doctor.image || null);
    setIsEditDoctorModalOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'operatingHours') {
      // Format operating hours with specific capitalization
      const formattedValue = value
        // First, convert everything to lowercase
        .toLowerCase()
        // Capitalize first letter of each word that might be a day
        .replace(/\b(mon|tue|wed|thu|fri|sat|sun)\b/gi, (day) => 
          day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
        )
        // Convert AM/PM to uppercase
        .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());

      setEditFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Convert image to base64 for sending to server
      const imageReader = new FileReader();
      imageReader.onloadend = () => {
        setEditFormData(prev => ({
          ...prev,
          image: imageReader.result as string
        }));
      };
      imageReader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    
    // Basic validation
    if (!editFormData.name) {
      newErrors.name = 'Name is required';
    }
    if (!editFormData.email) {
      newErrors.email = 'Email is required';
    } else if (!editFormData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!editFormData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      
      // Calculate Malaysia time (UTC+8)
      const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const now = new Date();
      const malaysiaTime = new Date(now.getTime() + malaysiaOffset);
      
      const response = await axios.put('/api/admin/doctors', {
        id: selectedDoctor._id,
        ...editFormData,
        updatedAt: malaysiaTime.toISOString()
      });

      if (response.data.message) {
        setIsEditDoctorModalOpen(false);
        setShowEditSuccessMessage(true);
        setTimeout(() => {
          setShowEditSuccessMessage(false);
        }, 3000);
        await fetchDoctors();
      }
      
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'An error occurred while updating the doctor.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoctor = (doctor: any) => {
    setViewDoctor(doctor);
    setIsViewDoctorModalOpen(true);
  };

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar - Fixed */}
      <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div>
          <div className="p-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-4">
                <div className={`p-1 rounded-xl w-[56px] h-[56px] flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
                }`}>
                  <Image 
                    src="/logo.png"
                    alt="PinkPath Logo"
                    width={64}
                    height={64}
                    className="object-contain rounded-lg"
                  />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-pink-800'}`}>
                  PinkPath
                </h2>
              </div>
            </div>
          </div>
          <nav className="mt-6">
            <div className="px-4 space-y-2">
              {[
                { href: "/admindashboard", icon: <FiHome className="w-5 h-5 mr-4" />, text: "Dashboard" },
                { href: "/admindashboard/appointments", icon: <FiCalendar className="w-5 h-5 mr-4" />, text: "Appointments" },
                { href: "/admindashboard/doctors", icon: <FaUserDoctor className="w-5 h-5 mr-4" />, text: "Doctors" },
                { href: "/admindashboard/patients", icon: <FiUsers className="w-5 h-5 mr-4" />, text: "Patients" },
                { href: "/admindashboard/information", icon: <FiFileText className="w-5 h-5 mr-4" />, text: "Information" },
                { href: "/admindashboard/settings", icon: <FiSettings className="w-5 h-5 mr-4" />, text: "Settings" }
              ].map((item, index) => (
                <Link 
                  key={index}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors relative ${
                    pathname === item.href
                      ? isDarkMode 
                        ? 'text-pink-400'
                        : 'text-pink-800'
                      : isDarkMode 
                        ? 'text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-pink-100'
                  }`}
                >
                  {pathname === item.href && (
                    <div className={`absolute right-0 top-0 h-full w-1 ${
                      isDarkMode ? 'bg-pink-400' : 'bg-pink-800'
                    }`}></div>
                  )}
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content Area with Top Menu */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Menu Bar - Fixed */}
        <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} shadow-sm`}>
          {/* Welcome Message */}
          <div className="flex-shrink-0">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Manage Doctor
            </h1>
            <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentDate}
            </p>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-6">
            {/* Messages */}
            <button className="relative">
              <FiMessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                5
              </span>
            </button>

            {/* Notifications */}
            <button className="relative">
              <FiBell className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>

            {/* Vertical Divider */}
            <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

            {/* Theme Toggle and Profile */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              {/* <div className={`flex items-center justify-between w-16 h-8 rounded-full p-1 cursor-pointer ${
                isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
              }`}
              onClick={toggleTheme}>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                  isDarkMode ? 'bg-transparent' : 'bg-white'
                }`}>
                  <FiSun className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-pink-800'}`} />
                </div>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                  isDarkMode ? 'bg-white' : 'bg-transparent'
                }`}>
                  <FiMoon className={`w-4 h-4 ${isDarkMode ? 'text-gray-800' : 'text-gray-400'}`} />
                </div>
              </div> */}

              {/* Profile */}
              <div className="flex items-center space-x-3 relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                      {firstName.charAt(0)}
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <p className="text-sm font-medium">{firstName}</p>
                    <FiChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400/70'} transition-transform ${isProfileOpen ? 'transform rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                  }`}>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        isDarkMode 
                          ? 'text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      } transition-colors flex items-center space-x-2`}
                    >
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - With top padding for fixed header */}
        <div className="flex-1 p-4 pt-28">
          {/* Search and Add Button */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-96">
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                } focus:outline-none focus:border-pink-500`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <button 
              onClick={() => setIsAddDoctorModalOpen(true)}
              className={`${isDarkMode ? 'bg-gray-800/80 hover:bg-gray-700/90' : 'bg-gray-500/10 hover:bg-gray-500/20'} text-${isDarkMode ? 'gray-200' : 'gray-700'} px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            >
              <FaPlus /> Add New Doctor
            </button>
          </div>

          {/* Doctors Table */}
          <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`w-3/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Doctor Info
                    </th>
                    <th className={`w-3/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Contact
                    </th>
                    <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Specialist
                    </th>
                    <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Operation Hours
                    </th>
                    <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredDoctors.map((doctor: any) => (
                    <tr key={doctor._id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="w-3/12 px-6 py-4 max-w-0">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 flex-shrink-0 relative">
                            {doctor.image ? (
                              <Image
                                src={doctor.image}
                                alt={`${doctor.name}'s profile`}
                                fill
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-pink-200 flex items-center justify-center">
                                <span className="text-lg font-medium text-pink-800">
                                  {doctor.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{doctor.name}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px]`}>
                              {doctor.bio || 'No bio available'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="w-3/12 px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="truncate">{doctor.email}</div>
                          <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {doctor.phone}
                          </div>
                        </div>
                      </td>
                      <td className="w-2/12 px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm truncate max-w-full ${
                          isDarkMode ? 'bg-pink-400/10 text-pink-400' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {doctor.specialization || 'Not specified'}
                        </span>
                      </td>
                      <td className="w-2/12 px-6 py-4">
                        <div className="text-sm truncate">
                          {doctor.operatingHours || 'Not specified'}
                        </div>
                      </td>
                      <td className="w-2/12 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleViewDoctor(doctor)}
                            className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:opacity-80`} 
                            title="View"
                          >
                            <FaEye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(doctor)}
                            className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} hover:opacity-80`} 
                            title="Edit"
                          >
                            <FaEdit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDoctor(doctor._id)}
                            className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} hover:opacity-80`} 
                            title="Delete"
                          >
                            <FaTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDoctors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No doctors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Doctor Modal */}
          {isAddDoctorModalOpen && (
            <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50">
              <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-md relative shadow-xl backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setIsAddDoctorModalOpen(false)}
                  className={`absolute right-4 top-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                >
                  <FiX className="w-5 h-5" />
                </button>
                
                <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Register New Doctor
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newDoctor.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors.name
                          ? 'border-red-500 ring-1 ring-red-500'
                          : isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none ${errors.name ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500'} ${
                        isDarkMode 
                          ? 'placeholder-gray-400 caret-white' 
                          : 'placeholder-gray-500 caret-gray-700'
                      }`}
                      placeholder="Enter doctor's full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newDoctor.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors.email
                          ? 'border-red-500 ring-1 ring-red-500'
                          : isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none ${errors.email ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500'} ${
                        isDarkMode 
                          ? 'placeholder-gray-400 caret-white' 
                          : 'placeholder-gray-500 caret-gray-700'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`}>
                        +60
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={newDoctor.phone.slice(3)} // Remove +60 from display
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-3 py-2 rounded-lg border ${
                          errors.phone
                            ? 'border-red-500 ring-1 ring-red-500'
                            : isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-700'
                        } focus:outline-none ${errors.phone ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500'} ${
                          isDarkMode 
                            ? 'placeholder-gray-400 caret-white' 
                            : 'placeholder-gray-500 caret-gray-700'
                        }`}
                        placeholder="1123456789"
                        maxLength={11} // Updated to allow for Malaysian mobile numbers
                        pattern="[0-9]*"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={newDoctor.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors.password
                          ? 'border-red-500 ring-1 ring-red-500'
                          : isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none ${errors.password ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500'} ${
                        isDarkMode 
                          ? 'placeholder-gray-400 caret-white' 
                          : 'placeholder-gray-500 caret-gray-700'
                      }`}
                      placeholder="Enter password"
                      minLength={8}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Password must be at least 8 characters long
                    </p>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={newDoctor.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors.confirmPassword
                          ? 'border-red-500 ring-1 ring-red-500'
                          : isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none ${errors.confirmPassword ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-pink-500'} ${
                        isDarkMode 
                          ? 'placeholder-gray-400 caret-white' 
                          : 'placeholder-gray-500 caret-gray-700'
                      }`}
                      placeholder="Confirm password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Show general errors if any */}
                  {errors.general && (
                    <div className="text-red-500 text-sm mt-2">
                      {errors.general}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddDoctorModalOpen(false)}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          <span>Register Doctor</span>
                        </>
                      ) : (
                        "Register Doctor"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmationModal && (
            <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50">
              <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-md relative shadow-xl backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Confirm Delete
                </h2>
                <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to delete this doctor? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setDeleteConfirmationModal(false);
                      setDoctorToDelete(null);
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Doctor Modal */}
          {isEditDoctorModalOpen && selectedDoctor && (
            <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50">
              <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-md relative shadow-xl backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} max-h-[90vh] overflow-y-auto`}>
                <button
                  onClick={() => setIsEditDoctorModalOpen(false)}
                  className={`absolute right-4 top-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                >
                  <FiX className="w-5 h-5" />
                </button>
                
                <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Edit Doctor Information
                </h2>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Photo Upload */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Profile Photo
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-pink-500">
                        {imagePreview ? (
                          <Image
                            src={imagePreview}
                            alt="Doctor profile"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <FaUserDoctor className={`w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className={`inline-block px-4 py-2 rounded-lg cursor-pointer ${
                            isDarkMode 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Choose Photo
                        </label>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Recommended: Square image, max 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      readOnly
                      className={`w-full px-3 py-2 rounded-lg border cursor-not-allowed bg-opacity-60 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-400' 
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      readOnly
                      className={`w-full px-3 py-2 rounded-lg border cursor-not-allowed bg-opacity-60 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-400' 
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors.phone
                          ? 'border-red-500 ring-1 ring-red-500'
                          : isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none focus:border-pink-500`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Specialization
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={editFormData.specialization}
                      onChange={handleEditInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none focus:border-pink-500`}
                      placeholder="Enter specialization"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      name="operatingHours"
                      value={editFormData.operatingHours}
                      onChange={handleEditInputChange}
                      placeholder="e.g., Mon-Fri, 9:00 AM - 5:00 PM"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none focus:border-pink-500`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Enter days and hours in format: Day-Day, HH:MM AM/PM - HH:MM AM/PM (e.g., Mon-Fri, 9:00 AM - 5:00 PM)
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={editFormData.bio}
                      onChange={handleEditInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-700'
                      } focus:outline-none focus:border-pink-500`}
                      rows={3}
                      placeholder="Enter doctor's bio"
                    />
                  </div>

                  {errors.general && (
                    <div className="text-red-500 text-sm mt-2">
                      {errors.general}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditDoctorModalOpen(false)}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          <span>Updating...</span>
                        </>
                      ) : (
                        "Update Doctor"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Success Messages */}
          {showSuccessMessage && (
            <div className="fixed top-24 right-4 flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <p>Doctor registered successfully!</p>
              </div>
            </div>
          )}

          {showEditSuccessMessage && (
            <div className="fixed top-24 right-4 flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <p>Doctor information updated successfully!</p>
              </div>
            </div>
          )}

          {showDeleteSuccessMessage && (
            <div className="fixed top-24 right-4 flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <p>Doctor deleted successfully!</p>
              </div>
            </div>
          )}

          {/* View Doctor Modal */}
          {isViewDoctorModalOpen && viewDoctor && (
            <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50">
              <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-2xl relative shadow-xl backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} max-h-[90vh] overflow-y-auto`}>
                <button
                  onClick={() => setIsViewDoctorModalOpen(false)}
                  className={`absolute right-4 top-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                >
                  <FiX className="w-5 h-5" />
                </button>
                
                <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Doctor Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Profile Image */}
                  <div className="md:col-span-1">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-pink-500">
                      {viewDoctor.image ? (
                        <Image
                          src={viewDoctor.image}
                          alt={`${viewDoctor.name}'s profile`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <FaUserDoctor className={`w-20 h-20 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor Information */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {viewDoctor.name}
                      </h3>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {viewDoctor.specialization || 'No specialization specified'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Email
                        </label>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {viewDoctor.email}
                        </p>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Phone Number
                        </label>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {viewDoctor.phone}
                        </p>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Operating Hours
                        </label>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {viewDoctor.operatingHours || 'Not specified'}
                        </p>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Bio
                        </label>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'} whitespace-pre-wrap`}>
                          {viewDoctor.bio || 'No bio available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsViewDoctorModalOpen(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorsPage;
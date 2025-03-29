'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { FaRegBell } from 'react-icons/fa';
import { FaRegUser } from 'react-icons/fa';
import { BiMessageRounded } from 'react-icons/bi';
import Link from 'next/link';
import useCheckCookies from '@/controller/UseCheckCookie';
import axios from 'axios';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

interface Doctor {
    _id: string;
    name: string;
    specialization: string;
    image?: string;
}

interface BookedAppointment {
    _id: string;
    doctorId: string;
    patientId: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    day: string;
    timeSlot: {
        startTime: string;
        endTime: string;
    };
    status: 'Booked' | 'Pending' | 'Completed' | 'Cancelled';
    appointmentType: 'Consultation' | 'Follow-up';
    doctor?: Doctor;
}

// Helper function to format time to 12-hour format with AM/PM
const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
};

export default function AppointmentsPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'booked' | 'past'>('booked');
    const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'password'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState({ 
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [editedUser, setEditedUser] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [formErrors, setFormErrors] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [appointmentError, setAppointmentError] = useState<string | null>(null);

    useCheckCookies();

    const handleProfileIconClick = () => {
        setShowProfileMenu(prev => !prev);
    };

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");
            localStorage.removeItem('firstname');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setShowProfileMenu(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            const numbersOnly = value.replace(/[^\d]/g, '');
            const formattedPhone = numbersOnly.startsWith('60') 
                ? numbersOnly 
                : `60${numbersOnly}`;
            
            setEditedUser(prev => ({
                ...prev,
                [name]: formattedPhone
            }));
        } else {
            setEditedUser(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSaveChanges = async () => {
        setFormErrors({
            firstName: '',
            lastName: '',
            phone: ''
        });

        let hasErrors = false;
        const newErrors = {
            firstName: '',
            lastName: '',
            phone: ''
        };

        if (!editedUser.firstName.trim()) {
            newErrors.firstName = 'First name is required';
            hasErrors = true;
        }

        if (!editedUser.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
            hasErrors = true;
        }

        const phoneWithoutPrefix = String(editedUser.phone).startsWith('60') 
            ? String(editedUser.phone).slice(2) 
            : String(editedUser.phone);

        if (!phoneWithoutPrefix || phoneWithoutPrefix.length < 9 || phoneWithoutPrefix.length > 10) {
            newErrors.phone = 'Phone number must be between 9 and 10 digits';
            hasErrors = true;
        }

        if (hasErrors) {
            setFormErrors(newErrors);
            return;
        }

        try {
            const response = await axios.put('/api/users/profile', editedUser);
            if (response.data.success) {
                setUser(editedUser);
                setIsProfileModalOpen(false);
                setProfileSuccessMessage(true);
                
                setTimeout(() => {
                    setProfileSuccessMessage(false);
                }, 3000);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.error || 'Failed to update profile. Please try again.');
        }
    };

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
        setPasswordErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    const handlePasswordChange = async () => {
        setPasswordErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });

        let hasErrors = false;
        const newErrors = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        };

        if (!passwordForm.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
            hasErrors = true;
        }

        if (!passwordForm.newPassword) {
            newErrors.newPassword = 'New password is required';
            hasErrors = true;
        } else if (passwordForm.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
            hasErrors = true;
        }

        if (!passwordForm.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
            hasErrors = true;
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            hasErrors = true;
        }

        if (hasErrors) {
            setPasswordErrors(newErrors);
            return;
        }

        try {
            const response = await axios.put('/api/users/password', passwordForm);
            if (response.data.success) {
                setIsProfileModalOpen(false);
                setProfileSuccessMessage(true);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                
                setTimeout(() => {
                    setProfileSuccessMessage(false);
                }, 3000);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to update password';
            setPasswordErrors(prev => ({
                ...prev,
                currentPassword: errorMessage
            }));
        }
    };

    const handleCancelClick = () => {
        setEditedUser({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
        });
        
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        setFormErrors({
            firstName: '',
            lastName: '',
            phone: ''
        });
        setPasswordErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        setIsProfileModalOpen(false);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (isProfileModalOpen) {
                setIsLoading(true);
                setError('');
                try {
                    const response = await axios.get('/api/users/profile');
                    if (response.data.success) {
                        setUser(response.data.user);
                    }
                } catch (error: any) {
                    console.error('Error fetching user data:', error);
                    setError(error.response?.data?.error || 'Failed to load user data');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchUserData();
    }, [isProfileModalOpen]);

    useEffect(() => {
        setEditedUser(user);
    }, [user]);

    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoadingAppointments(true);
            setAppointmentError(null);
            try {
                const response = await axios.get('/api/users/showAppointment');
                
                if (response.data.success) {
                    const appointments = response.data.appointments;
                    console.log('All appointments:', appointments); // Debug log
                    
                    // Filter appointments to show only "Booked" status
                    const booked = appointments.filter((apt: BookedAppointment) => {
                        return apt.status === 'Booked';
                    });
                    
                    console.log('Filtered booked appointments:', booked); // Debug log
                    setBookedAppointments(booked);
                }
            } catch (error: any) {
                console.error('Error fetching appointments:', error);
                setAppointmentError(error.response?.data?.error || 'Failed to load appointments');
            } finally {
                setIsLoadingAppointments(false);
            }
        };

        fetchAppointments();
    }, []);

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            {/* Full width white navigation bar */}
            <div className="w-full bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Breast Cancer Detection Logo"
                                width={50}
                                height={50}
                                className="w-auto h-auto"
                            />
                        </div>
                        
                        <nav className="flex-1">
                            <ul className="flex items-center justify-end space-x-6">
                                <li>
                                    <Link 
                                        href="/dashboard" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/services" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Services
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/ourteams" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Our Team
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/resources" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Patient Resources
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/appointments" 
                                        className="text-pink-600 hover:text-pink-600 font-medium"
                                    >
                                        Appointments
                                    </Link>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-600 hover:text-pink-600 relative">
                                        <div className="relative">
                                            <BiMessageRounded className="h-6 w-6" />
                                            {messageCount > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                    {messageCount}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-600 hover:text-pink-600 relative">
                                        <FaRegBell className="h-6 w-6" aria-label="Notifications" />
                                        {notificationCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </a>
                                </li>
                                <li className="relative">
                                    <button 
                                        className="text-gray-600 hover:text-pink-600 focus:outline-none p-2 rounded-full hover:bg-gray-100"
                                        onClick={handleProfileIconClick}
                                    >
                                        <FaRegUser className="h-6 w-6" aria-label="Profile" />
                                    </button>
                                    
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                            <button
                                                onClick={handleProfileClick}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <FaRegUser className="h-4 w-4 mr-3" />
                                                Profile
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/ourteams"
                                        className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                    >
                                        Schedule Appointment
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Appointments</h1>
                
                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('booked')}
                            className={`${
                                activeTab === 'booked'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200`}
                        >
                            Booked Appointments
                        </button>

                        <button
                            onClick={() => setActiveTab('past')}
                            className={`${
                                activeTab === 'past'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200`}
                        >
                            Past Appointments & Reports
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow">
                    {appointmentError ? (
                        <div className="p-6 text-center text-red-600">
                            <p>{appointmentError}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 text-pink-600 hover:text-pink-700"
                            >
                                Try again
                            </button>
                        </div>
                    ) : isLoadingAppointments ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading appointments...</p>
                        </div>
                    ) : activeTab === 'booked' ? (
                        <div className="p-6">
                            {bookedAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {bookedAppointments.map((appointment) => (
                                        <div 
                                            key={appointment._id} 
                                            className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
                                        >
                                            <div className="flex justify-between">
                                                {/* Left side: Calendar icon with doctor info */}
                                                <div className="flex items-center space-x-4">
                                                    {/* Calendar Icon */}
                                                    <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                                                        <svg 
                                                            className="w-6 h-6 text-pink-600" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                strokeWidth="2" 
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                                            />
                                                        </svg>
                                                    </div>

                                                    {/* Doctor Info and Appointment Type */}
                                                    <div className="space-y-1">
                                                        <div className="text-xl font-bold text-gray-900">
                                                            <span>{appointment.appointmentType}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-gray-600">
                                                                with {appointment.doctor?.name || 'Doctor Name Not Available'}
                                                            </h3>
                                                            <p className="text-gray-500">
                                                                {appointment.doctor?.specialization || 'Specialization Not Available'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right side: Date, time, and buttons */}
                                                <div className="flex flex-col items-end space-y-4">
                                                    {/* Date and Time */}
                                                    <div className="flex items-center text-gray-700">
                                                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>
                                                            {new Date(appointment.dateRange.startDate).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })} at {formatTime(appointment.timeSlot.startTime)}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex space-x-4">
                                                        <button 
                                                            className="px-4 py-2.5 text-sm font-medium text-pink-600 border border-pink-600 rounded-md hover:bg-pink-50 transition-colors"
                                                            onClick={() => {/* Add reschedule logic */}}
                                                        >
                                                            Reschedule
                                                        </button>
                                                        <button 
                                                            className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                                                            onClick={() => {/* Add cancel logic */}}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <p className="text-lg">No upcoming appointments</p>
                                    <Link 
                                        href="/dashboard/ourteams"
                                        className="mt-4 inline-block px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
                                    >
                                        Book an Appointment
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="text-center text-gray-500 py-8">
                                <p className="text-lg">No past appointments</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isProfileModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl w-full max-w-2xl border border-gray-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Account</h2>
                                    <p className="text-gray-600 mt-1">
                                        Set your account settings down below
                                    </p>
                                </div>
                                <button 
                                    onClick={handleCancelClick}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={() => setActiveProfileTab('profile')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeProfileTab === 'profile'
                                            ? 'bg-gray-100 text-pink-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => setActiveProfileTab('password')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeProfileTab === 'password'
                                            ? 'bg-gray-100 text-pink-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Password
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {activeProfileTab === 'profile' ? (
                                <div className="space-y-6">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                                            {error}
                                        </div>
                                    )}
                                    {isLoading ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                                            <p className="mt-2 text-gray-600">Loading profile...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={editedUser.firstName}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {formErrors.firstName && (
                                                    <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={editedUser.lastName}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {formErrors.lastName && (
                                                    <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                                                        +60
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={String(editedUser.phone).startsWith('60') 
                                                            ? String(editedUser.phone).slice(2) 
                                                            : String(editedUser.phone)}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-12 pr-3 py-2 border ${
                                                            formErrors.phone ? 'border-red-500' : 'border-gray-300'
                                                        } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                        placeholder="1123456789"
                                                        minLength={9}
                                                        maxLength={10}
                                                        pattern="[0-9]*"
                                                    />
                                                    {formErrors.phone && (
                                                        <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={passwordForm.currentPassword}
                                                    onChange={handlePasswordInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {passwordErrors.currentPassword && (
                                                    <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    name="newPassword"
                                                    value={passwordForm.newPassword}
                                                    onChange={handlePasswordInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {passwordErrors.newPassword && (
                                                    <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={handlePasswordInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {passwordErrors.confirmPassword && (
                                                    <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50/95 backdrop-blur-sm rounded-b-lg flex justify-end space-x-3">
                            <button
                                onClick={handleCancelClick}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            {activeProfileTab === 'profile' ? (
                                <button
                                    onClick={handleSaveChanges}
                                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                                >
                                    Save Changes
                                </button>
                            ) : (
                                <button
                                    onClick={handlePasswordChange}
                                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                                >
                                    Change Password
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {profileSuccessMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    Profile updated successfully!
                </div>
            )}
        </div>
    );
}

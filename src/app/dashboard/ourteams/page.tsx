"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { BiMessageRounded } from "react-icons/bi";
import { FaRegBell, FaRegUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
import useCheckCookies from "@/controller/UseCheckCookie";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

interface Doctor {
    _id: string;
    name: string;
    specialization: string;
    bio: string;
    image: string;
    operatingHours: string;
    status: string;
}

export default function OurTeamsPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [specialty, setSpecialty] = useState("all");
    const [department, setDepartment] = useState("all");
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [specializations, setSpecializations] = useState([]);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
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
    const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);

    useCheckCookies();

    const handleLogout = async () => {
        try {
            const response = await axios.get("/api/users/logout");
            localStorage.removeItem("firstname");
            window.location.href = "/login";
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams();

                if (specialty && specialty !== "all") {
                    params.append("specialty", specialty);
                }
                if (searchTerm) {
                    params.append("search", searchTerm);
                }

                const queryString = params.toString();
                const url = `/api/users/ourteams${queryString ? `?${queryString}` : ""}`;

                const response = await axios.get(url);
                setDoctors(response.data.data);
                setSpecializations(response.data.specializations);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchDoctors();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, specialty]);

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

    const handlePasswordChange = async () => {
        // Reset errors
        setPasswordErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });

        // Validate fields
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

    useEffect(() => {
        const fetchUserData = async () => {
            if (isProfileModalOpen) {
                try {
                    const response = await axios.get('/api/users/profile');
                    if (response.data.success) {
                        setUser(response.data.user);
                        setEditedUser(response.data.user);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();
    }, [isProfileModalOpen]);

    const handleProfileIconClick = () => {
        setShowProfileMenu(prev => !prev);
    };

    const handleCancelClick = () => {
        // Reset profile form
        setEditedUser({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
        });
        
        // Reset password form
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        // Clear all errors
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
        
        // Close modal
        setIsProfileModalOpen(false);
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            <div className="w-full bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Image src="/logo.png" alt="Breast Cancer Detection Logo" width={50} height={50} className="w-auto h-auto" />
                        </div>

                        <nav className="flex-1">
                            <ul className="flex items-center justify-end space-x-6">
                                <li>
                                    <Link href="/dashboard" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/services" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Services
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/ourteams" className="text-pink-600 hover:text-pink-600 font-medium">
                                        Our Team
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/resources" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Patient Resources
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
                                    <a
                                        href="/dashboard/ourteams" 
                                        className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                    >
                                        Schedule Appointment
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Expert Medical Team</h1>
                        <p className="text-lg text-gray-600 mb-4">
                            Our dedicated team of specialists combines expertise with compassionate care to provide the best possible treatment for our patients.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
                <div className="bg-white border rounded-md p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search by name or specialty..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Specialty Filter */}
                        <div className="w-full md:w-48">
                            <select
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                            >
                                <option value="all">All Specialties</option>
                                {specializations.map((spec) => (
                                    <option key={spec} value={spec}>
                                        {spec}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Directory Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-3 text-center py-8">
                            <p className="text-gray-600">Loading doctors...</p>
                        </div>
                    ) : doctors.length === 0 ? (
                        <div className="col-span-3 text-center py-8">
                            <p className="text-gray-600">No doctors found.</p>
                        </div>
                    ) : (
                        doctors.map((doctor) => (
                            <div key={doctor._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="relative h-64">
                                    <Image
                                        src={doctor.image || "/default-doctor.jpg"}
                                        alt={doctor.name}
                                        fill
                                        className="object-contain p-2"
                                        style={{
                                            backgroundColor: "#f8f8f8",
                                            minWidth: "200px",
                                            minHeight: "200px",
                                        }}
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{doctor.name}</h3>
                                    <p className="text-pink-600 font-medium mb-3">{doctor.specialization}</p>
                                    <p className="text-gray-600 mb-4 line-clamp-2">{doctor.bio}</p>

                                    {/* Operating Hours Section */}
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Operating Hours:</p>
                                        <p className="text-sm text-gray-600">{doctor.operatingHours}</p>
                                    </div>

                                    {/* Buttons Container */}
                                    <div className="space-y-2">
                                        <button 
                                            onClick={() => router.push(`/appointment/${doctor._id}`)}
                                            className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                                        >
                                            Book Appointment
                                        </button>

                                        <button
                                            onClick={() => router.push(`/messages/${doctor._id}`)}
                                            className="w-full px-4 py-2 border border-pink-600 text-pink-600 rounded-md hover:bg-pink-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                                        >
                                            Send Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer Section */}
            <footer className="bg-gray-900 text-gray-300 py-4 relative overflow-hidden">
                {/* Pink Ribbon Background */}
                <div className="absolute right-0 top-0 opacity-5">
                    <Image src="/pink-ribbon.png" alt="" width={300} height={300} className="object-contain" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Bottom Bar */}
                    <div className="pt-4">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-sm mb-4 md:mb-0">© 2024 PinkPath Breast Cancer Care Center. All rights reserved.</p>
                            <div className="flex space-x-4">
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaFacebookF className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaTwitter className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaInstagram className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaLinkedinIn className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Profile Modal */}
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
                                    onClick={() => setActiveTab('profile')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === 'profile'
                                            ? 'bg-gray-100 text-pink-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('password')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === 'password'
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
                            {activeTab === 'profile' ? (
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
                                                placeholder="189670225"
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
                            ) : (
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
                            {activeTab === 'profile' ? (
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
                    {activeTab === 'profile' ? 'Profile updated successfully!' : 'Password changed successfully!'}
                </div>
            )}
        </div>
    );
}

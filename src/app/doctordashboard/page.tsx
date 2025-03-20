'use client';

import { Poppins } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiHome, FiCalendar, FiUsers, FiMessageSquare, FiFileText, FiLogOut, FiGrid, FiBell, FiSun, FiMoon, FiUser, FiMessageCircle, FiChevronDown, FiClock, FiMoreVertical } from 'react-icons/fi';
import useCheckCookies from '@/controller/UseCheckCookie';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export default function DoctorDashboard() {
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctorName, setDoctorName] = useState('');
    const [profileImage, setProfileImage] = useState('');

    // Check Cookies Token
    useCheckCookies();

    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    useEffect(() => {
        const storedName = localStorage.getItem('name');
        const storedImage = localStorage.getItem('image');
        if (storedName) {
            setDoctorName(storedName);
        }
        if (storedImage) {
            setProfileImage(storedImage);
        }
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleLogout = async () => {
        try {
            await axios.get('/api/users/logout');
            // Clear all stored user data
            localStorage.removeItem('name');
            localStorage.removeItem('image');
            localStorage.removeItem('userType');
            sessionStorage.removeItem('token');
            // Redirect to login page
            router.push('/login');
        } catch (error: any) {
            console.log(error.message);
            // Clear data and redirect even if API call fails
            localStorage.removeItem('name');
            localStorage.removeItem('image');
            localStorage.removeItem('userType');
            sessionStorage.removeItem('token');
            router.push('/login');
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} ${poppins.className}`}>
            {/* Sidebar - Fixed */}
            <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Top section with logo and navigation */}
                <div className="flex-1">
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
                                { href: "/doctordashboard", icon: <FiGrid className="w-5 h-5 mr-4" />, text: "Dashboard" },
                                { 
                                    href: "/doctordashboard/appointments", 
                                    icon: <FiCalendar className="w-5 h-5 mr-4" />, 
                                    text: "Appointments",
                                    badge: 2
                                },
                                { href: "/doctordashboard/patients", icon: <FiUsers className="w-5 h-5 mr-4" />, text: "Patients" },
                                { 
                                    href: "/doctordashboard/messages", 
                                    icon: <FiMessageSquare className="w-5 h-5 mr-4" />, 
                                    text: "Messages",
                                    badge: 5
                                },
                                { href: "/doctordashboard/reports", icon: <FiFileText className="w-5 h-5 mr-4" />, text: "Reports" }
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
                                    <span className="flex-1">{item.text}</span>
                                    {item.badge && (
                                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                            isDarkMode 
                                                ? 'bg-pink-400/20 text-pink-400' 
                                                : 'bg-pink-100 text-pink-800'
                                        }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </nav>
                </div>
                
                {/* Bottom section with logout button */}
                <div className="p-4">
                    <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                            isDarkMode 
                                ? 'text-gray-200 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-pink-100'
                        }`}
                    >
                        <FiLogOut className="w-5 h-5 mr-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Dashboard
                        </h1>
                        <p className={`text-base ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                            {currentDate}
                        </p>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-6">

                        {/* Notifications */}
                        <button className="relative">
                            <FiBell className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                3
                            </span>
                        </button>

                        {/* Vertical Divider */}
                        <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

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
                                    <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center overflow-hidden">
                                        {profileImage ? (
                                            <Image 
                                                src={profileImage}
                                                alt="Profile"
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                                                {doctorName.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        <p className="text-sm font-medium">{doctorName}</p>
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

                {/* Main Content Area - Adjusted for fixed header */}
                <div className="pt-24">
                    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Total Patients Card */}
                            <div className={`p-6 rounded-xl shadow-sm ${
                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className={`text-sm font-medium ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Total Patients</h3>
                                        <p className={`text-2xl font-bold mt-1 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>1,482</p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${
                                        isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
                                    }`}>
                                        <FiUsers className={`w-6 h-6 ${
                                            isDarkMode ? 'text-pink-400' : 'text-pink-600'
                                        }`} />
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        8.2%
                                    </span>
                                    <span className={`ml-2 text-sm ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>vs last month</span>
                                </div>
                            </div>

                            {/* Today's Appointments Card */}
                            <div className={`p-6 rounded-xl shadow-sm ${
                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className={`text-sm font-medium ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Today's Appointments</h3>
                                        <p className={`text-2xl font-bold mt-1 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>8</p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${
                                        isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
                                    }`}>
                                        <FiCalendar className={`w-6 h-6 ${
                                            isDarkMode ? 'text-pink-400' : 'text-pink-600'
                                        }`} />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        1 completed
                                    </span>
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>•</span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                                        5 remaining
                                    </span>
                                </div>
                            </div>

                            {/* Average Review Score Card */}
                            <div className={`p-6 rounded-xl shadow-sm ${
                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className={`text-sm font-medium ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Average Review Score</h3>
                                        <p className={`text-2xl font-bold mt-1 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>4.8</p>
                                    </div>
                                    <div className="flex -space-x-1">
                                        {[...Array(5)].map((_, index) => (
                                            <svg key={index} className={`w-5 h-5 ${index < 4 ? 'text-yellow-400' : 'text-yellow-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                        0.3
                                    </span>
                                    <span className={`ml-2 text-sm ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>vs last month</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Dashboard Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Today's Appointments Section - Left Column */}
                            <div className={`lg:col-span-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm h-[calc(100vh)] overflow-hidden`}>
                                <div className="h-full flex flex-col">
                                    <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Today's Appointments
                                        </h2>
                                    </div>

                                    {/* Appointments List */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {[
                                            {
                                                time: '09:00 AM',
                                                patientName: 'Sarah Johnson',
                                                patientImage: '/default-avatar.png',
                                                type: 'Check-up',
                                                status: 'completed'
                                            },
                                            {
                                                time: '10:30 AM',
                                                patientName: 'Emma Davis',
                                                patientImage: '/default-avatar.png',
                                                type: 'Consultation',
                                                status: 'ongoing'
                                            },
                                            {
                                                time: '02:00 PM',
                                                patientName: 'Maria Garcia',
                                                patientImage: '/default-avatar.png',
                                                type: 'Follow-up',
                                                status: 'upcoming'
                                            },
                                            {
                                                time: '03:30 PM',
                                                patientName: 'Lisa Wilson',
                                                patientImage: '/default-avatar.png',
                                                type: 'Screening',
                                                status: 'cancelled'
                                            },
                                            {
                                                time: '04:15 PM',
                                                patientName: 'Rachel Chen',
                                                patientImage: '/default-avatar.png',
                                                type: 'Initial Consultation',
                                                status: 'upcoming'
                                            },
                                            {
                                                time: '05:00 PM',
                                                patientName: 'Amanda Torres',
                                                patientImage: '/default-avatar.png',
                                                type: 'Follow-up',
                                                status: 'upcoming'
                                            }
                                        ]
                                        .sort((a, b) => {
                                            // Convert time strings to comparable values (minutes since midnight)
                                            const getMinutes = (timeStr: string) => {
                                                const [time, period] = timeStr.split(' ');
                                                const [hours, minutes] = time.split(':').map(Number);
                                                const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : hours;
                                                return adjustedHours * 60 + minutes;
                                            };

                                            // Priority order: upcoming/ongoing first, then completed/cancelled
                                            const priorityOrder = {
                                                'upcoming': 1,
                                                'ongoing': 0,
                                                'completed': 2,
                                                'cancelled': 3
                                            };

                                            // First sort by status priority
                                            const statusDiff = priorityOrder[a.status as keyof typeof priorityOrder] - 
                                                             priorityOrder[b.status as keyof typeof priorityOrder];
                                            
                                            // If status is different, sort by status priority
                                            if (statusDiff !== 0) return statusDiff;
                                            
                                            // If status is the same, sort by time
                                            return getMinutes(a.time) - getMinutes(b.time);
                                        })
                                        .map((appointment, index) => (
                                            <div 
                                                key={index}
                                                className={`p-4 rounded-lg ${
                                                    appointment.status === 'ongoing'
                                                        ? isDarkMode 
                                                            ? 'bg-blue-900/30 hover:bg-blue-900/40'
                                                            : 'bg-blue-50 hover:bg-blue-100'
                                                        : isDarkMode 
                                                            ? 'bg-gray-700 hover:bg-gray-600'
                                                            : 'bg-gray-50 hover:bg-gray-100'
                                                } transition-colors`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-pink-100 flex-shrink-0 flex items-center justify-center">
                                                            {appointment.patientImage !== '/default-avatar.png' ? (
                                                                <Image
                                                                    src={appointment.patientImage}
                                                                    alt={appointment.patientName}
                                                                    width={40}
                                                                    height={40}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className={`text-sm font-medium ${
                                                                    isDarkMode ? 'text-pink-800' : 'text-pink-800'
                                                                }`}>
                                                                    {appointment.patientName.charAt(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className={`text-sm font-medium ${
                                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                                            }`}>
                                                                {appointment.patientName}
                                                            </p>
                                                            <p className={`text-xs ${
                                                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                            }`}>
                                                                {appointment.type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-right">
                                                        <p className={`text-sm font-medium mb-2 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                        }`}>
                                                            {appointment.time}
                                                        </p>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            appointment.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                                            appointment.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {appointment.status === 'upcoming' && (
                                                    <div className="flex justify-end mt-3 space-x-2">
                                                        <button className={`p-2 rounded-lg ${
                                                            isDarkMode 
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' 
                                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                                        } transition-colors`}>
                                                            <FiCalendar className="w-4 h-4" />
                                                        </button>
                                                        <button className={`p-2 rounded-lg ${
                                                            isDarkMode 
                                                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' 
                                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                                        } transition-colors`}>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Other columns will go here */}
                            <div className="lg:col-span-2 flex flex-col space-y-6">
                                {/* Next Patient Details Card */}
                                <div className={`rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="p-6">
                                        <h2 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Next Patient
                                        </h2>
                                        
                                        {/* Patient Info Section */}
                                        <div className="flex items-start space-x-4 mb-6">
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-pink-100 flex-shrink-0 flex items-center justify-center">
                                                <span className={`text-xl font-medium ${isDarkMode ? 'text-pink-800' : 'text-pink-800'}`}>
                                                    M
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    Maria Garcia
                                                </h3>
                                                <div className="flex flex-col mt-1 space-y-2">
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Age: 42
                                                        </span>
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            •
                                                        </span>
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Previous Visit: Jan 15, 2024
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">
                                                        Follow-up
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Appointment Time */}
                                        <div className={`mb-6 flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FiClock className="w-4 h-4" />
                                            <span className="text-sm">
                                                Appointment at 02:00 PM
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center space-x-4">
                                            <button className={`flex-grow px-8 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                isDarkMode
                                                    ? 'bg-pink-500 hover:bg-pink-600 text-white'
                                                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                                            }`}>
                                                Start Consultation
                                            </button>
                                            <button className={`p-2 rounded-lg transition-colors ${
                                                isDarkMode
                                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                            }`}>
                                                <FiMoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Reviews Card */}
                                <div className={`mt-6 rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Patient Reviews
                                            </h2>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4.8</span>
                                                <div className="flex -space-x-1">
                                                    {[...Array(5)].map((_, index) => (
                                                        <svg key={index} className={`w-5 h-5 ${index < 4 ? 'text-yellow-400' : 'text-yellow-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reviews List */}
                                        <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
                                            {[
                                                {
                                                    name: "Sarah Johnson",
                                                    date: "Mar 10, 2024",
                                                    rating: 5,
                                                    comment: "Dr. Garcia was very thorough and caring. She took the time to explain everything clearly and answer all my questions."
                                                },
                                                {
                                                    name: "Emma Davis",
                                                    date: "Mar 8, 2024",
                                                    rating: 5,
                                                    comment: "Excellent care and attention to detail. Very professional and compassionate."
                                                },
                                                {
                                                    name: "Lisa Wilson",
                                                    date: "Mar 5, 2024",
                                                    rating: 4,
                                                    comment: "Very knowledgeable and patient. Made me feel comfortable throughout the consultation."
                                                }
                                            ].map((review, index) => (
                                                <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {review.name}
                                                            </h4>
                                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {review.date}
                                                            </span>
                                                        </div>
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg 
                                                                    key={i} 
                                                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                                                    fill="currentColor" 
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        {review.comment}
                                                    </p>
                                                    <button className={`mt-2 text-xs font-medium ${
                                                        isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'
                                                    } transition-colors`}>
                                                        Respond to review
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

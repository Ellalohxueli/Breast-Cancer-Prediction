'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { FaUserDoctor } from 'react-icons/fa6';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useCheckCookies from '@/controller/UseCheckCookie';
import axios from 'axios';

// First, add a type definition for your navigation items
type NavigationItem = {
    href: string;
    icon: React.ReactNode;
    text: string;
    custom?: boolean;
    component?: React.ReactNode;
};

export default function PatientsPage() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showInfoDropdown, setShowInfoDropdown] = useState(false);
    const pathname = usePathname();

    useCheckCookies();

    useEffect(() => {
        try {
            const storedFirstname = localStorage.getItem('firstname');
            if (storedFirstname) {
                setFirstName(storedFirstname);
            }
        } catch (error) {
            console.error('Error getting firstname from localStorage:', error);
        }

        // Set current date
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        setCurrentDate(date.toLocaleDateString('en-US', options));
    }, []);

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");
            localStorage.removeItem("firstname");
            window.location.href = "/login";
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Navigation items array
    const navigationItems: NavigationItem[] = [
        { href: "/admindashboard", icon: <FiHome className="w-5 h-5 mr-4" />, text: "Dashboard" },
        { href: "/admindashboard/appointments", icon: <FiCalendar className="w-5 h-5 mr-4" />, text: "Appointments" },
        { href: "/admindashboard/doctors", icon: <FaUserDoctor className="w-5 h-5 mr-4" />, text: "Doctors" },
        { href: "/admindashboard/patients", icon: <FiUsers className="w-5 h-5 mr-4" />, text: "Patients" },
        {
            href: "/admindashboard/information",
            icon: <FiFileText className="w-5 h-5 mr-4" />,
            text: "Information",
            custom: true,
            component: (
                <div className="relative">
                    <div 
                        onClick={() => setShowInfoDropdown(!showInfoDropdown)}
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors relative cursor-pointer ${
                            pathname.includes('/admindashboard/manage-services') || pathname.includes('/admindashboard/manage-resources')
                                ? isDarkMode 
                                    ? 'text-pink-400'
                                    : 'text-pink-800'
                                : isDarkMode 
                                    ? 'text-gray-200 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-pink-100'
                        }`}
                    >
                        <FiFileText className="w-5 h-5 mr-4" />
                        <span>Information</span>
                        <FiChevronRight className={`w-4 h-4 ml-auto transition-transform ${showInfoDropdown ? 'transform rotate-90' : ''}`} />
                    </div>

                    {showInfoDropdown && (
                        <div 
                            className={`absolute left-full top-0 ml-2 w-48 rounded-md shadow-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-white'
                            } py-1 z-50`}
                        >
                            <Link 
                                href="/admindashboard/manage-services"
                                className={`block px-4 py-2 text-sm ${
                                    isDarkMode 
                                        ? 'text-gray-200 hover:bg-gray-600' 
                                        : 'text-gray-700 hover:bg-pink-50'
                                }`}
                            >
                                Manage Services
                            </Link>
                            <Link 
                                href="/admindashboard/manage-resources"
                                className={`block px-4 py-2 text-sm ${
                                    isDarkMode 
                                        ? 'text-gray-200 hover:bg-gray-600' 
                                        : 'text-gray-700 hover:bg-pink-50'
                                }`}
                            >
                                Manage Resources
                            </Link>
                        </div>
                    )}
                </div>
            )
        }
    ];

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
                            {navigationItems.map((item, index) => (
                                item.custom ? (
                                    <div key={index}>{item.component}</div>
                                ) : (
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
                                )
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
                            Manage Patient
                        </h1>
                        <p className={`text-base ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
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

                {/* Main Content - With increased top padding */}
                <div className="flex-1 p-4 pt-28 overflow-y-auto">
                    {/* Your patients page content goes here */}
                </div>
            </div>
        </div>
    );
}

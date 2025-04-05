'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { FaUserDoctor } from 'react-icons/fa6';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useCheckCookies from '@/controller/UseCheckCookie';
import axios from 'axios';

interface Doctor {
    _id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    specialization?: string;
    operatingHours?: string;
    bio?: string;
    image?: string;
}

interface Appointment {
    _id: string;
    patientName: string;
    doctorName: string;
    dateRange: {
        startDate: string;
    };
    timeSlot: {
        startTime: string;
    };
    status: string;
    reason: string;
}

// First, add a type definition for your navigation items
type NavigationItem = {
    href: string;
    icon: React.ReactNode;
    text: string;
    custom?: boolean;
    component?: React.ReactNode;
};

export default function AdminDashboard() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const pathname = usePathname();
    const [showInfoDropdown, setShowInfoDropdown] = useState(false);
    const [userCount, setUserCount] = useState(0);

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

        // Fetch doctors data
        const fetchDoctors = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/admin/doctors');
                if (!response.ok) {
                    throw new Error('Failed to fetch doctors');
                }
                const result = await response.json();
                setDoctors(result.data || []);
            } catch (error) {
                console.error('Error fetching doctors:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch appointments data
        const fetchAppointments = async () => {
            try {
                setIsLoadingAppointments(true);
                const response = await fetch('/api/admin/appointments');
                if (!response.ok) {
                    throw new Error('Failed to fetch appointments');
                }
                const result = await response.json();
                setAppointments(result.appointments || []);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setIsLoadingAppointments(false);
            }
        };

        fetchDoctors();
        fetchAppointments();
    }, []);

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await axios.get('/api/admin/patients');
                if (response.data.success) {
                    setUserCount(response.data.count);
                }
            } catch (error) {
                console.error('Error fetching user count:', error);
            }
        };

        fetchUserCount();
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };
    
    const handleLogout = async () => {
        try {
          await axios.get("/api/users/logout");
          localStorage.removeItem("firstname");
          window.location.href = "/login";
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Then update the navigation array with the proper type
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

    // Format time from 24-hour to 12-hour format
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    // Get status style based on appointment status
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed':
                return isDarkMode 
                    ? 'bg-green-400/10 text-green-400'
                    : 'bg-green-100 text-green-700';
            case 'Ongoing':
                return isDarkMode
                    ? 'bg-blue-400/10 text-blue-400'
                    : 'bg-blue-100 text-blue-700';
            case 'Booked':
                return isDarkMode
                    ? 'bg-yellow-400/10 text-yellow-400'
                    : 'bg-yellow-100 text-yellow-700';
            case 'Cancelled':
                return isDarkMode
                    ? 'bg-red-400/10 text-red-400'
                    : 'bg-red-100 text-red-700';
            default:
                return isDarkMode
                    ? 'bg-gray-400/10 text-gray-400'
                    : 'bg-gray-100 text-gray-700';
        }
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

            {/* Main Content Area with Top Menu - With left margin to account for fixed sidebar */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Welcome back to PinkPath!
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

                {/* Main Content - With increased top padding */}
                <div className="flex-1 p-4 pt-28 overflow-y-auto">
                    <div className="px-6">
                        {/* Top Row - Statistics and Doctor List */}
                        <div className="grid grid-cols-12 gap-6">
                            {/* Left Column - Total Cards and Appointments */}
                            <div className="col-span-7 space-y-4">
                                <div className="flex gap-6">
                                    {/* Total Doctors Card */}
                                    <div className={`w-[320px] h-[140px] p-6 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/20' 
                                            : 'bg-gradient-to-br from-blue-50 to-blue-100/50'
                                    } shadow-lg flex items-center justify-between relative overflow-hidden`}>
                                        <div className="absolute inset-0 opacity-10">
                                            <div className={`w-48 h-48 rounded-full ${
                                                isDarkMode 
                                                    ? 'bg-blue-600/30' 
                                                    : 'bg-blue-200/50'
                                            } absolute -top-20 -right-20`}></div>
                                            <div className={`w-32 h-32 rounded-full ${
                                                isDarkMode 
                                                    ? 'bg-blue-600/30' 
                                                    : 'bg-blue-200/50'
                                            } absolute -bottom-10 -left-10`}></div>
                                        </div>
                                        <div className="flex items-center space-x-4 relative z-10">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                isDarkMode 
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-800' 
                                                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                            } shadow-lg`}>
                                                <FaUserDoctor className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {doctors.length}
                                                </p>
                                                <p className={`text-base font-medium mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Total Doctors
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Patients Card */}
                                    <div className={`w-[320px] h-[140px] p-6 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gradient-to-br from-amber-900/40 to-orange-800/20' 
                                            : 'bg-gradient-to-br from-amber-50 to-orange-100/50'
                                    } shadow-lg flex items-center justify-between relative overflow-hidden`}>
                                        <div className="absolute inset-0 opacity-10">
                                            <div className={`w-48 h-48 rounded-full ${
                                                isDarkMode 
                                                    ? 'bg-amber-500/30' 
                                                    : 'bg-amber-200/50'
                                            } absolute -top-20 -right-20`}></div>
                                            <div className={`w-32 h-32 rounded-full ${
                                                isDarkMode 
                                                    ? 'bg-orange-500/30' 
                                                    : 'bg-orange-200/50'
                                            } absolute -bottom-10 -left-10`}></div>
                                        </div>
                                        <div className="flex items-center space-x-4 relative z-10">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                isDarkMode 
                                                    ? 'bg-gradient-to-br from-amber-600 to-orange-800' 
                                                    : 'bg-gradient-to-br from-amber-400 to-orange-600'
                                            } shadow-lg`}>
                                                <FiUsers className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {userCount}
                                                </p>
                                                <p className={`text-base font-medium mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Total Users
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upcoming Appointments - Below Total Cards */}
                                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-[300px]`}>
                                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        Upcoming Appointments
                                    </h3>
                                    <div className={`flex items-center px-4 py-2 rounded-lg mb-2 ${
                                        isDarkMode ? 'bg-gray-700/70 text-gray-300' : 'bg-gray-200/70 text-gray-700'
                                    } font-medium`}>
                                        <span className="w-[30%]">Doctor</span>
                                        <span className="w-[30%]">Patient Name</span>
                                        <span className="w-[20%]">Time</span>
                                        <span className="w-[20%]">Status</span>
                                    </div>
                                    <div className="overflow-y-auto h-[180px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                                        <table className="min-w-full">
                                            <tbody className="divide-y divide-gray-200">
                                                {isLoadingAppointments ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-4 text-center">
                                                            <div className="flex justify-center">
                                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : appointments.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-4 text-center text-gray-500">
                                                            No appointments found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    [...appointments]
                                                        .filter(appointment => {
                                                            // Get today's date in YYYY-MM-DD format
                                                            const today = new Date();
                                                            const todayFormatted = today.toISOString().split('T')[0];
                                                            
                                                            // Get appointment date in YYYY-MM-DD format
                                                            const appointmentDate = new Date(appointment.dateRange.startDate);
                                                            const appointmentDateFormatted = appointmentDate.toISOString().split('T')[0];
                                                            
                                                            // Only include appointments for today
                                                            return appointmentDateFormatted === todayFormatted;
                                                        })
                                                        .sort((a, b) => {
                                                            // Define status priority (only for Booked and Ongoing)
                                                            const statusPriority: Record<string, number> = {
                                                                'Booked': 1,
                                                                'Ongoing': 0,
                                                                'Completed': 2,
                                                                'Cancelled': 2,
                                                                'Rescheduled': 2
                                                            };
                                                            
                                                            // First compare by status priority
                                                            const statusComparison = statusPriority[a.status] - statusPriority[b.status];
                                                            
                                                            // If status is the same, then compare by time
                                                            if (statusComparison === 0) {
                                                                return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
                                                            }
                                                            
                                                            return statusComparison;
                                                        })
                                                        .map((appointment) => (
                                                            <tr key={appointment._id} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                                <td className="py-2 w-[30%]">{appointment.doctorName}</td>
                                                                <td className="py-2 w-[30%] pl-4">{appointment.patientName}</td>
                                                                <td className="py-2 w-[20%]">
                                                                    {formatTime(appointment.timeSlot.startTime)}
                                                                </td>
                                                                <td className="py-2 w-[20%]">
                                                                    <span className={`inline-block w-20 text-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(appointment.status)}`}>
                                                                        {appointment.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Doctors List */}
                            <div className="col-span-5">
                                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-[424px]`}>
                                    <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        Doctors List
                                    </h3>
                                    <div className={`flex items-center px-4 py-2 rounded-lg mb-2 ${
                                        isDarkMode ? 'bg-gray-700/70 text-gray-300' : 'bg-gray-200/70 text-gray-700'
                                        } font-medium`}>
                                            <span className="flex-1">Doctor Name</span>
                                            <span className="w-[100px]">Status</span>
                                        </div>
                                    <div className="space-y-2 h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                                        {isLoading ? (
                                            <div className={`flex justify-center items-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Loading doctors...
                                            </div>
                                        ) : doctors.length === 0 ? (
                                            <div className={`flex justify-center items-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                No doctors found
                                            </div>
                                        ) : (
                                            doctors.map((doctor) => (
                                                <div key={doctor._id} className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                                    isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-pink-50'
                                                }`}>
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center overflow-hidden">
                                                            {doctor.image ? (
                                                                <Image
                                                                    src={doctor.image}
                                                                    alt={`${doctor.name}'s profile`}
                                                                    width={32}
                                                                    height={32}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            ) : (
                                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                                                                    {doctor.name.charAt(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                            {doctor.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 w-[100px]">
                                                        {doctor.status === 'Active' ? (
                                                            // Active status - green dot
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        ) : doctor.status === 'Busy' ? (
                                                            // Busy status - red dot
                                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                        ) : (
                                                            // Out of Office status - gray circle with cross
                                                            <div className="relative">
                                                                <div className="w-2 h-2 rounded-full bg-gray-400 flex items-center justify-center">
                                                                    <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {doctor.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row - Visited Patients Graph */}
                        <div className="grid grid-cols-1 gap-6 mt-6">
                            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Appointment Statistics
                                </h3>
                                <div className="h-[300px] flex flex-col">
                                    <div className="flex-1 flex items-end space-x-6 pl-12 pr-4 relative">
                                        {/* Y-axis labels */}
                                        <div className="absolute left-0 inset-y-0 w-10 flex flex-col justify-between">
                                            {[250, 200, 150, 100, 50, 0].map((value) => (
                                                <div key={value} className="flex items-center">
                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Horizontal grid lines */}
                                        <div className="absolute inset-y-0 right-0 left-10 flex flex-col justify-between pointer-events-none">
                                            {[250, 200, 150, 100, 50, 0].map((value) => (
                                                <div key={value} className={`w-full h-px ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}></div>
                                            ))}
                                        </div>
                                        {(() => {
                                            // Get current year
                                            const currentYear = new Date().getFullYear();
                                            
                                            // Initialize monthly counts
                                            const monthlyCounts = Array(12).fill(0).map((_, i) => ({
                                                month: new Date(0, i).toLocaleString('default', { month: 'short' }),
                                                count: 0
                                            }));
                                            
                                            // Count appointments by month, excluding cancelled and rescheduled
                                            appointments.forEach(appointment => {
                                                const appointmentDate = new Date(appointment.dateRange.startDate);
                                                // Only count appointments that are not cancelled or rescheduled
                                                if (appointmentDate.getFullYear() === currentYear && 
                                                    appointment.status !== 'Cancelled' && 
                                                    appointment.status !== 'Rescheduled') {
                                                    monthlyCounts[appointmentDate.getMonth()].count++;
                                                }
                                            });
                                            
                                            // Find max count for scaling
                                            const maxCount = Math.max(...monthlyCounts.map(m => m.count), 1);
                                            
                                            return monthlyCounts.map((data, index) => (
                                                <div key={index} className="flex flex-col items-center flex-1">
                                                    <div className="relative w-full flex justify-center">
                                                        <div 
                                                            className={`w-12 ${isDarkMode ? 'bg-purple-400/20' : 'bg-purple-100'} rounded-t-lg relative group hover:opacity-80 transition-opacity cursor-pointer`}
                                                            style={{ height: `${(data.count / maxCount) * 250}px` }}
                                                        >
                                                            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs ${
                                                                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-700 text-white'
                                                            } opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                                                                {data.count} appointments
                                                            </div>
                                                            <div className={`absolute inset-0 ${
                                                                isDarkMode ? 'bg-purple-400/40' : 'bg-purple-500/40'
                                                            } rounded-t-lg`}></div>
                                                        </div>
                                                    </div>
                                                    <span className={`mt-2 text-sm ${
                                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                        {data.month}
                                                    </span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                    <div className={`h-px mt-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

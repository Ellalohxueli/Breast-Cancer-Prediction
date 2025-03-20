'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown } from 'react-icons/fi';
import { FaUserDoctor } from 'react-icons/fa6';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

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

export default function AdminDashboard() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        try {
            const storedFirstname = localStorage.getItem('firstname');
            console.log('Stored firstname:', storedFirstname);
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

        fetchDoctors();
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleLogout = () => {
        // Add logout logic here
        localStorage.removeItem('firstname');
        window.location.href = '/login'; // Redirect to login page
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
                                                    150
                                                </p>
                                                <p className={`text-base font-medium mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Total Patients
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Upcoming Appointments - Below Total Cards */}
                                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                                    <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                        Upcoming Appointments
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    <th className="pb-3 text-left w-[30%]">
                                                        <div className="pl-4">Doctor</div>
                                                    </th>
                                                    <th className="pb-3 text-left w-[30%]">
                                                        <div className="pl-4">Patient Name</div>
                                                    </th>
                                                    <th className="pb-3 text-left w-[20%]">
                                                        <div className="pl-4">Time</div>
                                                    </th>
                                                    <th className="pb-3 text-left w-[20%]">
                                                        <div className="pl-4">Status</div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {[
                                                    { patient: "Alice Smith", doctor: "Dr. Sarah Johnson", time: "09:00 AM", status: "On Going" },
                                                    { patient: "Bob Wilson", doctor: "Dr. Michael Chen", time: "10:30 AM", status: "Booked" },
                                                    { patient: "Carol Davis", doctor: "Dr. Emily Brown", time: "02:00 PM", status: "Completed" }
                                                ].map((appointment, index) => (
                                                    <tr key={index} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                        <td className="py-3 w-[30%]">{appointment.doctor}</td>
                                                        <td className="py-3 w-[30%]">{appointment.patient}</td>
                                                        <td className="py-3 w-[20%]">{appointment.time}</td>
                                                        <td className="py-3 w-[20%]">
                                                            <span className={`inline-block w-24 text-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                appointment.status === 'Completed'
                                                                    ? isDarkMode 
                                                                        ? 'bg-green-400/10 text-green-400'
                                                                        : 'bg-green-100 text-green-700'
                                                                    : appointment.status === 'On Going'
                                                                        ? isDarkMode
                                                                            ? 'bg-blue-400/10 text-blue-400'
                                                                            : 'bg-blue-100 text-blue-700'
                                                                        : isDarkMode
                                                                            ? 'bg-yellow-400/10 text-yellow-400'
                                                                            : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {appointment.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
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
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            doctor.status === 'Active' 
                                                                ? 'bg-green-500'
                                                                : doctor.status === 'Busy'
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                        }`}></div>
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
                                    Visited Patients
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
                                        {[
                                            { month: 'Jan', count: 120 },
                                            { month: 'Feb', count: 150 },
                                            { month: 'Mar', count: 180 },
                                            { month: 'Apr', count: 140 },
                                            { month: 'May', count: 160 },
                                            { month: 'Jun', count: 190 },
                                            { month: 'Jul', count: 170 },
                                            { month: 'Aug', count: 200 },
                                            { month: 'Sep', count: 220 },
                                            { month: 'Oct', count: 190 },
                                            { month: 'Nov', count: 230 },
                                            { month: 'Dec', count: 210 }
                                        ].map((data, index) => (
                                            <div key={index} className="flex flex-col items-center flex-1">
                                                <div className="relative w-full flex justify-center">
                                                    <div 
                                                        className={`w-12 ${isDarkMode ? 'bg-purple-400/20' : 'bg-purple-100'} rounded-t-lg relative group hover:opacity-80 transition-opacity cursor-pointer`}
                                                        style={{ height: `${(data.count / 250) * 250}px` }}
                                                    >
                                                        <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs ${
                                                            isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-700 text-white'
                                                        } opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                                                            {data.count} patients
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
                                        ))}
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

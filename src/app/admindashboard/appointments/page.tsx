"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { FaUserDoctor } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import useCheckCookies from "@/controller/UseCheckCookie";
import axios from "axios";
import useCheckAdminUnreadMss from "@/controller/UseCheckAdminUnreadMss";

// Reuse the same types from dashboard
type NavigationItem = {
    href: string;
    icon: React.ReactNode;
    text: string;
    custom?: boolean;
    component?: React.ReactNode;
};

// Add this type definition near the top with other types
type Doctor = {
    _id: string;
    name: string;
    specialization: string;
};

// Add this type near your other type definitions at the top
type Appointment = {
    _id: string;
    patientName: string;
    doctorName: string;
    dateTime: string;
    status: string;
    reason: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    timeSlot: {
        startTime: string;
        endTime: string;
    };
    formattedTime: string;
};

export default function AppointmentsPage() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [currentDate, setCurrentDate] = useState("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showInfoDropdown, setShowInfoDropdown] = useState(false);
    const pathname = usePathname();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [unreadCount, setUnreadCount] = useState(0);

    useCheckCookies();

    useEffect(() => {
        try {
            const storedFirstname = localStorage.getItem("firstname");
            if (storedFirstname) {
                setFirstName(storedFirstname);
            }
        } catch (error) {
            console.error("Error getting firstname from localStorage:", error);
        }

        // Set current date
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        setCurrentDate(date.toLocaleDateString("en-US", options));

        // Modify the fetchDoctors function to also fetch appointments
        const fetchData = async () => {
            setIsLoadingDoctors(true);
            try {
                const response = await axios.get("/api/admin/appointments");
                if (response.data.success) {
                    setDoctors(response.data.doctors);
                    setAppointments(
                        response.data.appointments.map((apt: any) => ({
                            ...apt,
                            dateTime: new Date(apt.dateRange.startDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            }),
                            formattedTime: formatTime(apt.timeSlot.startTime),
                        }))
                    );
                } else {
                    console.error("Unexpected API response format:", response.data);
                    setDoctors([]);
                    setAppointments([]);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setDoctors([]);
                setAppointments([]);
            } finally {
                setIsLoadingDoctors(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...appointments];

        // Filter by doctor if selected
        if (selectedDoctor) {
            filtered = filtered.filter((appointment) => appointment.doctorName === selectedDoctor);
        }

        // Filter by date if selected
        if (selectedDate) {
            filtered = filtered.filter((appointment) => {
                const appointmentDate = new Date(appointment.dateRange.startDate).toISOString().split("T")[0];
                return appointmentDate === selectedDate;
            });
        }

        // Filter by status if selected
        if (selectedStatus) {
            filtered = filtered.filter((appointment) => appointment.status === selectedStatus);
        }

        // Filter by patient name search
        if (searchTerm.trim()) {
            filtered = filtered.filter((appointment) => appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        setFilteredAppointments(filtered);
    }, [selectedDoctor, selectedDate, selectedStatus, searchTerm, appointments]);

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");
            localStorage.removeItem("firstname");
            window.location.href = "/login";
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Reuse the same navigation items
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
                            pathname.includes("/admindashboard/manage-services") || pathname.includes("/admindashboard/manage-resources")
                                ? isDarkMode
                                    ? "text-pink-400"
                                    : "text-pink-800"
                                : isDarkMode
                                ? "text-gray-200 hover:bg-gray-700"
                                : "text-gray-700 hover:bg-pink-100"
                        }`}
                    >
                        <FiFileText className="w-5 h-5 mr-4" />
                        <span>Information</span>
                        <FiChevronRight className={`w-4 h-4 ml-auto transition-transform ${showInfoDropdown ? "transform rotate-90" : ""}`} />
                    </div>

                    {showInfoDropdown && (
                        <div className={`absolute left-full top-0 ml-2 w-48 rounded-md shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} py-1 z-50`}>
                            <Link
                                href="/admindashboard/manage-services"
                                className={`block px-4 py-2 text-sm ${isDarkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-pink-50"}`}
                            >
                                Manage Services
                            </Link>
                            <Link
                                href="/admindashboard/manage-resources"
                                className={`block px-4 py-2 text-sm ${isDarkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-pink-50"}`}
                            >
                                Manage Resources
                            </Link>
                        </div>
                    )}
                </div>
            ),
        },
    ];

    // Add this helper function to format the time
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes}${ampm}`;
    };

    useEffect(() => {
        const checkUnreadMessages = async () => {
            try {
                const unreadCount: any = await useCheckAdminUnreadMss();
                setUnreadCount(unreadCount);
            } catch (error) {
                console.error("Error checking unread messages:", error);
            }
        };

        checkUnreadMessages();
        const intervalId = setInterval(checkUnreadMessages, 20000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            {/* Sidebar - Fixed */}
            <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <div>
                    <div className="p-6">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center space-x-4">
                                <div className={`p-1 rounded-xl w-[56px] h-[56px] flex items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-pink-100"}`}>
                                    <Image src="/logo.png" alt="PinkPath Logo" width={64} height={64} className="object-contain rounded-lg" />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-pink-800"}`}>PinkPath</h2>
                            </div>
                        </div>
                    </div>
                    <nav className="mt-6">
                        <div className="px-4 space-y-2">
                            {navigationItems.map((item, index) =>
                                item.custom ? (
                                    <div key={index}>{item.component}</div>
                                ) : (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 rounded-lg transition-colors relative ${
                                            pathname === item.href
                                                ? isDarkMode
                                                    ? "text-pink-400"
                                                    : "text-pink-800"
                                                : isDarkMode
                                                ? "text-gray-200 hover:bg-gray-700"
                                                : "text-gray-700 hover:bg-pink-100"
                                        }`}
                                    >
                                        {pathname === item.href && <div className={`absolute right-0 top-0 h-full w-1 ${isDarkMode ? "bg-pink-400" : "bg-pink-800"}`}></div>}
                                        {item.icon}
                                        <span>{item.text}</span>
                                    </Link>
                                )
                            )}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main Content Area with Top Menu */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Appointments</h1>
                        <p className={`text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{currentDate}</p>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-6">
                        {/* Messages */}
                        <button
                            className="relative"
                            onClick={() => {
                                location.href = "/admindashboard/messages?type=all";
                            }}
                        >
                            <FiMessageCircle className={`w-5 h-5 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                            )}
                        </button>

                        {/* Notifications */}
                        <button className="relative">
                            <FiBell className={`w-5 h-5 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                        </button>

                        {/* Vertical Divider */}
                        <div className={`h-6 w-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>

                        {/* Profile */}
                        <div className="flex items-center space-x-3 relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-3 focus:outline-none">
                                <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center">
                                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-800" : "text-pink-800"}`}>{firstName.charAt(0)}</span>
                                </div>
                                <div className={`flex items-center space-x-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                    <p className="text-sm font-medium">{firstName}</p>
                                    <FiChevronDown
                                        className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-400/70"} transition-transform ${
                                            isProfileOpen ? "transform rotate-180" : ""
                                        }`}
                                    />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div
                                    className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 ${
                                        isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
                                    }`}
                                >
                                    <button
                                        onClick={handleLogout}
                                        className={`w-full text-left px-4 py-2 text-sm ${
                                            isDarkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
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
                <div className="flex-1 p-4 pt-28">
                    {/* Filters Section */}
                    <div className={`px-4 pb-6 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search Patient */}
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search patient..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                        isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
                                    } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                />
                            </div>

                            {/* Doctor Filter */}
                            <select
                                className={`w-full px-4 py-2 rounded-lg border ${
                                    isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
                                } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                disabled={isLoadingDoctors}
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                            >
                                <option value="">All Doctors</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor._id} value={doctor.name}>
                                        {doctor.name}
                                    </option>
                                ))}
                            </select>

                            {/* Date Filter */}
                            <input
                                type="date"
                                className={`w-full px-4 py-2 rounded-lg border ${
                                    isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
                                } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />

                            {/* Status Filter */}
                            <select
                                className={`w-full px-4 py-2 rounded-lg border ${
                                    isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200"
                                } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Booked">Booked</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Rescheduled">Rescheduled</option>
                            </select>
                        </div>
                    </div>

                    {/* Appointments Content */}
                    <div className="px-4 h-[calc(100vh-220px)]">
                        <div className={`bg-white rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"} h-full`}>
                            <div className="h-full overflow-y-auto">
                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full table-fixed">
                                        <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"} sticky top-0 z-10`}>
                                            <tr>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium ${
                                                        isDarkMode ? "text-gray-200" : "text-gray-500"
                                                    } uppercase tracking-wider w-1/5`}
                                                >
                                                    Patient
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium ${
                                                        isDarkMode ? "text-gray-200" : "text-gray-500"
                                                    } uppercase tracking-wider w-1/5`}
                                                >
                                                    Doctor
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium ${
                                                        isDarkMode ? "text-gray-200" : "text-gray-500"
                                                    } uppercase tracking-wider w-1/5`}
                                                >
                                                    Date & Time
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium ${
                                                        isDarkMode ? "text-gray-200" : "text-gray-500"
                                                    } uppercase tracking-wider w-1/5`}
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    className={`px-4 py-3 text-left text-xs font-medium ${
                                                        isDarkMode ? "text-gray-200" : "text-gray-500"
                                                    } uppercase tracking-wider w-1/5`}
                                                >
                                                    Appointment Type
                                                </th>
                                            </tr>
                                        </thead>

                                        {/* Table Body */}
                                        <tbody className={`${isDarkMode ? "bg-gray-800" : "bg-white"} divide-y divide-gray-200`}>
                                            {filteredAppointments.length > 0 ? (
                                                (() => {
                                                    // Group appointments by date
                                                    const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
                                                        const date = new Date(appointment.dateRange.startDate);
                                                        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

                                                        if (!groups[dateKey]) {
                                                            groups[dateKey] = [];
                                                        }

                                                        groups[dateKey].push(appointment);
                                                        return groups;
                                                    }, {} as Record<string, typeof filteredAppointments>);

                                                    // Sort dates in descending order
                                                    const sortedDates = Object.keys(groupedAppointments).sort((a, b) => b.localeCompare(a));

                                                    return sortedDates.map((dateKey) => {
                                                        const appointmentsForDate = groupedAppointments[dateKey];
                                                        const date = new Date(dateKey);
                                                        const formattedDate = date.toLocaleDateString("en-US", {
                                                            weekday: "long",
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        });

                                                        // Sort appointments within each date group
                                                        const sortedAppointments = [...appointmentsForDate].sort((a, b) => {
                                                            // Define status priority
                                                            const statusPriority: Record<string, number> = {
                                                                Booked: 1,
                                                                Ongoing: 0,
                                                                Completed: 2,
                                                                Cancelled: 2,
                                                                Rescheduled: 2,
                                                            };

                                                            // First compare by status priority
                                                            const statusComparison = statusPriority[a.status] - statusPriority[b.status];

                                                            // If status is the same, then compare by time
                                                            if (statusComparison === 0) {
                                                                return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
                                                            }

                                                            return statusComparison;
                                                        });

                                                        return (
                                                            <React.Fragment key={dateKey}>
                                                                {/* Date Header */}
                                                                <tr className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                                                                    <td colSpan={5} className={`px-4 py-2 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                                                        {formattedDate}
                                                                    </td>
                                                                </tr>

                                                                {/* Appointments for this date */}
                                                                {sortedAppointments.map((appointment) => (
                                                                    <tr key={appointment._id}>
                                                                        <td className={`px-4 py-4 whitespace-nowrap ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                                                                            <div className="flex items-center">
                                                                                <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center mr-3">
                                                                                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-800" : "text-pink-800"}`}>
                                                                                        {appointment.patientName.charAt(0)}
                                                                                    </span>
                                                                                </div>
                                                                                {appointment.patientName}
                                                                            </div>
                                                                        </td>
                                                                        <td className={`px-4 py-4 whitespace-nowrap ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                                                                            {appointment.doctorName}
                                                                        </td>
                                                                        <td className={`px-4 py-4 whitespace-nowrap ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                                                                            {appointment.formattedTime}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            <span
                                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                                                ${appointment.status === "Booked" ? "bg-yellow-100 text-yellow-700" : ""}
                                                                                ${appointment.status === "Ongoing" ? "bg-blue-100 text-blue-700" : ""}
                                                                                ${appointment.status === "Completed" ? "bg-green-100 text-green-700" : ""}
                                                                                ${appointment.status === "Cancelled" ? "bg-red-100 text-red-700" : ""}
                                                                                ${appointment.status === "Rescheduled" ? "bg-gray-100 text-gray-700" : ""}
                                                                            `}
                                                                            >
                                                                                {appointment.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className={`px-4 py-4 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{appointment.reason}</td>
                                                                    </tr>
                                                                ))}
                                                            </React.Fragment>
                                                        );
                                                    });
                                                })()
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className={`px-4 py-4 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                        {selectedDoctor ? `No appointments found for ${selectedDoctor}` : "No appointments found"}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

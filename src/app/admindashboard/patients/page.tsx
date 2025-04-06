"use client";

import Link from "next/link";
import Image from "next/image";
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { FaUserDoctor, FaEye } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import useCheckCookies from "@/controller/UseCheckCookie";
import axios from "axios";
import useCheckAdminUnreadMss from "@/controller/UseCheckAdminUnreadMss";

// First, add a type definition for your navigation items
type NavigationItem = {
    href: string;
    icon: React.ReactNode;
    text: string;
    custom?: boolean;
    component?: React.ReactNode;
};

// First, update the handleViewPatient function to use a proper patient interface
interface Patient {
    _id: string;
    firstname: string;
    lastname: string;
    dob: string;
    sex: string;
    phone: string | number;
    email: string;
}

export default function PatientsPage() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [currentDate, setCurrentDate] = useState("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showInfoDropdown, setShowInfoDropdown] = useState(false);
    const pathname = usePathname();
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                        <div
                            className={`fixed ml-[248px] w-48 rounded-md shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} py-1 z-[150]`}
                            style={{
                                top: "var(--dropdown-top)",
                            }}
                            ref={(el) => {
                                if (el) {
                                    const button = el.previousElementSibling;
                                    if (button) {
                                        const rect = button.getBoundingClientRect();
                                        el.style.setProperty("--dropdown-top", `${rect.top}px`);
                                    }
                                }
                            }}
                        >
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

    // Add fetchPatients function
    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/admin/patients");
            if (response.data.success) {
                setPatients(response.data.patients);
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
            setError("Failed to load patients");
        } finally {
            setLoading(false);
        }
    };

    // Use useEffect to fetch patients when component mounts
    useEffect(() => {
        fetchPatients();
    }, []);

    // Update the handleViewPatient function
    const handleViewPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsViewModalOpen(true);
    };

    // Update the search functionality
    const filteredPatients = patients.filter((patient) => {
        const searchLower = searchQuery.toLowerCase();
        return patient.firstname.toLowerCase().includes(searchLower) || patient.lastname.toLowerCase().includes(searchLower) || patient.email.toLowerCase().includes(searchLower);
    });

    // Update the maskPhoneNumber function
    const maskPhoneNumber = (phone: string | number) => {
        // Convert to string if it's a number
        let phoneStr = String(phone);

        // Remove any non-digit characters
        let cleanPhone = phoneStr.replace(/\D/g, "");

        // Ensure it starts with '60'
        if (!cleanPhone.startsWith("60")) {
            cleanPhone = "60" + cleanPhone;
        }

        // Get the carrier prefix (60XX)
        const carrierPrefix = cleanPhone.slice(0, 4);

        // Handle different formats based on carrier prefix
        if (carrierPrefix.startsWith("6011")) {
            // For 6011 numbers (11 digits total)
            const firstPart = cleanPhone.slice(0, 4); // 6011
            const lastPart = cleanPhone.slice(8); // last 4 digits
            return `+${firstPart}-XXXX-${lastPart}`;
        } else {
            // For other numbers (60XX) (10 digits total)
            const firstPart = cleanPhone.slice(0, 4); // 60XX
            const lastPart = cleanPhone.slice(7); // last 4 digits
            return `+${firstPart}-XXX-${lastPart}`;
        }
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
            <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen z-[100] ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
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
                        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Manage Patient</h1>
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
                    {/* Search Bar */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative w-96">
                            <input
                                type="text"
                                placeholder="Search by patient name..."
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                    isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-700"
                                } focus:outline-none focus:border-pink-500`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <FiSearch className={`absolute left-3 top-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                        </div>
                    </div>

                    {/* Patients Table */}
                    <div className={`rounded-lg shadow overflow-hidden relative z-[1] ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                                    <tr>
                                        <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider`}>
                                            First Name
                                        </th>
                                        <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider`}>
                                            Last Name
                                        </th>
                                        <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider`}>
                                            Date of Birth
                                        </th>
                                        <th className={`w-1/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider`}>
                                            Gender
                                        </th>
                                        <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider`}>
                                            Phone Number
                                        </th>
                                        <th className={`w-2/12 px-6 py-3 text-left text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-500"} uppercase tracking-wider`}>
                                            Email
                                        </th>
                                        <th
                                            className={`w-1/12 px-6 py-3 text-center text-xs font-medium ${
                                                isDarkMode ? "text-gray-300" : "text-gray-500"
                                            } uppercase tracking-wider`}
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center text-red-500">
                                                {error}
                                            </td>
                                        </tr>
                                    ) : filteredPatients.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center">
                                                No patients found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPatients.map((patient) => (
                                            <tr key={patient._id} className={`${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium">{patient.firstname}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium">{patient.lastname}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm">{new Date(patient.dob).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-sm ${
                                                            patient.sex.toLowerCase() === "male"
                                                                ? isDarkMode
                                                                    ? "bg-blue-400/10 text-blue-400"
                                                                    : "bg-blue-100 text-blue-800"
                                                                : isDarkMode
                                                                ? "bg-pink-400/10 text-pink-400"
                                                                : "bg-pink-100 text-pink-800"
                                                        }`}
                                                    >
                                                        {patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm">{maskPhoneNumber(patient.phone)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm truncate max-w-[200px]">{patient.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => handleViewPatient(patient)}
                                                            className={`${isDarkMode ? "text-blue-400" : "text-blue-600"} hover:opacity-80`}
                                                            title="View"
                                                        >
                                                            <FaEye className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient View Modal */}
            {isViewModalOpen && selectedPatient && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className={`w-full max-w-2xl rounded-xl shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} max-h-[85vh] overflow-hidden flex flex-col`}>
                            {/* Modal Header */}
                            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                <div className="flex justify-between items-center">
                                    <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Patient Details</h2>
                                    <button
                                        onClick={() => setIsViewModalOpen(false)}
                                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>First Name</label>
                                        <p className={`mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedPatient.firstname}</p>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Last Name</label>
                                        <p className={`mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedPatient.lastname}</p>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Date of Birth</label>
                                        <p className={`mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{new Date(selectedPatient.dob).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Gender</label>
                                        <p
                                            className={`mt-1 inline-block px-3 py-1 rounded-full text-sm ${
                                                selectedPatient.sex.toLowerCase() === "male"
                                                    ? isDarkMode
                                                        ? "bg-blue-400/10 text-blue-400"
                                                        : "bg-blue-100 text-blue-800"
                                                    : isDarkMode
                                                    ? "bg-pink-400/10 text-pink-400"
                                                    : "bg-pink-100 text-pink-800"
                                            }`}
                                        >
                                            {selectedPatient.sex.charAt(0).toUpperCase() + selectedPatient.sex.slice(1)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Phone Number</label>
                                        <p className={`mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{maskPhoneNumber(selectedPatient.phone)}</p>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Email</label>
                                        <p className={`mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedPatient.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    }`}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

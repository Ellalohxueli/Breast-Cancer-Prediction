"use client";
import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    FiHome,
    FiCalendar,
    FiUsers,
    FiMessageSquare,
    FiFileText,
    FiLogOut,
    FiGrid,
    FiBell,
    FiSun,
    FiMoon,
    FiUser,
    FiMessageCircle,
    FiChevronDown,
    FiClock,
    FiMoreVertical,
} from "react-icons/fi";
import useCheckCookies from "@/controller/UseCheckCookie";
import { FaRegUser } from "react-icons/fa";
import { toast } from "react-hot-toast";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

// First, let's define the interfaces for our data structures
interface Patient {
    _id: string;
    firstname: string;
    lastname: string;
    image?: string;
    dob: string;
}

interface TimeSlot {
    startTime: string;
    endTime: string;
}

interface DateRange {
    startDate: string;
    endDate: string;
}

interface Appointment {
    _id: string;
    dateRange: DateRange;
    timeSlot: TimeSlot;
    status: string;
    appointmentType: string;
    patient: Patient;
}

// First, let's define interfaces for our accumulated results
interface DateGroupedAppointments {
    [date: string]: Appointment[];
}

interface StatusCount {
    [status: string]: number;
}

interface MonthlyCount {
    [month: string]: number;
}

export default function AppointmentsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctorName, setDoctorName] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [displayDate, setDisplayDate] = useState(new Date());
    const [viewType, setViewType] = useState<"month" | "week" | "day">("month");
    const [currentTimeTop, setCurrentTimeTop] = useState(0);
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
    const [checkedDays, setCheckedDays] = useState<{ [key: string]: boolean }>({});
    const [dayTimeSlots, setDayTimeSlots] = useState<{ [key: string]: number }>({});
    const [exclusionType, setExclusionType] = useState<"single" | "range">("single");
    const [excludedDates, setExcludedDates] = useState<string[]>([]);
    const [selectedDuration, setSelectedDuration] = useState<string>("");
    const [customDuration, setCustomDuration] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: "", message: "" });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'account' | 'password'>('account');
    const [doctorProfile, setDoctorProfile] = useState({
        image: '',
        name: '',
        email: '',
        phone: '',
        bio: '',
        specialization: '',
        operatingHours: '',
        status: 'active'
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
    const [formErrors, setFormErrors] = useState({
        phone: ''
    });
    const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);
    const [error, setError] = useState('');
    const [currentStatus, setCurrentStatus] = useState('');
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [fetchAllError, setFetchAllError] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [todayStats, setTodayStats] = useState({ total: 0, remaining: 0 });
    const [isMedicalPassModalOpen, setIsMedicalPassModalOpen] = useState(false);
    const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<Appointment | null>(null);

    // Add this useEffect to fetch today's appointments
    useEffect(() => {
        const fetchTodayAppointments = async () => {
            try {
                const response = await axios.get('/api/doctors/appointment');
                if (response.data.success) {
                    const appointments = response.data.appointments;
                    // Calculate today's appointment stats
                    const today = new Date();
                    const todayAppointments = appointments.filter((appointment: Appointment) => {
                        const appointmentDate = new Date(appointment.dateRange.startDate);
                        return appointmentDate.toDateString() === today.toDateString();
                    });
                    
                    // Count all appointments for today, excluding 'Cancelled' and 'Rescheduled'
                    const total = todayAppointments.filter((app: Appointment) => 
                        app.status !== 'Cancelled' && app.status !== 'Rescheduled'
                    ).length;
                    
                    // Count remaining appointments (Booked or Ongoing)
                    const remaining = todayAppointments.filter((app: Appointment) => 
                        app.status === 'Booked' || app.status === 'Ongoing'
                    ).length;
                    
                    setTodayStats({ total, remaining });
                }
            } catch (error) {
                console.error('Error fetching today\'s appointments:', error);
            }
        };

        fetchTodayAppointments();
    }, []);

    // Check Cookies Token
    useCheckCookies();

    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Function to get the display month and year
    const displayMonth = displayDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    // Function to handle previous period (week or month)
    const handlePrevious = () => {
        setDisplayDate((prev) => {
            const newDate = new Date(prev);
            if (viewType === "month") {
                newDate.setMonth(prev.getMonth() - 1);
            } else if (viewType === "week") {
                newDate.setDate(prev.getDate() - 7);
            } else if (viewType === "day") {
                newDate.setDate(prev.getDate() - 1);
            }
            return newDate;
        });
    };

    // Function to handle next period (week or month)
    const handleNext = () => {
        setDisplayDate((prev) => {
            const newDate = new Date(prev);
            if (viewType === "month") {
                newDate.setMonth(prev.getMonth() + 1);
            } else if (viewType === "week") {
                newDate.setDate(prev.getDate() + 7);
            } else if (viewType === "day") {
                newDate.setDate(prev.getDate() + 1);
            }
            return newDate;
        });
    };

    // Update the display text based on view type
    const getDisplayText = () => {
        if (viewType === "month") {
            return displayDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });
        } else if (viewType === "week") {
            const weekDates = getWeekDates(displayDate);
            const startDate = weekDates[0];
            const endDate = weekDates[6];

            // If the week spans two different months
            if (startDate.getMonth() !== endDate.getMonth()) {
                const startMonth = startDate.toLocaleDateString("en-US", { month: "short" }).replace(".", "");
                const endMonth = endDate.toLocaleDateString("en-US", { month: "short" }).replace(".", "");
                return `${startMonth} - ${endMonth} ${endDate.getFullYear()}`;
            }

            // If the week is within the same month
            return endDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });
        } else if (viewType === "day") {
            // Format day view to show "Month Day, Year"
            return displayDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });
        }
        return "";
    };

    // Function to handle Today button
    const handleToday = () => {
        const today = new Date();
        setDisplayDate(today);
        setSelectedDate(today);
    };

    // Function to get days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
        return { daysInMonth, startingDay };
    };

    // Function to check if a date is today
    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();
    };

    // Function to format time in 24-hour format with GMT+08
    const formatTime = (time: string) => {
        const [hours, minutes = "00"] = time.split(":"); // Default minutes to '00' if not provided
        return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    };

    // Function to get week dates
    const getWeekDates = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            return day;
        });
    };

    // Function to calculate current time position
    const calculateTimePosition = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeInMinutes = hours * 60 + minutes;
        const position = (timeInMinutes / 60) * 80; // 80px is the height of each hour slot
        setCurrentTimeTop(position);
    };

    // Update current time position every minute
    useEffect(() => {
        if (viewType === "week" || (viewType === "day" && isToday(displayDate.getDate()))) {
            calculateTimePosition();
            const interval = setInterval(calculateTimePosition, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [viewType]);

    useEffect(() => {
        const storedName = localStorage.getItem('name');
        const storedImage = localStorage.getItem('image');
        if (storedName) {
            setDoctorName(storedName);
        }
        if (storedImage) {
            setProfileImage(storedImage);
        }

        // Fetch initial status
        const fetchDoctorStatus = async () => {
            try {
                const response = await axios.get('/api/doctors/profile');
                if (response.data.success) {
                    const status = response.data.data.status;
                    setCurrentStatus(status);
                    setDoctorProfile(prev => ({
                        ...prev,
                        ...response.data.data,
                        status: status
                    }));
                }
            } catch (error) {
                console.error('Error fetching doctor status:', error);
            }
        };
        fetchDoctorStatus();
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");
            localStorage.removeItem("name");
            localStorage.removeItem("image");
            localStorage.removeItem("userType");
            sessionStorage.removeItem('token');
            router.push("/login");
        } catch (error: any) {
            console.log(error.message);
            localStorage.removeItem("name");
            localStorage.removeItem("image");
            localStorage.removeItem("userType");
            sessionStorage.removeItem('token');
            router.push("/login");
        }
    };

    // First, add a helper function to format appointments for display
    const formatAppointmentTime = (timeSlot: TimeSlot) => {
        const formatTimeToAMPM = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
            return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
        };

        return `${formatTimeToAMPM(timeSlot.startTime)}`;
    };

    const getAppointmentColor = (status: string, isDarkMode: boolean) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800';
            case 'cancelled':
                return isDarkMode ? 'bg-gray-500/20 text-gray-300 line-through' : 'bg-gray-100 text-gray-800 line-through';
            case 'pending':
                return isDarkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
            case 'rescheduled':
                return isDarkMode ? 'bg-gray-500/20 text-gray-300 line-through' : 'bg-gray-100 text-gray-800 line-through';
            default:
                return isDarkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-800';
        }
    };

    // Add this helper function to calculate appointment position and height
    const calculateAppointmentPosition = (timeSlot: TimeSlot) => {
        const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
        const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);
        
        const startInMinutes = startHour * 60 + startMinute;
        const endInMinutes = endHour * 60 + endMinute;
        const duration = endInMinutes - startInMinutes;
        
        const topPosition = (startInMinutes / 60) * 80; // 80px is the height of each hour slot
        const height = (duration / 60) * 80;
        
        return { top: topPosition, height };
    };

    // Update the month view rendering code
    const renderMonthView = () => {
        const { daysInMonth, startingDay } = getDaysInMonth(displayDate);
        const previousMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1);
        const daysInPreviousMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 0).getDate();
        
        // Calculate total days needed (35 days for 5 rows)
        const totalDays = 35; // 5 rows * 7 days
        
        return (
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: totalDays }, (_, i) => {
                    let date: Date;
                    let isCurrentMonth: boolean;

                    if (i < startingDay) {
                        // Previous month dates
                        const day = daysInPreviousMonth - (startingDay - i - 1);
                        date = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), day);
                        isCurrentMonth = false;
                    } else if (i >= startingDay && i < startingDay + daysInMonth) {
                        // Current month dates
                        const day = i - startingDay + 1;
                        date = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
                        isCurrentMonth = true;
                    } else {
                        // Empty cells for dates that should appear in next month
                        return <div key={i} className="min-h-[120px] p-2"></div>;
                    }

                    // Filter appointments for this date
                    const dayAppointments = allAppointments.filter(apt => {
                        const aptDate = new Date(apt.dateRange.startDate);
                        return aptDate.getDate() === date.getDate() &&
                               aptDate.getMonth() === date.getMonth() &&
                               aptDate.getFullYear() === date.getFullYear();
                    });

                    // Sort appointments by start time
                    dayAppointments.sort((a, b) => {
                        const aTime = a.timeSlot.startTime;
                        const bTime = b.timeSlot.startTime;
                        return aTime.localeCompare(bTime);
                    });

                    const isToday = date.toDateString() === new Date().toDateString();

                    // Check if this date should be shown in the current view
                    const shouldShow = isCurrentMonth || (i < startingDay);

                    if (!shouldShow) {
                        return <div key={i} className="min-h-[120px] p-2"></div>;
                    }

                    return (
                        <div
                            key={i}
                            className={`min-h-[120px] p-2 rounded-lg ${
                                isCurrentMonth
                                    ? isDarkMode 
                                        ? 'bg-gray-800' 
                                        : 'bg-white'
                                    : isDarkMode 
                                        ? 'bg-gray-800/50' 
                                        : 'bg-gray-50'
                            }`}
                        >
                            <div className={`flex items-center mb-1`}>
                                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                    ${isToday
                                        ? isDarkMode 
                                            ? 'bg-pink-500 text-white' 
                                            : 'bg-pink-600 text-white'
                                        : isCurrentMonth
                                            ? isDarkMode 
                                                ? 'text-gray-200' 
                                                : 'text-gray-900'
                                        : isDarkMode 
                                            ? 'text-gray-600' 
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {date.getDate()}
                                </span>
                            </div>
                            
                            <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                {dayAppointments.map((apt) => (
                                    <div
                                        key={apt._id}
                                        onClick={() => handleAppointmentClick(apt)}
                                        className={`text-xs px-1.5 py-0.5 rounded truncate ${getAppointmentColor(apt.status, isDarkMode)} cursor-pointer hover:opacity-90`}
                                        title={`${apt.patient.firstname} ${apt.patient.lastname} - ${formatAppointmentTime(apt.timeSlot)}`}
                                    >
                                        <span className="font-medium">{formatAppointmentTime(apt.timeSlot)}</span>
                                        {" - "}
                                        <span className="truncate">{apt.patient.firstname}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Add this helper function to calculate the current time position
    const getCurrentTimePosition = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        return (hours + minutes / 60) * 80; // 80px is the height of each hour slot
    };

    // Update the renderWeekView function to include the current time indicator
    const renderWeekView = () => {
        const weekDates = getWeekDates(displayDate);
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const today = new Date();
        const currentTimeTop = getCurrentTimePosition();
        const isCurrentWeek = weekDates.some(date => 
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );

        return (
            <div className="relative h-[calc(100vh-16rem)]">
                {/* Fixed Headers */}
                <div className={`sticky top-0 z-10 grid grid-cols-[80px_1fr] ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                    {/* Empty space above time markers */}
                    <div className={`h-20 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}></div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7">
                        {weekDates.map((date, index) => (
                            <div key={index} className={`px-2 py-3 text-center border-b ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-700"}`}>
                                <div className="text-sm font-medium">{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
                                <div
                                    className={`text-2xl font-semibold mt-1 ${
                                        isToday(date.getDate()) && date.getMonth() === new Date().getMonth() ? (isDarkMode ? "text-pink-400" : "text-pink-600") : ""
                                    }`}
                                >
                                    {date.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto h-[calc(100%-5rem)]">
                    <div className="grid grid-cols-[80px_1fr] divide-x divide-gray-200">
                        {/* Time markers */}
                        <div className="space-y-0">
                            {hours.map((hour) => (
                                <div key={hour} className={`h-20 flex items-center justify-end pr-4 text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    {formatTime(hour.toString())}
                                </div>
                            ))}
                        </div>

                        {/* Time slots grid */}
                        <div className="grid grid-cols-7 divide-x divide-gray-200 relative">
                            {/* Add current time indicator */}
                            {isCurrentWeek && (
                                <div 
                                    className="absolute left-0 right-0 z-20 pointer-events-none"
                                    style={{ top: `${currentTimeTop}px` }}
                                >
                                    <div className={`h-[2px] w-full ${isDarkMode ? 'bg-pink-500' : 'bg-pink-600'}`}></div>
                                    <div 
                                        className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-pink-500' : 'bg-pink-600'} absolute -left-1.5 -top-1.5`}
                                    ></div>
                                </div>
                            )}

                            {weekDates.map((date, dayIndex) => (
                                <div key={dayIndex} className="relative">
                                    {hours.map((hour) => (
                                        <div key={hour} className={`h-20 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                            {allAppointments
                                                .filter(apt => {
                                                    const aptDate = new Date(apt.dateRange.startDate);
                                                    return aptDate.getDate() === date.getDate() &&
                                                           aptDate.getMonth() === date.getMonth() &&
                                                           aptDate.getFullYear() === date.getFullYear();
                                                })
                                                .map(apt => {
                                                    const { top, height } = calculateAppointmentPosition(apt.timeSlot);
                                                    return (
                                                        <div
                                                            key={apt._id}
                                                            onClick={() => handleAppointmentClick(apt)}
                                                            className={`absolute inset-x-1 px-2 py-1 rounded-lg ${getAppointmentColor(apt.status, isDarkMode)} cursor-pointer hover:opacity-90`}
                                                            style={{
                                                                top: `${top}px`,
                                                                height: `${height}px`,
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <div className="text-xs font-medium truncate">{apt.appointmentType}</div>
                                                            <div className="text-xs truncate">{`${apt.patient.firstname} ${apt.patient.lastname}`}</div>
                                                            <div className="text-xs truncate">{formatAppointmentTime(apt.timeSlot)}</div>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Update the renderDayView function to include the current time indicator
    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const today = new Date();
        const currentTimeTop = getCurrentTimePosition();
        
        // Add this variable declaration
        const isDisplayDateToday = displayDate.getDate() === today.getDate() &&
                                  displayDate.getMonth() === today.getMonth() &&
                                  displayDate.getFullYear() === today.getFullYear();

        return (
            <div className="relative h-[calc(100vh-16rem)]">
                {/* Fixed Header */}
                <div className={`sticky top-0 z-10 grid grid-cols-[80px_1fr] ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                    {/* Empty space above time markers */}
                    <div className={`h-20 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {displayDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                            </div>
                            <div
                                className={`text-2xl font-semibold mt-1 ${
                                    isDisplayDateToday
                                        ? `w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? "bg-pink-500 text-white" : "bg-pink-600 text-white"}`
                                        : isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                }`}
                            >
                                {displayDate.getDate()}
                            </div>
                        </div>
                    </div>

                    {/* Day header - now empty */}
                    <div className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}></div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto h-[calc(100%-5rem)]">
                    <div className="grid grid-cols-[80px_1fr] divide-x divide-gray-200">
                        {/* Time markers */}
                        <div className="space-y-0">
                            {hours.map((hour) => (
                                <div key={hour} className={`h-20 flex items-center justify-end pr-4 text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    {formatTime(hour.toString())}
                                </div>
                            ))}
                        </div>

                        {/* Time slots */}
                        <div className="relative">
                            {/* Add current time indicator */}
                            {isDisplayDateToday && (
                                <div 
                                    className="absolute left-0 right-0 z-20 pointer-events-none"
                                    style={{ top: `${currentTimeTop}px` }}
                                >
                                    <div className={`h-[2px] w-full ${isDarkMode ? 'bg-pink-500' : 'bg-pink-600'}`}></div>
                                    <div 
                                        className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-pink-500' : 'bg-pink-600'} absolute -left-1.5 -top-1.5`}
                                    ></div>
                                </div>
                            )}

                            {hours.map((hour) => (
                                <div key={hour} className={`h-20 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                    {allAppointments
                                        .filter(apt => {
                                            const aptDate = new Date(apt.dateRange.startDate);
                                            return aptDate.getDate() === displayDate.getDate() &&
                                                   aptDate.getMonth() === displayDate.getMonth() &&
                                                   aptDate.getFullYear() === displayDate.getFullYear();
                                        })
                                        .map(apt => {
                                            const { top, height } = calculateAppointmentPosition(apt.timeSlot);
                                            return (
                                                <div
                                                    key={apt._id}
                                                    onClick={() => handleAppointmentClick(apt)}
                                                    className={`absolute inset-x-1 px-2 py-1 rounded-lg ${getAppointmentColor(apt.status, isDarkMode)} cursor-pointer hover:opacity-90`}
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${height}px`,
                                                        zIndex: 10
                                                    }}
                                                >
                                                    <div className="text-xs font-medium truncate">{apt.appointmentType}</div>
                                                    <div className="text-xs truncate">{`${apt.patient.firstname} ${apt.patient.lastname}`}</div>
                                                    <div className="text-xs truncate">{formatAppointmentTime(apt.timeSlot)}</div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Add handler for opening modal
    const handleNewAppointment = () => {
        setIsNewAppointmentOpen(true);
    };

    const handleCreateAppointment = async () => {
        try {
            setIsSubmitting(true);
            setSubmitMessage({ type: "", message: "" });

            // Retrieve doctorId from localStorage or context
            const doctorName = localStorage.getItem("name") || "sampleDoctorId";

            if (!doctorName) {
                setSubmitMessage({ type: "error", message: "Doctor ID not found. Please log in again." });
                return;
            }

            // Convert duration to minutes
            let durationInMinutes;
            if (customDuration) {
                durationInMinutes = parseInt(customDuration);
            } else if (selectedDuration.includes("hour")) {
                durationInMinutes = 60;
            } else {
                durationInMinutes = parseInt(selectedDuration);
            }

            if (!durationInMinutes || isNaN(durationInMinutes)) {
                setSubmitMessage({ type: "error", message: "Please select a valid duration." });
                return;
            }

            // Get date range from inputs
            const startDateInput = document.querySelector('input[name="start-date"]') as HTMLInputElement;
            const endDateInput = document.querySelector('input[name="end-date"]') as HTMLInputElement;

            // Validate date inputs
            if (!startDateInput?.value || !endDateInput?.value) {
                setSubmitMessage({ type: "error", message: "Please select both start and end dates." });
                return;
            }

            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);

            // Validate date range
            if (endDate < startDate) {
                setSubmitMessage({ type: "error", message: "End date cannot be before start date." });
                return;
            }

            // Define the type for weeklySchedule
            const weeklySchedule: { [key: string]: { isAvailable: boolean; timeSlots: { startTime: string; endTime: string }[] } } = {};

            ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].forEach((day) => {
                const timeSlots: { startTime: string; endTime: string }[] = [];
                if (checkedDays[day]) {
                    const dayElement = document.getElementById(`day-${day}`);
                    if (dayElement) {
                        const timeInputs = dayElement.closest("div")?.querySelectorAll("select");
                        if (timeInputs && timeInputs.length >= 2) {
                            for (let i = 0; i < timeInputs.length; i += 2) {
                                const startTime = (timeInputs[i] as HTMLSelectElement).value;
                                const endTime = (timeInputs[i + 1] as HTMLSelectElement).value;
                                if (startTime && endTime) {
                                    timeSlots.push({ startTime, endTime });
                                }
                            }
                        }
                    }
                }
                weeklySchedule[day] = {
                    isAvailable: checkedDays[day] || false,
                    timeSlots: timeSlots,
                };
            });

            // Process excluded dates
            const formattedExcludedDates = excludedDates.map((dateStr) => {
                if (dateStr.includes(" - ")) {
                    const [start, end] = dateStr.split(" - ");
                    return {
                        startDate: new Date(start.split("/").reverse().join("-")),
                        endDate: new Date(end.split("/").reverse().join("-")),
                        type: "range",
                    };
                } else {
                    const date = new Date(dateStr.split("/").reverse().join("-"));
                    return {
                        startDate: date,
                        endDate: date,
                        type: "single",
                    };
                }
            });

            const appointmentData = {
                doctorName,
                duration: durationInMinutes,
                dateRange: {
                    startDate,
                    endDate,
                },
                weeklySchedule,
                excludedDates: formattedExcludedDates,
            };

            const response = await axios.post("/api/doctors/availability", appointmentData);

            if (response.data.success) {
                setSubmitMessage({
                    type: "success",
                    message: "Appointment availability successfully saved!",
                });
                setTimeout(() => {
                    setIsNewAppointmentOpen(false);
                    setSelectedDuration("");
                    setCustomDuration("");
                    setCheckedDays({});
                    setDayTimeSlots({});
                    setExcludedDates([]);
                }, 2000);
            } else {
                setSubmitMessage({
                    type: "error",
                    message: response.data.error || "Failed to save appointment availability.",
                });
            }
        } catch (error) {
            console.error("Error creating appointment:", error);
            setSubmitMessage({
                type: "error",
                message: "An error occurred while saving appointment availability.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update the exclusion section to handle optional inputs
    const handleAddSingleDate = (e: React.MouseEvent<HTMLButtonElement>) => {
        const dateInput = e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement;
        if (dateInput && dateInput.value) {
            const selectedDate = new Date(dateInput.value);
            const formattedDate = selectedDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            setExcludedDates((prev) => [...prev, formattedDate]);
            dateInput.value = ""; // Clear the input
        }
    };

    const handleAddDateRange = () => {
        const startDateInput = document.getElementById("range-start-date") as HTMLInputElement;
        const endDateInput = document.getElementById("range-end-date") as HTMLInputElement;

        if (startDateInput?.value && endDateInput?.value) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);

            const formattedStartDate = startDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });

            const formattedEndDate = endDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });

            const dateRange = `${formattedStartDate} - ${formattedEndDate}`;
            setExcludedDates((prev) => [...prev, dateRange]);

            // Clear the inputs
            startDateInput.value = "";
            endDateInput.value = "";
        }
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setIsProfileOpen(false); // Close the dropdown
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
            const response = await axios.put('/api/doctors/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (response.data.success) {
                handleCloseModal(); // Use handleCloseModal instead of just setIsProfileModalOpen(false)
                setProfileSuccessMessage(true);
                
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

    // Add this useEffect to fetch doctor profile data when modal opens
    useEffect(() => {
        if (isProfileModalOpen) {
            const fetchDoctorProfile = async () => {
                try {
                    const response = await axios.get('/api/doctors/profile');
                    if (response.data.success) {
                        setDoctorProfile(prev => ({
                            ...prev,
                            ...response.data.data
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching doctor profile:', error);
                }
            };
            fetchDoctorProfile();
        }
    }, [isProfileModalOpen]);

    // Add these handler functions
    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            const numbersOnly = value.replace(/[^0-9]/g, '');
            setDoctorProfile(prev => ({
                ...prev,
                [name]: numbersOnly ? `60${numbersOnly}` : ''
            }));
        } else if (name === 'status') {
            // Update both states immediately
            const newStatus = value;
            setCurrentStatus(newStatus);
            setDoctorProfile(prev => ({
                ...prev,
                status: newStatus
            }));

            try {
                const formData = new FormData();
                formData.append('status', newStatus);
                
                await axios.put('/api/doctors/profile', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } catch (error) {
                console.error('Error updating status:', error);
                // If there's an error, revert both states
                const prevStatus = await axios.get('/api/doctors/profile');
                if (prevStatus.data.success) {
                    const revertStatus = prevStatus.data.data.status;
                    setCurrentStatus(revertStatus);
                    setDoctorProfile(prev => ({
                        ...prev,
                        status: revertStatus
                    }));
                }
            }
        } else {
            setDoctorProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Update the handleSaveProfile function
    const handleSaveProfile = async () => {
        setFormErrors({
            phone: ''
        });
        setError('');

        try {
            // Get current time in Malaysia timezone (UTC+8)
            const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
            const malaysiaTime = new Date(Date.now() + malaysiaOffset);

            const formData = new FormData();
            formData.append('phone', doctorProfile.phone);
            formData.append('updatedAt', malaysiaTime.toISOString());

            const response = await axios.put('/api/doctors/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                handleCloseModal();
                setProfileSuccessMessage(true);
                
                setTimeout(() => {
                    setProfileSuccessMessage(false);
                }, 3000);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setError(error.response?.data?.error || 'Failed to update profile. Please try again.');
        }
    };

    // Add this function to reset all form states
    const resetFormStates = () => {
        setDoctorProfile({
            image: '',
            name: '',
            email: '',
            phone: '',
            bio: '',
            specialization: '',
            operatingHours: '',
            status: 'active'
        });
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setFormErrors({
            phone: ''
        });
        setError('');
        setActiveTab('account');
    };

    // Update the close handlers
    const handleCloseModal = () => {
        resetFormStates();
        setIsProfileModalOpen(false);
    };

    // Add this helper function near the top of your component
    const StatusIndicator = ({ status }: { status: string }) => (
        <div className={`w-3 h-3 rounded-full border-2 border-white ${
            status === 'Active' 
                ? 'bg-green-500'
                : status === 'Busy'
                ? 'bg-red-500'
                : 'bg-gray-400'
        }`}>
            {status === 'Out of Office' && (
                <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
    );

    // Add this function to fetch all appointments
    const fetchAllAppointments = async () => {
        try {
            setIsLoadingAll(true);
            const response = await axios.get('/api/doctors/allappointments');

            if (response.data.success) {
                const appointments = response.data.appointments;
                setAllAppointments(appointments);
            } else {
                setFetchAllError('Failed to fetch appointments');
            }
        } catch (error) {
            console.error('Error fetching all appointments:', error);
            setFetchAllError('Error fetching appointments');
        } finally {
            setIsLoadingAll(false);
        }
    };

    // Add this to your useEffect or where appropriate
    useEffect(() => {
        fetchAllAppointments();
    }, []); // Empty dependency array means this runs once on component mount

    // Add this useEffect to update the current time line
    useEffect(() => {
        if ((viewType === 'week' || viewType === 'day') && 
            (viewType === 'day' ? isToday(displayDate.getDate()) : true)) {
            const interval = setInterval(() => {
                // Force re-render to update time line position
                setDisplayDate(prev => new Date(prev));
            }, 60000); // Update every minute

            return () => clearInterval(interval);
        }
    }, [viewType, displayDate]);

    // Add this handler function
    const handleAppointmentClick = (appointment: Appointment) => {
        // Only show modal for non-cancelled and non-rescheduled appointments
        if (appointment.status.toLowerCase() !== 'cancelled' && appointment.status.toLowerCase() !== 'rescheduled') {
            setSelectedAppointment(appointment);
            setIsPatientModalOpen(true);
        }
    };

    // Add this helper function to calculate age
    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    };

    const handleClosePatientModal = () => {
        setSelectedAppointment(null);
        setIsPatientModalOpen(false);
    };

    // Add new function to handle doctor status updates
    const updateDoctorStatus = async (newStatus: string) => {
        try {
            const formData = new FormData();
            formData.append('status', newStatus);
            
            const response = await axios.put('/api/doctors/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setCurrentStatus(newStatus);
                setDoctorProfile(prev => ({
                    ...prev,
                    status: newStatus
                }));
            }
        } catch (error) {
            console.error('Error updating doctor status:', error);
            toast.error('Failed to update doctor status');
        }
    };

    // Add function to handle visit button click
    const handleVisitClick = async (appointment: Appointment) => {
        try {
            // Update appointment status to "Ongoing"
            const response = await axios.put(`/api/doctors/appointment/${appointment._id}`);

            if (response.data.success) {
                // Update local state
                setAllAppointments(prevAppointments => 
                    prevAppointments.map(app => 
                        app._id === appointment._id 
                            ? { ...app, status: 'Ongoing' }
                            : app
                    )
                );

                // Update doctor status to "Busy"
                await updateDoctorStatus('Busy');

                // Open medical pass modal
                setSelectedPatientForVisit(appointment);
                setIsMedicalPassModalOpen(true);
            }
        } catch (error: any) {
            console.error('Error updating appointment status:', error);
            toast.error(error.response?.data?.error || 'Failed to update appointment status');
        }
    };

    // Add function to close medical pass modal
    const handleCloseMedicalPassModal = () => {
        setSelectedPatientForVisit(null);
        setIsMedicalPassModalOpen(false);
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-100"} ${poppins.className}`}>
            {/* Sidebar - Fixed */}
            <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                {/* Top section with logo and navigation */}
                <div className="flex-1">
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
                            {[
                                { href: "/doctordashboard", icon: <FiGrid className="w-5 h-5 mr-4" />, text: "Dashboard" },
                                { 
                                    href: "/doctordashboard/appointments", 
                                    icon: <FiCalendar className="w-5 h-5 mr-4" />, 
                                    text: "Appointments",
                                    badge: todayStats.remaining > 0 ? todayStats.remaining : undefined
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
                                                ? "text-pink-400"
                                                : "text-pink-800"
                                            : isDarkMode
                                            ? "text-gray-200 hover:bg-gray-700"
                                            : "text-gray-700 hover:bg-pink-100"
                                    }`}
                                >
                                    {pathname === item.href && <div className={`absolute right-0 top-0 h-full w-1 ${isDarkMode ? "bg-pink-400" : "bg-pink-800"}`}></div>}
                                    {item.icon}
                                    <span className="flex-1">{item.text}</span>
                                    {item.badge && (
                                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDarkMode ? "bg-pink-400/20 text-pink-400" : "bg-pink-100 text-pink-800"}`}>
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
                            isDarkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-pink-100"
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
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Appointments</h1>
                        <p className={`text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{currentDate}</p>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-6">
                        {/* New Appointment Button */}
                        <button
                            onClick={handleNewAppointment}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                isDarkMode ? "bg-pink-500 hover:bg-pink-600 text-white" : "bg-pink-600 hover:bg-pink-700 text-white"
                            }`}
                        >
                            + New Appointment
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
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-3 focus:outline-none"
                            >
                                <div className="relative">
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
                                    {/* Add status indicator */}
                                    <div className="absolute -bottom-1 -right-1">
                                        <div className="bg-white dark:bg-gray-800 rounded-full p-0.5">
                                            <StatusIndicator status={currentStatus} />
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <p className="text-sm font-medium">{doctorName}</p>
                                    <FiChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400/70'} transition-transform ${isProfileOpen ? 'transform rotate-180' : ''}`} />
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
                                        onClick={handleProfileClick}
                                        className={`w-full text-left px-4 py-2 text-sm ${
                                            isDarkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
                                        } transition-colors flex items-center space-x-2`}
                                    >
                                        <FaRegUser className="h-4 w-4 mr-2" />
                                        <span>Profile</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className={`w-full text-left px-4 py-2 text-sm ${
                                            isDarkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
                                        } transition-colors flex items-center space-x-2 text-red-600`}
                                    >
                                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Adjusted for fixed header */}
                <div className="pt-24">
                    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        {/* Calendar Container */}
                        <div className={`rounded-xl shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                            {/* Calendar Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handleToday}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700"}`}
                                        >
                                            Today
                                        </button>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={handlePrevious}
                                                className={`p-2 rounded-lg ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={handleNext}
                                                className={`p-2 rounded-lg ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                        <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{getDisplayText()}</h2>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setViewType("month")}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                viewType === "month"
                                                    ? isDarkMode
                                                        ? "bg-pink-500 text-white"
                                                        : "bg-pink-600 text-white"
                                                    : isDarkMode
                                                    ? "bg-gray-700 text-white"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            Month
                                        </button>
                                        <button
                                            onClick={() => setViewType("week")}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                viewType === "week"
                                                    ? isDarkMode
                                                        ? "bg-pink-500 text-white"
                                                        : "bg-pink-600 text-white"
                                                    : isDarkMode
                                                    ? "bg-gray-700 text-white"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            Week
                                        </button>
                                        <button
                                            onClick={() => setViewType("day")}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                                viewType === "day"
                                                    ? isDarkMode
                                                        ? "bg-pink-500 text-white"
                                                        : "bg-pink-600 text-white"
                                                    : isDarkMode
                                                    ? "bg-gray-700 text-white"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            Day
                                        </button>
                                    </div>
                                </div>
                                {/* Days of Week Header - Only show in month view */}
                                {viewType === "month" && (
                                    <div className="grid grid-cols-7 gap-4">
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                            <div key={day} className={`text-sm font-medium text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Calendar Content */}
                            <div className="p-6">
                                {viewType === "month" ? (
                                    renderMonthView()
                                ) : viewType === "week" ? (
                                    renderWeekView()
                                ) : (
                                    renderDayView()
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Update Modal Overlay */}
            {isNewAppointmentOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center">
                    <div className={`w-full max-w-4xl h-[90vh] rounded-xl shadow-lg ${isDarkMode ? "bg-gray-800/95" : "bg-white/95"} flex flex-col`}>
                        {/* Modal Header - Fixed */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>New Appointment</h2>
                            <button
                                onClick={() => setIsNewAppointmentOpen(false)}
                                className={`p-1.5 rounded-lg ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className={`space-y-0 divide-y ${isDarkMode ? "divide-gray-600" : "divide-gray-200"}`}>
                                {/* Row 1: Duration */}
                                <div className="py-2">
                                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                                        <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Duration</h3>
                                        <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Select a Duration</p>

                                        {/* Duration Options */}
                                        <div className="flex space-x-8 mb-6">
                                            {["15 min", "30 min", "45 min", "1 hour"].map((duration) => (
                                                <div key={duration} className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        id={duration}
                                                        name="duration"
                                                        value={duration}
                                                        checked={selectedDuration === duration && !customDuration}
                                                        onChange={(e) => {
                                                            setSelectedDuration(e.target.value);
                                                            setCustomDuration("");
                                                        }}
                                                        className={`w-4 h-4 ${
                                                            isDarkMode ? "text-pink-500 border-gray-600 focus:ring-pink-500" : "text-pink-600 border-gray-300 focus:ring-pink-600"
                                                        }`}
                                                    />
                                                    <label htmlFor={duration} className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                                        {duration}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Custom Duration */}
                                        <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Or enter a custom duration in minutes</p>
                                        <div className="relative w-1/2">
                                            <input
                                                type="number"
                                                value={customDuration}
                                                onChange={(e) => {
                                                    setCustomDuration(e.target.value);
                                                    setSelectedDuration(""); // Clear radio selection when custom duration is entered
                                                }}
                                                className={`w-full rounded-lg border text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                    isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900"
                                                } px-3 py-2 pr-20`}
                                                placeholder="Enter duration"
                                            />
                                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Minutes</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Availability */}
                                <div className="py-2">
                                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                                        <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Availability</h3>
                                        <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            Define custom hours to configure when this event can be booked
                                        </p>
                                        <div className="space-y-3">
                                            {/* Date Range */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={`block text-base font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Start Date</label>
                                                    <input
                                                        type="date"
                                                        name="start-date"
                                                        className={`w-full rounded-lg border text-base ${
                                                            isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900"
                                                        } px-3 py-2`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-base font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>End Date</label>
                                                    <input
                                                        type="date"
                                                        name="end-date"
                                                        className={`w-full rounded-lg border text-base ${
                                                            isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900"
                                                        } px-3 py-2`}
                                                    />
                                                </div>
                                            </div>
                                            {/* Days of Week */}
                                            <div>
                                                <label className={`block text-base font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Days of Week</label>
                                                <div className={`space-y-0 divide-y ${isDarkMode ? "divide-gray-600" : "divide-gray-200"}`}>
                                                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                                                        <div key={day} className="flex items-center space-x-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                id={`day-${day}`}
                                                                checked={checkedDays[day] || false}
                                                                onChange={(e) => {
                                                                    setCheckedDays((prev) => ({
                                                                        ...prev,
                                                                        [day]: e.target.checked,
                                                                    }));
                                                                }}
                                                                className={`w-4 h-4 rounded ${
                                                                    isDarkMode
                                                                        ? "text-pink-500 border-gray-600 focus:ring-pink-500"
                                                                        : "text-pink-600 border-gray-300 focus:ring-pink-600"
                                                                }`}
                                                            />
                                                            <label
                                                                htmlFor={`day-${day}`}
                                                                className={`text-sm font-medium min-w-[40px] ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                                                            >
                                                                {day}
                                                            </label>
                                                            {checkedDays[day] ? (
                                                                <div className="flex flex-col space-y-3">
                                                                    {/* Repeat time selectors based on number of slots */}
                                                                    {Array.from({ length: dayTimeSlots[day] || 1 }).map((_, index) => (
                                                                        <div key={index} className="flex items-center space-x-8">
                                                                            {/* Time Selectors */}
                                                                            <div className="relative">
                                                                                <select
                                                                                    className={`rounded-lg border text-sm pr-8 pl-2 py-1 appearance-none ${
                                                                                        isDarkMode
                                                                                            ? "bg-gray-700 border-gray-600 text-gray-200"
                                                                                            : "bg-white border-gray-300 text-gray-900"
                                                                                    }`}
                                                                                    defaultValue=""
                                                                                >
                                                                                    <option value="" disabled>
                                                                                        Select time
                                                                                    </option>
                                                                                    {Array.from({ length: 25 }, (_, i) => {
                                                                                        const hour = Math.floor(i / 2) + 8;
                                                                                        const minutes = i % 2 === 0 ? "00" : "30";
                                                                                        const timeValue = `${String(hour).padStart(2, "0")}:${minutes}`;
                                                                                        return (
                                                                                            <option key={timeValue} value={timeValue}>
                                                                                                {timeValue}
                                                                                            </option>
                                                                                        );
                                                                                    })}
                                                                                </select>
                                                                                <div
                                                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                                                                                        isDarkMode ? "text-gray-400" : "text-gray-500"
                                                                                    }`}
                                                                                >
                                                                                    <FiClock className="w-4 h-4" />
                                                                                </div>
                                                                            </div>

                                                                            {/* End Time Select */}
                                                                            <div className="relative">
                                                                                <select
                                                                                    className={`rounded-lg border text-sm pr-8 pl-2 py-1 appearance-none ${
                                                                                        isDarkMode
                                                                                            ? "bg-gray-700 border-gray-600 text-gray-200"
                                                                                            : "bg-white border-gray-300 text-gray-900"
                                                                                    }`}
                                                                                    defaultValue=""
                                                                                >
                                                                                    <option value="" disabled>
                                                                                        Select time
                                                                                    </option>
                                                                                    {Array.from({ length: 25 }, (_, i) => {
                                                                                        const hour = Math.floor(i / 2) + 8;
                                                                                        const minutes = i % 2 === 0 ? "00" : "30";
                                                                                        const timeValue = `${String(hour).padStart(2, "0")}:${minutes}`;
                                                                                        return (
                                                                                            <option key={timeValue} value={timeValue}>
                                                                                                {timeValue}
                                                                                            </option>
                                                                                        );
                                                                                    })}
                                                                                </select>
                                                                                <div
                                                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                                                                                        isDarkMode ? "text-gray-400" : "text-gray-500"
                                                                                    }`}
                                                                                >
                                                                                    <FiClock className="w-4 h-4" />
                                                                                </div>
                                                                            </div>

                                                                            {/* Action Buttons */}
                                                                            <div className="flex items-center space-x-2">
                                                                                {/* Delete Button */}
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (dayTimeSlots[day] > 1) {
                                                                                            setDayTimeSlots((prev) => ({
                                                                                                ...prev,
                                                                                                [day]: (prev[day] || 1) - 1,
                                                                                            }));
                                                                                        } else {
                                                                                            setCheckedDays((prev) => ({
                                                                                                ...prev,
                                                                                                [day]: false,
                                                                                            }));
                                                                                            setDayTimeSlots((prev) => ({
                                                                                                ...prev,
                                                                                                [day]: 0,
                                                                                            }));
                                                                                        }
                                                                                    }}
                                                                                    className={`p-1.5 rounded-lg hover:bg-red-100 text-red-500`}
                                                                                    title="Delete time slot"
                                                                                >
                                                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={2.5}
                                                                                            d="M6 18L18 6M6 6l12 12"
                                                                                        />
                                                                                    </svg>
                                                                                </button>

                                                                                {/* Add Button - Only show on last slot */}
                                                                                {index === (dayTimeSlots[day] || 1) - 1 && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setDayTimeSlots((prev) => ({
                                                                                                ...prev,
                                                                                                [day]: (prev[day] || 1) + 1,
                                                                                            }));
                                                                                        }}
                                                                                        className={`p-1.5 rounded-lg hover:bg-blue-100 text-blue-500`}
                                                                                        title="Add time slot"
                                                                                    >
                                                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={2.5}
                                                                                                d="M12 4v16m8-8H4"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Unavailable</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Exclusions */}
                                <div className="py-2">
                                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                                        <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Exclusions</h3>
                                        <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            Add dates or custom range to exclude from your availability.
                                            <br />
                                            Eg, holidays, vacation etc.
                                        </p>

                                        {/* Selected Dates Display */}
                                        {excludedDates.length > 0 && (
                                            <div className={`mb-4 p-3 rounded-lg border ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                                                <div className="flex flex-wrap gap-2">
                                                    {excludedDates.map((date, index) => (
                                                        <div
                                                            key={index}
                                                            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm ${
                                                                isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100 text-gray-700"
                                                            }`}
                                                        >
                                                            {date}
                                                            <button
                                                                onClick={() => {
                                                                    setExcludedDates((prev) => prev.filter((_, i) => i !== index));
                                                                }}
                                                                className="ml-2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Radio Buttons */}
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="single-date"
                                                    name="exclusion-type"
                                                    value="single"
                                                    checked={exclusionType === "single"}
                                                    onChange={() => setExclusionType("single")}
                                                    className={`w-4 h-4 ${
                                                        isDarkMode ? "text-pink-500 border-gray-600 focus:ring-pink-500" : "text-pink-600 border-gray-300 focus:ring-pink-600"
                                                    }`}
                                                />
                                                <label htmlFor="single-date" className={`ml-2 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                                    Single date
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id="date-range"
                                                    name="exclusion-type"
                                                    value="range"
                                                    checked={exclusionType === "range"}
                                                    onChange={() => setExclusionType("range")}
                                                    className={`w-4 h-4 ${
                                                        isDarkMode ? "text-pink-500 border-gray-600 focus:ring-pink-500" : "text-pink-600 border-gray-300 focus:ring-pink-600"
                                                    }`}
                                                />
                                                <label htmlFor="date-range" className={`ml-2 text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                                    Date ranges
                                                </label>
                                            </div>
                                        </div>

                                        {/* Date Selection based on type */}
                                        {exclusionType === "single" ? (
                                            // Single Date Selection
                                            <div>
                                                <label className={`block text-base font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Select Date</label>
                                                <div className="flex items-center">
                                                    <div
                                                        className={`flex flex-1 items-center rounded-lg border ${
                                                            isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                                                        }`}
                                                    >
                                                        <input
                                                            type="date"
                                                            className={`flex-1 border-0 rounded-l-lg text-base ${
                                                                isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"
                                                            } px-3 py-2 focus:ring-0 focus:outline-none`}
                                                        />
                                                        <div className={`w-px h-6 mx-2 ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
                                                        <button
                                                            onClick={handleAddSingleDate}
                                                            className={`px-3 py-2 text-sm font-medium ${
                                                                isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                                                            }`}
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Date Range Selection
                                            <div>
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <label className={`block text-base font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Start Date</label>
                                                        <input
                                                            type="date"
                                                            id="range-start-date"
                                                            className={`w-full rounded-lg border text-base ${
                                                                isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900"
                                                            } px-3 py-2`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`block text-base font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>End Date</label>
                                                        <input
                                                            type="date"
                                                            id="range-end-date"
                                                            className={`w-full rounded-lg border text-base ${
                                                                isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900"
                                                            } px-3 py-2`}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={handleAddDateRange}
                                                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                                            isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                                                        }`}
                                                    >
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Fixed */}
                        <div className="border-t border-gray-200">
                            <div className="flex justify-end space-x-4 p-4">
                                {submitMessage.message && (
                                    <div
                                        className={`px-4 py-2 rounded-lg mr-auto ${
                                            submitMessage.type === "success"
                                                ? isDarkMode
                                                    ? "bg-green-800/60 text-green-200"
                                                    : "bg-green-100 text-green-800"
                                                : isDarkMode
                                                ? "bg-red-800/60 text-red-200"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {submitMessage.message}
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsNewAppointmentOpen(false)}
                                    className={`px-6 py-2 rounded-lg text-base font-medium ${
                                        isDarkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateAppointment}
                                    disabled={isSubmitting}
                                    className={`px-6 py-2 rounded-lg text-base font-medium ${
                                        isDarkMode ? "bg-pink-500 text-white hover:bg-pink-600" : "bg-pink-600 text-white hover:bg-pink-700"
                                    } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {isSubmitting ? "Saving..." : "Create Appointment"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
                        onClick={handleCloseModal} 
                    />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className={`w-full max-w-2xl rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-h-[85vh] overflow-hidden flex flex-col`}>
                            {/* Modal Header */}
                            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Doctor Profile
                                    </h2>
                                    <button 
                                        onClick={handleCloseModal}
                                        className={`p-2 rounded-lg transition-colors ${
                                            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex space-x-4 mt-4">
                                    <button
                                        onClick={() => setActiveTab('account')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            activeTab === 'account'
                                                ? 'bg-gray-100 text-pink-600'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        Account
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('password')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            activeTab === 'password'
                                                ? 'bg-gray-100 text-pink-600'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        Password
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* Modal Content - Scrollable */}
                            <div className="overflow-y-auto p-4">
                                {activeTab === 'account' ? (
                                    <div className="space-y-4">
                                        {/* Profile Image and Name */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center overflow-hidden">
                                                        {(doctorProfile.image || profileImage) ? (
                                                            <Image 
                                                                src={doctorProfile.image || profileImage}
                                                                alt="Profile"
                                                                width={64}
                                                                height={64}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className={`text-xl font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                                                                {doctorName.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Add status indicator */}
                                                    <div className="absolute -bottom-1 -right-1">
                                                        <div className="bg-white dark:bg-gray-800 rounded-full p-0.5">
                                                            <StatusIndicator status={currentStatus} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {doctorName}
                                                    </h3>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Doctor
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Status:
                                                </span>
                                                <select
                                                    name="status"
                                                    value={doctorProfile.status}
                                                    onChange={handleInputChange}
                                                    className={`px-3 py-1 text-sm rounded-lg ${
                                                        isDarkMode
                                                            ? 'bg-gray-700 border-gray-600 text-white'
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                    } border focus:ring-2 focus:ring-pink-500`}
                                                >
                                                    <option value="Active" className="bg-white text-gray-900">Active</option>
                                                    <option value="Busy" className="bg-white text-gray-900">Busy</option>
                                                    <option value="Out of Office" className="bg-white text-gray-900">Out of Office</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={doctorProfile.email}
                                                    readOnly
                                                    className={`w-full px-3 py-2 rounded-lg ${
                                                        isDarkMode
                                                            ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                                                            : 'bg-gray-100 border-gray-200 text-gray-600'
                                                    } border focus:ring-0 cursor-not-allowed`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                        +60
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={String(doctorProfile.phone).startsWith('60') 
                                                            ? String(doctorProfile.phone).slice(2) 
                                                            : String(doctorProfile.phone)}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-12 pr-3 py-2 rounded-lg ${
                                                            formErrors.phone 
                                                                ? 'border-red-500' 
                                                                : isDarkMode
                                                                    ? 'border-gray-600'
                                                                    : 'border-gray-300'
                                                        } ${
                                                            isDarkMode
                                                                ? 'bg-gray-700 text-white'
                                                                : 'bg-white text-gray-900'
                                                        } border focus:ring-2 focus:ring-pink-500`}
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
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Specialization
                                                </label>
                                                <input
                                                    type="text"
                                                    name="specialization"
                                                    value={doctorProfile.specialization}
                                                    readOnly
                                                    className={`w-full px-3 py-2 rounded-lg ${
                                                        isDarkMode
                                                            ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                                                            : 'bg-gray-100 border-gray-200 text-gray-600'
                                                    } border focus:ring-0 cursor-not-allowed`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Operating Hours
                                                </label>
                                                <input
                                                    type="text"
                                                    name="operatingHours"
                                                    value={doctorProfile.operatingHours}
                                                    readOnly
                                                    className={`w-full px-3 py-2 rounded-lg ${
                                                        isDarkMode
                                                            ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                                                            : 'bg-gray-100 border-gray-200 text-gray-600'
                                                    } border focus:ring-0 cursor-not-allowed`}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Bio
                                                </label>
                                                <textarea
                                                    name="bio"
                                                    value={doctorProfile.bio}
                                                    readOnly
                                                    rows={2}
                                                    className={`w-full px-3 py-2 rounded-lg ${
                                                        isDarkMode
                                                            ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                                                            : 'bg-gray-100 border-gray-200 text-gray-600'
                                                    } border focus:ring-0 cursor-not-allowed`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={passwordForm.currentPassword}
                                                onChange={handlePasswordInputChange}
                                                className={`w-full px-3 py-2 rounded-lg ${
                                                    isDarkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                } border focus:ring-2 focus:ring-pink-500`}
                                            />
                                            {passwordErrors.currentPassword && (
                                                <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwordForm.newPassword}
                                                onChange={handlePasswordInputChange}
                                                className={`w-full px-3 py-2 rounded-lg ${
                                                    isDarkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                } border focus:ring-2 focus:ring-pink-500`}
                                            />
                                            {passwordErrors.newPassword && (
                                                <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordInputChange}
                                                className={`w-full px-3 py-2 rounded-lg ${
                                                    isDarkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                } border focus:ring-2 focus:ring-pink-500`}
                                            />
                                            {passwordErrors.confirmPassword && (
                                                <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                                <button
                                    onClick={handleCloseModal}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={activeTab === 'account' ? handleSaveProfile : handlePasswordChange}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDarkMode
                                            ? 'bg-pink-500 hover:bg-pink-600 text-white'
                                            : 'bg-pink-600 hover:bg-pink-700 text-white'
                                    }`}
                                >
                                    {activeTab === 'account' ? 'Save Changes' : 'Change Password'}
                                </button>
                            </div>
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

            {isAppointmentModalOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
                        onClick={() => setIsAppointmentModalOpen(false)}
                    />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className={`w-full max-w-lg rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
                            {/* Modal Header */}
                            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedAppointment.appointmentType}
                                </h3>
                                <button 
                                    onClick={() => setIsAppointmentModalOpen(false)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                <div className="space-y-4">
                                    {/* Status Badge */}
                                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getAppointmentColor(selectedAppointment.status, isDarkMode)}`}>
                                        {selectedAppointment.status}
                                    </div>

                                    {/* Date & Time - with gray clock icon */}
                                    <div className="flex items-center gap-2">
                                        <FiClock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <div>
                                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {new Date(selectedAppointment.dateRange.startDate).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long'
                                                })}
                                            </p>
                                            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {formatAppointmentTime(selectedAppointment.timeSlot)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Patient Info */}
                                    <div>
                                        <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Patient Information
                                        </h4>
                                        <div className="mt-1 flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                                                {selectedAppointment.patient.image ? (
                                                    <Image 
                                                        src={selectedAppointment.patient.image}
                                                        alt="Patient"
                                                        width={40}
                                                        height={40}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-pink-800 font-medium">
                                                        {selectedAppointment.patient.firstname[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {`${selectedAppointment.patient.firstname} ${selectedAppointment.patient.lastname}`}
                                                </p>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Age: {calculateAge(selectedAppointment.patient.dob)} years old
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
                                <button
                                    onClick={() => setIsAppointmentModalOpen(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Details Modal */}
            {isPatientModalOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
                        onClick={handleClosePatientModal} 
                    />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className={`w-full max-w-2xl rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-h-[85vh] overflow-hidden flex flex-col`}>
                            {/* Modal Header */}
                            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Patient Details
                                    </h2>
                                    <button 
                                        onClick={handleClosePatientModal}
                                        className={`p-2 rounded-lg transition-colors ${
                                            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                {/* Patient Info Section */}
                                <div className="flex items-start space-x-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-pink-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {selectedAppointment.patient?.image ? (
                                            <Image 
                                                src={selectedAppointment.patient.image}
                                                alt={`${selectedAppointment.patient.firstname} ${selectedAppointment.patient.lastname}`}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className={`text-xl font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                                                {selectedAppointment.patient?.firstname?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {`${selectedAppointment.patient?.firstname} ${selectedAppointment.patient?.lastname}`}
                                        </h3>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                            Age: {calculateAge(selectedAppointment.patient?.dob)} years old
                                        </p>
                                        <div className="flex flex-col mt-1 space-y-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedAppointment.appointmentType === 'Consultation'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                            } w-fit`}>
                                                {selectedAppointment.appointmentType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointment Time */}
                                <div className={`mb-6 flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FiClock className="w-4 h-4" />
                                    <span className="text-sm">
                                        Appointment at {formatTime(selectedAppointment.timeSlot.startTime)}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-4">
                                    <button 
                                        onClick={() => handleVisitClick(selectedAppointment)}
                                        className={`flex-grow px-8 py-2 rounded-lg font-medium text-sm transition-colors ${
                                            isDarkMode
                                                ? 'bg-pink-500 hover:bg-pink-600 text-white'
                                                : 'bg-pink-600 hover:bg-pink-700 text-white'
                                        }`}
                                    >
                                        {selectedAppointment.status === 'Completed' ? 'Report' : 
                                         selectedAppointment.status === 'Ongoing' ? 'Continue' : 'Visit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Medical Pass Modal */}
            {isMedicalPassModalOpen && selectedPatientForVisit && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
                        onClick={handleCloseMedicalPassModal} 
                    />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className={`w-full max-w-2xl rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-h-[85vh] overflow-hidden flex flex-col`}>
                            {/* Modal Header */}
                            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Patient Medical Pass
                                    </h2>
                                    <button 
                                        onClick={handleCloseMedicalPassModal}
                                        className={`p-2 rounded-lg transition-colors ${
                                            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto">
                                {/* Patient Info */}
                                <div className="mb-6">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-pink-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {selectedPatientForVisit.patient?.image ? (
                                                <Image 
                                                    src={selectedPatientForVisit.patient.image}
                                                    alt={`${selectedPatientForVisit.patient.firstname} ${selectedPatientForVisit.patient.lastname}`}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className={`text-xl font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                                                    {selectedPatientForVisit.patient?.firstname?.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {`${selectedPatientForVisit.patient?.firstname} ${selectedPatientForVisit.patient?.lastname}`}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Age: {calculateAge(selectedPatientForVisit.patient?.dob)} years old
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Medical History */}
                                <div className="mb-6">
                                    <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Medical History
                                    </h3>
                                    <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <div className="flex justify-between items-center">
                                            <span>Last Visit</span>
                                            <span>March 15, 2024</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Blood Type</span>
                                            <span>O+</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Allergies</span>
                                            <span>None</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Chronic Conditions</span>
                                            <span>None</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Medications */}
                                <div className="mb-6">
                                    <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Recent Medications
                                    </h3>
                                    <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <div className="flex justify-between items-center">
                                            <span>Vitamin D</span>
                                            <span>1000 IU daily</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Calcium</span>
                                            <span>500mg daily</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Test Results */}
                                <div className="mb-6">
                                    <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Recent Test Results
                                    </h3>
                                    <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <div className="flex justify-between items-center">
                                            <span>Mammogram</span>
                                            <span>Normal (March 1, 2024)</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Blood Pressure</span>
                                            <span>120/80 (March 15, 2024)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                                <button
                                    onClick={handleCloseMedicalPassModal}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        handleCloseMedicalPassModal();
                                        router.push(`/doctordashboard/consultation/${selectedPatientForVisit._id}`);
                                    }}
                                    className={`px-4 py-2 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                                            : 'bg-pink-600 hover:bg-pink-700 text-white'
                                    }`}
                                >
                                    New Consultation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


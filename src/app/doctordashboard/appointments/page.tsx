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

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

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
        const startingDay = firstDay.getDay();
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
        const storedName = localStorage.getItem("name");
        const storedImage = localStorage.getItem("image");
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

    const renderWeekView = () => {
        const weekDates = getWeekDates(displayDate);
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const today = new Date();

        // Function to check if a date is today
        const isDateToday = (date: Date) => {
            return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        };

        // Find today's column index
        const todayIndex = weekDates.findIndex(isDateToday);

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
                            {/* Current time indicator - Only show if today is in view */}
                            {todayIndex !== -1 && (
                                <div
                                    className={`absolute z-20 ${isDarkMode ? "bg-pink-500" : "bg-pink-600"}`}
                                    style={{
                                        top: `${currentTimeTop}px`,
                                        height: "2px",
                                        left: `${(todayIndex * 100) / 7}%`,
                                        width: `${100 / 7}%`,
                                    }}
                                >
                                    <div className={`absolute -left-2 -top-1 w-4 h-4 rounded-full ${isDarkMode ? "bg-pink-500" : "bg-pink-600"}`} />
                                </div>
                            )}

                            {weekDates.map((date, dayIndex) => (
                                <div key={dayIndex} className="relative">
                                    {hours.map((hour) => (
                                        <div key={hour} className={`h-20 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                            {/* Example appointment */}
                                            {hour === 10 && dayIndex === 3 && (
                                                <div
                                                    className={`absolute inset-x-1 top-[200px] h-20 rounded-lg px-2 py-1 ${
                                                        isDarkMode ? "bg-pink-500/20 text-pink-300" : "bg-pink-100 text-pink-800"
                                                    }`}
                                                >
                                                    <div className="text-xs font-medium">Consultation</div>
                                                    <div className="text-xs">Sarah Johnson</div>
                                                </div>
                                            )}
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

    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const today = new Date();
        const isDisplayDateToday = displayDate.getDate() === today.getDate() && displayDate.getMonth() === today.getMonth() && displayDate.getFullYear() === today.getFullYear();

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

                        {/* Time slots grid */}
                        <div className="relative">
                            {/* Current time indicator - Only show if today */}
                            {isDisplayDateToday && (
                                <div
                                    className={`absolute z-20 left-0 right-0 ${isDarkMode ? "bg-pink-500" : "bg-pink-600"}`}
                                    style={{
                                        top: `${currentTimeTop}px`,
                                        height: "2px",
                                    }}
                                >
                                    <div className={`absolute -left-2 -top-1 w-4 h-4 rounded-full ${isDarkMode ? "bg-pink-500" : "bg-pink-600"}`} />
                                </div>
                            )}

                            {/* Hour slots */}
                            {hours.map((hour) => (
                                <div key={hour} className={`h-20 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                    {/* Example appointment */}
                                    {hour === 10 && (
                                        <div
                                            className={`absolute inset-x-1 h-20 rounded-lg px-2 py-1 ${isDarkMode ? "bg-pink-500/20 text-pink-300" : "bg-pink-100 text-pink-800"}`}
                                        >
                                            <div className="text-xs font-medium">Consultation</div>
                                            <div className="text-xs">Sarah Johnson</div>
                                        </div>
                                    )}
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
            const doctorName = localStorage.getItem("name") || "sampleDoctorId"; // Replace 'sampleDoctorId' with actual logic

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

            // Get date range from inputs
            const startDateInput = document.querySelector('input[name="start-date"]') as HTMLInputElement;
            const endDateInput = document.querySelector('input[name="end-date"]') as HTMLInputElement;

            // Check if date range inputs are provided
            let startDate = new Date();
            let endDate = new Date(startDate);

            if (startDateInput?.value) {
                startDate = new Date(startDateInput.value);
            }
            if (endDateInput?.value) {
                endDate = new Date(endDateInput.value);
            }

            if (endDate < startDate) {
                endDate.setFullYear(startDate.getFullYear() + 1);
            }

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
                                    badge: 2,
                                },
                                { href: "/doctordashboard/patients", icon: <FiUsers className="w-5 h-5 mr-4" />, text: "Patients" },
                                {
                                    href: "/doctordashboard/messages",
                                    icon: <FiMessageSquare className="w-5 h-5 mr-4" />,
                                    text: "Messages",
                                    badge: 5,
                                },
                                { href: "/doctordashboard/reports", icon: <FiFileText className="w-5 h-5 mr-4" />, text: "Reports" },
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
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-3 focus:outline-none">
                                <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center overflow-hidden">
                                    {profileImage ? (
                                        <Image src={profileImage} alt="Profile" width={32} height={32} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className={`text-sm font-medium ${isDarkMode ? "text-gray-800" : "text-pink-800"}`}>{doctorName.charAt(0)}</span>
                                    )}
                                </div>
                                <div className={`flex items-center space-x-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                    <p className="text-sm font-medium">{doctorName}</p>
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
                                    // Existing month view code
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 35 }, (_, i) => {
                                            const { daysInMonth, startingDay } = getDaysInMonth(displayDate);
                                            const day = i - startingDay;
                                            const isCurrentMonth = day >= 0 && day < daysInMonth;

                                            // Calculate the date number to display
                                            const dateNumber = isCurrentMonth
                                                ? day + 1
                                                : day < 0
                                                ? new Date(displayDate.getFullYear(), displayDate.getMonth(), 0).getDate() + day + 1
                                                : day - daysInMonth + 1;

                                            return (
                                                <div
                                                    key={i}
                                                    className={`aspect-square p-2 rounded-lg cursor-pointer ${
                                                        isToday(day + 1) && isCurrentMonth
                                                            ? isDarkMode
                                                                ? "ring-2 ring-pink-500"
                                                                : "ring-2 ring-pink-600"
                                                            : isDarkMode
                                                            ? "hover:bg-gray-700"
                                                            : "hover:bg-gray-50"
                                                    } ${!isCurrentMonth ? (isDarkMode ? "text-gray-600" : "text-gray-400") : isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                                                >
                                                    <div
                                                        className={`font-medium text-sm mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                                                            isToday(day + 1) && isCurrentMonth ? (isDarkMode ? "bg-pink-500 text-white" : "bg-pink-600 text-white") : ""
                                                        }`}
                                                    >
                                                        {dateNumber}
                                                    </div>
                                                    {/* Example Appointments */}
                                                    {isCurrentMonth && [15, 18, 22].includes(day + 1) && (
                                                        <div
                                                            className={`text-xs px-1.5 py-0.5 rounded ${
                                                                isDarkMode ? "bg-pink-500/20 text-pink-300" : "bg-pink-100 text-pink-800"
                                                            } mb-1`}
                                                        >
                                                            2 appointments
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : viewType === "week" ? (
                                    // Week view
                                    renderWeekView()
                                ) : (
                                    // Day view
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
                                                        className={`w-full rounded-lg border text-base ${
                                                            isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-900"
                                                        } px-3 py-2`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-base font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>End Date</label>
                                                    <input
                                                        type="date"
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
        </div>
    );
}

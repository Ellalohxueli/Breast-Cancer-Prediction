"use client";

import { useEffect, useState } from "react";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BiMessageRounded } from "react-icons/bi";
import { FaRegBell, FaRegUser, FaCalendar, FaClock, FaStar } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { start } from "repl";
import NavBar from "@/components/UserNavBar";
import SessionOut from "@/components/SessionOut";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

interface AppointmentSlot {
    _id: string;
    startTime: string;
    endTime: string;
}

interface WeeklySchedule {
    [key: string]: {
        isAvailable: boolean;
        timeSlots: AppointmentSlot[];
        _id: string;
    };
}

interface Appointment {
    _id: string;
    excludedDates: {
        startDate: string;
        endDate: string;
        type: string;
    }[];
    dateRange: {
        startDate: string;
        endDate: string;
    };
    weeklySchedule: WeeklySchedule;
}

interface BookedAppointment {
    _id: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    day: string;
    timeSlot: {
        startTime: string;
        endTime: string;
    };
    appointmentType: "Consultation" | "Follow-up";
    status: string;
}

interface Doctor {
    _id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    operatingHours: string;
    bio: string;
    image: string;
}

type NotificationData = {
    _id: string;
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    appointmentDay: string;
    appointmentTime: string;
    status: "cancelled" | "rescheduled";
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
};

export default function AppointmentPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [appointments, setAppointments] = useState<Appointment[] | null>(null);
    const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<{ [key: string]: string }>({});
    const [error, setError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedDateDay, setSelectedDateDay] = useState<string>("");
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [selectedAppointmentType, setSelectedAppointmentType] = useState<"Consultation" | "Follow-up">("Consultation");
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeProfileTab, setActiveProfileTab] = useState<"profile" | "password">("profile");
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });
    const [editedUser, setEditedUser] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });
    const [formErrors, setFormErrors] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });
    const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [cancelledAppointments, setCancelledAppointments] = useState<BookedAppointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [appointmentError, setAppointmentError] = useState<string | null>(null);
    const [rescheduleConfirmationModal, setRescheduleConfirmationModal] = useState(false);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState<BookedAppointment | null>(null);
    const [showRescheduleSuccessMessage, setShowRescheduleSuccessMessage] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<BookedAppointment | null>(null);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewErrors, setReviewErrors] = useState<{
        rating?: string;
        reviewComment?: string;
    }>({});
    const [reviewSuccessMessage, setReviewSuccessMessage] = useState(false);

    useEffect(() => {
        async function fetchAppointmentData() {
            try {
                const response = await fetch(`/api/users/appointment/${window.location.pathname.split("/")[2]}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch appointment data");
                }

                const data = await response.json();

                setDoctor(data.doctor);
                setAppointments(data.appointments);
                setBookedAppointments(data.bookedAppointments);
                setFilteredAppointments(data.appointments);
            } catch (error: any) {
                setError(error.message);
            }
        }

        fetchAppointmentData();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");

            localStorage.removeItem("firstname");
            localStorage.removeItem("userId");

            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleSubmit = async () => {
        toast.dismiss();

        const doctorId = doctor?._id;

        if (!selectedAppointmentType) {
            toast.error("Please select an appointment type.");
            return;
        }

        if (doctorId && selectedSlots[doctorId]) {
            const selectedSlotId = selectedSlots[doctorId];

            const selectedAppointment = appointments?.find((appointment) =>
                Object.keys(appointment.weeklySchedule).some((day) => appointment.weeklySchedule[day].timeSlots.some((slot) => slot._id === selectedSlotId))
            );

            if (selectedAppointment) {
                let selectedDay: string | undefined;
                let selectedTimeSlot: AppointmentSlot | undefined;

                Object.keys(selectedAppointment.weeklySchedule).forEach((day) => {
                    const schedule = selectedAppointment.weeklySchedule[day];
                    const slot = schedule.timeSlots.find((slot) => slot._id === selectedSlotId);
                    if (slot) {
                        selectedDay = day;
                        selectedTimeSlot = slot;
                    }
                });

                if (selectedDay && selectedTimeSlot) {
                    const data = {
                        doctorId,
                        patientId: localStorage.getItem("userId"),
                        dateRange: {
                            startDate: selectedDate,
                            endDate: selectedDate,
                        },
                        day: selectedDay,
                        timeSlot: {
                            startTime: selectedTimeSlot.startTime,
                            endTime: selectedTimeSlot.endTime,
                        },
                        appointmentType: selectedAppointmentType,
                    };

                    try {
                        const response = await axios.post("/api/bookAppointment", data);

                        if (response.status === 201) {
                            toast.success("Appointment booked successfully!");

                            setTimeout(() => {
                                router.push("/dashboard/ourteams");
                            }, 1000);
                        } else {
                            toast.error("Failed to book appointment. Please try again.");
                        }
                    } catch (error) {
                        toast.error("Failed to book appointment. Please try again.");
                    }
                } else {
                    toast.error("Failed to book appointment. Please try again.");
                }
            } else {
                toast.error("Failed to book appointment. Please try again.");
            }
        } else {
            toast.error("Please select a time slot to book an appointment.");
        }
    };

    useEffect(() => {
        const handleDateChange = async (date: string) => {
            // Convert the selected date string into a Date object.
            const selectedDateObj = new Date(date);
            // Get the day in short format (e.g., "MON", "TUE") and convert to uppercase.
            const selectedDateDay = selectedDateObj.toLocaleString("en-US", { weekday: "short" }).toUpperCase();

            // Save the selected day in state (useful for UI or further logic).
            setSelectedDateDay(selectedDateDay);

            // If there are no appointments, exit early.
            if (!appointments) return;

            // Filter appointments based on the following:
            // 1. The selected date must fall within the appointment's date range.
            // 2. The selected date should not be an excluded date.
            // 3. The appointment must be available for the selected day.
            const validAppointments = appointments.filter((appointment) => {
                const startDate = new Date(appointment.dateRange.startDate);
                const endDate = new Date(appointment.dateRange.endDate);

                // Check for any excluded dates.
                const excludeDates = appointment.excludedDates || [];
                const isExcluded = excludeDates.some((exclude) => {
                    const excludeStart = new Date(exclude.startDate);
                    const excludeEnd = exclude.endDate ? new Date(exclude.endDate) : excludeStart;

                    if (exclude.type === "single") {
                        return selectedDateObj.toDateString() === excludeStart.toDateString();
                    } else if (exclude.type === "range") {
                        return selectedDateObj >= excludeStart && selectedDateObj <= excludeEnd;
                    }
                    return false;
                });

                // Get the schedule for the selected day (e.g., "MON") from weeklySchedule.
                const scheduleForSelectedDay = appointment.weeklySchedule[selectedDateDay];
                const isAvailableForSelectedDay = scheduleForSelectedDay && scheduleForSelectedDay.isAvailable;

                return selectedDateObj >= startDate && selectedDateObj <= endDate && !isExcluded && isAvailableForSelectedDay;
            });

            // For each valid appointment, update the weeklySchedule so that only the selected day is kept.
            // Then filter out the time slots that are booked for that day if the selected date equals booked appointment's dateRange.startDate.
            const updatedAppointments = validAppointments.map((appointment) => {
                // Get the schedule for the selected day.
                const scheduleForSelectedDay = appointment.weeklySchedule[selectedDateDay];

                // Filter out any time slot that is already booked or completed on the selected date.
                const filteredTimeSlots = scheduleForSelectedDay.timeSlots.filter((slot: any) => {
                    // Check booked appointments for this slot
                    const bookedAppointmentsForSlot = bookedAppointments.filter((booked) => {
                        const bookedDate = new Date(booked.dateRange.startDate);
                        const isSameDate = bookedDate.toDateString() === selectedDateObj.toDateString();
                        const isSameDay = booked.day === selectedDateDay;
                        const isSameTimeSlot = booked.timeSlot.startTime === slot.startTime && booked.timeSlot.endTime === slot.endTime;

                        // Filter out slots that are either "Booked" or "Completed"
                        return isSameDate && isSameDay && isSameTimeSlot && (booked.status === "Booked" || booked.status === "Completed");
                    });

                    // Log whether the slot will be kept or filtered out
                    const isSlotAvailable = bookedAppointmentsForSlot.length === 0;

                    return isSlotAvailable;
                });

                // Log the final filtered time slots

                // Return a new appointment object with an updated weeklySchedule
                // that only contains the selected day's schedule and its filtered time slots.
                return {
                    ...appointment,
                    weeklySchedule: {
                        [selectedDateDay]: {
                            ...scheduleForSelectedDay,
                            timeSlots: filteredTimeSlots,
                        },
                    },
                };
            });

            setFilteredAppointments(updatedAppointments);
        };

        handleDateChange(selectedDate);
    }, [selectedDate, appointments, bookedAppointments]);

    const formatDate = (dateString: string) => {
        const malaysiaOffset = 8 * 60 * 60 * 1000;
        const now = new Date();
        const malaysiaTime = new Date(now.getTime() + malaysiaOffset);
        const createdAt = new Date(dateString);

        const diffInMs = malaysiaTime.getTime() - createdAt.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) {
            return "just now";
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
        } else if (diffInHours < 24) {
            const remainingMinutes = diffInMinutes % 60;
            if (remainingMinutes === 0) {
                return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
            } else {
                return `${diffInHours}h ${remainingMinutes}m ago`;
            }
        } else if (diffInDays < 7) {
            return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
        } else {
            return createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }
    };

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        setPasswordErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "phone") {
            const numbersOnly = value.replace(/[^\d]/g, "");
            const formattedPhone = numbersOnly.startsWith("60") ? numbersOnly : `60${numbersOnly}`;

            setEditedUser((prev) => ({
                ...prev,
                [name]: formattedPhone,
            }));
        } else {
            setEditedUser((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setShowProfileMenu(false);
    };

    const handleCancelClick = () => {
        setEditedUser({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
        });

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setFormErrors({
            firstName: "",
            lastName: "",
            phone: "",
        });
        setPasswordErrors({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setIsProfileModalOpen(false);
    };

    const handleSaveChanges = async () => {
        setFormErrors({
            firstName: "",
            lastName: "",
            phone: "",
        });

        let hasErrors = false;
        const newErrors = {
            firstName: "",
            lastName: "",
            phone: "",
        };

        if (!editedUser.firstName.trim()) {
            newErrors.firstName = "First name is required";
            hasErrors = true;
        }

        if (!editedUser.lastName.trim()) {
            newErrors.lastName = "Last name is required";
            hasErrors = true;
        }

        const phoneWithoutPrefix = String(editedUser.phone).startsWith("60") ? String(editedUser.phone).slice(2) : String(editedUser.phone);

        if (!phoneWithoutPrefix || phoneWithoutPrefix.length < 9 || phoneWithoutPrefix.length > 10) {
            newErrors.phone = "Phone number must be between 9 and 10 digits";
            hasErrors = true;
        }

        if (hasErrors) {
            setFormErrors(newErrors);
            return;
        }

        try {
            const response = await axios.put("/api/users/profile", editedUser);
            if (response.data.success) {
                setUser(editedUser);
                setIsProfileModalOpen(false);
                setProfileSuccessMessage(true);

                setTimeout(() => {
                    setProfileSuccessMessage(false);
                }, 3000);
            }
        } catch (error: any) {
            console.error("Error updating profile:", error);
            alert(error.response?.data?.error || "Failed to update profile. Please try again.");
        }
    };

    const handleNotificationClick = async (notification: NotificationData) => {
        try {
            if (!notification.isRead) {
                const response = await axios.put("/api/notifications/read", {
                    notificationId: notification._id,
                });

                if (response.data.success) {
                    setNotifications((prevNotifications) => prevNotifications.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
                    setNotificationCount((prev) => Math.max(0, prev - 1));
                }
            }

            setSelectedNotification(notification);
            setIsNotificationModalOpen(true);
        } catch (error) {
            console.error("Error updating notification read status:", error);
        }
    };

    const handleCloseModal = () => {
        setSelectedNotification(null);
        setIsNotificationModalOpen(false);
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            <NavBar onProfileClick={handleProfileClick} onNotificationClick={handleNotificationClick} />
            <SessionOut />

            {/* Return Section */}
            <div className="text-white py-4 px-8">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-pink-600)"
                    className="lucide lucide-undo2-icon lucide-undo-2 hover:scale-110 transition-transform duration-200 hover:stroke-pink-700 hover:cursor-pointer stroke-2"
                    onClick={() => router.push("/dashboard/ourteams")}
                >
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                </svg>
            </div>

            {/* Doctor Details Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-500">
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">Doctor Information</h2>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-6 mb-6">
                        <img src={doctor?.image} alt="Doctor Image" className="w-32 h-32 object-cover rounded-full" />
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doctor?.name}</h3>
                            <p className="text-gray-600">{doctor?.specialization}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <p>
                            <strong>Email:</strong> {doctor?.email}
                        </p>
                        <p>
                            <strong>Phone:</strong> {doctor?.phone}
                        </p>
                        <p>
                            <strong>Operating Hours:</strong> {doctor?.operatingHours}
                        </p>
                        <p>
                            <strong>Bio:</strong> {doctor?.bio}
                        </p>
                    </div>
                </div>
            </div>

            {/* Appointment Details Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-500">
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">Appointments</h2>
                {/* Calendar to select a date */}
                <div className="mb-6">
                    <label htmlFor="appointment-date" className="block text-lg font-medium text-gray-800 mb-2">
                        Select a Date
                    </label>
                    <input
                        type="date"
                        id="appointment-date"
                        className="border border-gray-300 rounded-md p-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                {filteredAppointments?.length === 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                        <h3 className="px-4 py-2 text-left text-gray-600">No appointments available</h3>
                    </div>
                )}

                {selectedDate != "" &&
                    filteredAppointments?.length !== 0 &&
                    filteredAppointments?.map((appointment: any) => (
                        <div key={appointment._id} className="bg-white p-6 rounded-lg shadow-lg mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Date</h3>
                            <p>
                                {new Date(selectedDate).toLocaleString("en-US", { weekday: "long" })} -{" "}
                                {new Date(selectedDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                            <div className="mt-6">
                                <h4 className="text-lg font-medium text-gray-800 mb-4">Weekly Schedule</h4>
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-center text-gray-600">Time Slots</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(appointment.weeklySchedule).map((day) => {
                                            const schedule = appointment.weeklySchedule[day];
                                            return schedule.isAvailable && schedule.timeSlots.length > 0 ? (
                                                <tr key={schedule._id}>
                                                    <td className="px-4 py-2 ">
                                                        {schedule.timeSlots.map((slot: any) => (
                                                            <div
                                                                key={slot._id}
                                                                className={`inline-block lg:w-1/6 md:w-1/4 sm:1/3 p-1 m-1 border rounded-md text-center cursor-pointer ${
                                                                    selectedSlots[doctor ? doctor._id : window.location.pathname.split("/")[2]] === slot._id
                                                                        ? "bg-pink-600 text-white"
                                                                        : ""
                                                                }`}
                                                                onClick={() => {
                                                                    const slotId = slot._id;
                                                                    const isSelected = selectedSlots[doctor ? doctor._id : window.location.pathname.split("/")[2]] === slotId;
                                                                    if (!isSelected) {
                                                                        setSelectedSlots((prev) => ({
                                                                            ...prev,
                                                                            [doctor ? doctor._id : window.location.pathname.split("/")[2]]: slotId,
                                                                        }));
                                                                    } else {
                                                                        setSelectedSlots((prev) => {
                                                                            const updatedSlots = { ...prev };
                                                                            delete updatedSlots[doctor ? doctor._id : window.location.pathname.split("/")[2]];
                                                                            return updatedSlots;
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                {slot.startTime} - {slot.endTime}
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ) : null;
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6">
                                <h4 className="text-lg font-medium text-gray-800 mb-4">Appointment Type</h4>
                                <div className="flex gap-4">
                                    <button
                                        className={`px-4 py-2 rounded-md ${
                                            selectedAppointmentType === "Consultation" ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        } transition-colors`}
                                        onClick={() => setSelectedAppointmentType("Consultation")}
                                    >
                                        Consultation
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-md ${
                                            selectedAppointmentType === "Follow-up" ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        } transition-colors`}
                                        onClick={() => setSelectedAppointmentType("Follow-up")}
                                    >
                                        Follow-up
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Submit Button */}
            {selectedDate != "" && filteredAppointments?.length !== 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 text-white bg-pink-600 rounded-full hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                        Submit Appointment
                    </button>
                </div>
            )}

            {isProfileModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl w-full max-w-2xl border border-gray-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Account</h2>
                                    <p className="text-gray-600 mt-1">Set your account settings down below</p>
                                </div>
                                <button onClick={handleCancelClick} className="text-gray-400 hover:text-gray-500 transition-colors">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={() => setActiveProfileTab("profile")}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeProfileTab === "profile" ? "bg-gray-100 text-pink-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => setActiveProfileTab("password")}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeProfileTab === "password" ? "bg-gray-100 text-pink-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    Password
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {activeProfileTab === "profile" ? (
                                <div className="space-y-6">
                                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{error}</div>}
                                    {isLoading ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                                            <p className="mt-2 text-gray-600">Loading profile...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={editedUser.firstName}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        formErrors.firstName ? "border-red-500" : "border-gray-300"
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {formErrors.firstName && <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={editedUser.lastName}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        formErrors.lastName ? "border-red-500" : "border-gray-300"
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {formErrors.lastName && <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">+60</div>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={String(editedUser.phone).startsWith("60") ? String(editedUser.phone).slice(2) : String(editedUser.phone)}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-12 pr-3 py-2 border ${
                                                            formErrors.phone ? "border-red-500" : "border-gray-300"
                                                        } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                        placeholder="1123456789"
                                                        minLength={9}
                                                        maxLength={10}
                                                        pattern="[0-9]*"
                                                    />
                                                    {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
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
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={passwordForm.currentPassword}
                                                    onChange={handlePasswordInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        passwordErrors.currentPassword ? "border-red-500" : "border-gray-300"
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    name="newPassword"
                                                    value={passwordForm.newPassword}
                                                    onChange={handlePasswordInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        passwordErrors.newPassword ? "border-red-500" : "border-gray-300"
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={handlePasswordInputChange}
                                                    className={`w-full px-3 py-2 border ${
                                                        passwordErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                                                    } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                />
                                                {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50/95 backdrop-blur-sm rounded-b-lg flex justify-end space-x-3">
                            <button
                                onClick={handleSaveChanges}
                                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isNotificationModalOpen && selectedNotification && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Appointment {selectedNotification.status.charAt(0).toUpperCase() + selectedNotification.status.slice(1)}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500 transition-colors">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center space-x-2 mb-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                selectedNotification.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {selectedNotification.status.charAt(0).toUpperCase() + selectedNotification.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <FaCalendar className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Date</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(selectedNotification.appointmentDate).toLocaleDateString("en-US", {
                                                        weekday: "long",
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <FaClock className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Time</p>
                                                <p className="text-sm text-gray-500">{formatTime(selectedNotification.appointmentTime)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <FaRegBell className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Notification Received</p>
                                                <p className="text-sm text-gray-500">{formatDate(selectedNotification.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
                            {selectedNotification.status === "rescheduled" ? (
                                <button
                                    onClick={() => {
                                        handleCloseModal();
                                        if (selectedNotification.doctorId) {
                                            router.push(`/appointment/${selectedNotification.doctorId}`);
                                        } else {
                                            console.error("Doctor ID not found in notification data");
                                            alert("Error finding doctor information. Please try again.");
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    Book Again
                                </button>
                            ) : (
                                <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

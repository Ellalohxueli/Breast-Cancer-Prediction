"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DevToken, StreamChat, Channel, DefaultGenerics } from "stream-chat";
import { Button } from "@/components/ui/button";
import { generateUsername } from "unique-username-generator";
import useCheckCookies from "@/controller/UseCheckCookie";
import { Poppins } from "next/font/google";
import NavBar from "@/components/UserNavBar";
import { Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import LiveChat from "@/components/LiveChat";
import { set } from "mongoose";
import axios from "axios";
import { FaRegBell, FaRegUser, FaCalendar, FaClock, FaStar } from "react-icons/fa";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

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

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
};

export default function DoctorChat() {
    const router = useRouter();
    const { doctorId } = useParams();
    const [channel, setChannel] = useState<Channel<DefaultGenerics> | null>(null);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [messageText, setMessageText] = useState("");
    const [userRole, setUserRole] = useState<"doctor" | "user">("user");
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

    const [selectedAppointmentType, setSelectedAppointmentType] = useState<"Consultation" | "Follow-up">("Consultation");
    const [activeProfileTab, setActiveProfileTab] = useState<"profile" | "password">("profile");
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
    const [error, setError] = useState<string | null>(null);
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
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
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

    useCheckCookies();

    useEffect(() => {
        const storedUserType = localStorage.getItem("userType");

        if (storedUserType === "doctor" || storedUserType === "user") {
            setUserRole(storedUserType as "doctor" | "user");
        }

        async function fetchAppointmentData() {
            toast.dismiss();

            try {
                const response = await fetch(`/api/users/appointment/${window.location.pathname.split("/")[2]}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch appointment data");
                }
                const data = await response.json();

                if (!data.doctor) {
                    toast.error("Doctor not found");
                    router.push("/dashboard/ourteams");
                }

                setDoctor(data.doctor);
                setIsLoading(false);
            } catch (error: any) {
                toast.error("Somthing went wrong, please try again later");
                router.push("/dashboard/ourteams");
            }
        }

        fetchAppointmentData();
    }, []);

    const doctorIdString = Array.isArray(doctorId) ? doctorId[0] : doctorId;

    const loadChatClient = async () => {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

        if (!apiKey) {
            throw new Error("Stream API key is missing");
        }

        const newChatClient = new StreamChat(apiKey, {
            enableWSFallback: true,
        });

        const userId = localStorage.getItem("userId");
        const localUser = localStorage.getItem("firstname");
        const id = (localUser || generateUsername()) + "_User";
        const userToConnect = {
            id,
            userId: userId,
            doctorId: doctorIdString,
            role: userRole,
        };

        try {
            await newChatClient.connectUser(userToConnect, DevToken(userToConnect.id));
        } catch (error) {
            toast.error("Error connecting user to chat client");
        }

        const channelId = doctorIdString + "-" + userId;

        const channelInstance = newChatClient.channel("messaging", channelId, {
            isDoctorRead: false,
            isUserRead: true,
        });

        try {
            await channelInstance.watch();
            setChannel(channelInstance);
        } catch (error) {
            toast.error("Error joining the channel");
        }

        setChatClient(newChatClient);
    };

    useEffect(() => {
        if (doctorIdString) {
            loadChatClient();
        }
    }, [doctorIdString]);

    const handleDelete = async () => {
        setIsLoading(true);

        toast.dismiss();

        try {
            if (channel) {
                await channel.delete();

                toast.success("Channel deleted successfully");

                router.push("/dashboard/ourteams");
            } else {
                toast.error("Channel not found");
            }
        } catch (error) {
            toast.error("Error deleting the channel");
        }
    };

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

            <div className="flex h-full p-15 gap-20">
                {/* Left Section - Doctor Details */}
                <div className="flex flex-col w-2/4 bg-white p-4 border rounded-md shadow-md h-full">
                    <div className="flex items-center space-x-6 mb-6">
                        <img src={doctor?.image} alt="Doctor Image" className="w-32 h-32 object-cover rounded-full" />
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doctor?.name}</h3>
                            <p className="text-gray-600">{doctor?.specialization}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <p>
                            <strong>Email:</strong>
                            <br />
                            {doctor?.email}
                        </p>
                        <p>
                            <strong>Phone:</strong>
                            <br />
                            {doctor?.phone}
                        </p>
                        <p>
                            <strong>Operating Hours:</strong>
                            <br />
                            {doctor?.operatingHours}
                        </p>
                        <p>
                            <strong>Bio:</strong>
                            <br />
                            {doctor?.bio}
                        </p>
                    </div>

                    <div className="flex justify-center mt-6">
                        <Button onClick={() => router.push(`/appointment/${doctor?._id}`)} className="bg-pink-600 text-white hover:bg-pink-700">
                            View Appointments
                        </Button>
                    </div>
                </div>

                {/* Right Section - Chat */}
                <div className="flex flex-col w-2/4 h-[80vh] bg-white p-5 border rounded-md shadow-md">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <div className="flex items-center space-x-4">
                                <img src={doctor?.image} alt="Doctor Image" className="w-12 h-12 object-cover rounded-full" />
                                <h3 className="text-lg font-semibold text-gray-900">{doctor?.name}</h3>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button variant="outline" onClick={handleDelete} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                    <Trash2 height={60} />
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        router.push("/dashboard/ourteams");
                                    }}
                                    className="bg-red-500 text-white hover:bg-red-600"
                                >
                                    <X height={60} />
                                </Button>
                            </div>
                        </div>

                        {!isLoading && doctor && channel && chatClient && (
                            <LiveChat channel={channel} chatClient={chatClient} userRole={"user"} messageText={messageText} setMessageText={setMessageText} />
                        )}
                    </div>
                </div>
            </div>

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

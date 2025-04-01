"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { FaRegBell, FaRegUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaUsers, FaComments, FaCalendar, FaClock } from "react-icons/fa";
import { BiMessageRounded } from "react-icons/bi";
import Link from "next/link";
import useCheckCookies from "@/controller/UseCheckCookie";
import axios from "axios";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

interface Event {
    _id: string;
    title: string;
    category: string;
    eventCategory: "support group" | "workshop" | "seminar";
    eventDate: string;
    eventTime: string;
    shortDescription: string;
    status: string;
}

interface Resource {
    _id: string;
    title: string;
    content: string;
    category: string;
    featuredImage?: string;
    publishDate: string;
    seoMetadata: {
        title: string;
        description: string;
        keywords: string;
    };
}

type NotificationData = {
    _id: string;
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    appointmentDay: string;
    appointmentTime: string;
    status: 'cancelled' | 'rescheduled';
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

function formatTime(time: string): string {
    // Handle empty or invalid time
    if (!time) return "";

    try {
        // Split the time into hours and minutes
        const [hours, minutes] = time.split(":").map(Number);

        // Convert to 12-hour format
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

        // Format the time string
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
        console.error("Error formatting time:", error);
        return time; // Return original time if there's an error
    }
}

export default function ResourcesPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [resourceTab, setResourceTab] = useState("All Resources");
    const [showAllEventsModal, setShowAllEventsModal] = useState(false);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoadingResources, setIsLoadingResources] = useState(true);
    const [resourceError, setResourceError] = useState<string | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewResource, setPreviewResource] = useState<Resource | null>(null);
    const [showAllResources, setShowAllResources] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [user, setUser] = useState({ 
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [editedUser, setEditedUser] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [formErrors, setFormErrors] = useState({
        firstName: '',
        lastName: '',
        phone: ''
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
    const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    useCheckCookies();

    const handleLogout = async () => {
        try {
            const response = await axios.get("/api/users/logout");
            localStorage.removeItem("firstname");
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleProfileIconClick = () => {
        setShowProfileMenu(!showProfileMenu);
    };

    useEffect(() => {
        fetchEvents();
        fetchAllEvents();
        fetchResources(resourceTab);
    }, []);

    useEffect(() => {
        fetchResources(resourceTab);
    }, [resourceTab]);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/users/resources?showAll=false");
            const data = await response.json();

            if (data.success) {
                setEvents(data.events);
            } else {
                setError(data.error || "Failed to fetch events");
                console.error("Failed to fetch events:", data.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An error occurred";
            setError(errorMessage);
            console.error("Error fetching events:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllEvents = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/users/resources?showAll=true"); // Changed from limit=-1 to showAll=true
            const data = await response.json();

            if (data.success) {
                setAllEvents(data.events);
            }
        } catch (error) {
            console.error("Error fetching all events:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchResources = async (category?: string) => {
        try {
            setIsLoadingResources(true);
            setResourceError(null);

            let url = "/api/users/resources";
            if (category) {
                url += `?category=${encodeURIComponent(category)}`;
            }

            console.log("Fetching resources from:", url);

            const response = await fetch(url);
            const data = await response.json();

            console.log("Resource response:", data);

            if (data.success) {
                // Sort resources by publishDate in descending order
                const sortedResources = (data.resources || []).sort((a: Resource, b: Resource) => {
                    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                });
                setResources(sortedResources);
            } else {
                setResourceError(data.error || "Failed to fetch resources");
            }
        } catch (error) {
            setResourceError("Failed to fetch resources");
            console.error("Error fetching resources:", error);
        } finally {
            setIsLoadingResources(false);
        }
    };

    const displayedResources = showAllResources ? resources : resources.slice(0, 3);

    const EventCard = ({ event }: { event: Event }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
                <span
                    className={`${
                        event.eventCategory === "support group"
                            ? "bg-pink-100 text-pink-600"
                            : event.eventCategory === "workshop"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-purple-100 text-purple-600"
                    } px-3 py-1 rounded-full text-sm font-medium capitalize`}
                >
                    {event.eventCategory}
                </span>
                <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{new Date(event.eventDate).getDate()}</div>
                    <div className="text-sm text-gray-500 uppercase">{new Date(event.eventDate).toLocaleString("default", { month: "short" })}</div>
                </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
            <p className="text-gray-600 mb-4">{event.shortDescription}</p>
            <div className="text-sm text-gray-500">
                <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(event.eventTime)}
                </div>
            </div>
        </div>
    );

    const ResourceCard = ({ resource }: { resource: Resource }) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {resource.featuredImage && (
                <div className="mb-4">
                    <Image
                        src={resource.featuredImage}
                        alt={resource.seoMetadata?.title || resource.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                    />
                </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{resource.seoMetadata?.title || resource.title}</h3>
            <p className="text-gray-600 mb-4">
                {resource.seoMetadata?.description
                    ? resource.seoMetadata.description.length > 150
                        ? `${resource.seoMetadata.description.substring(0, 150)}...`
                        : resource.seoMetadata.description
                    : resource.content.length > 150
                    ? `${resource.content.substring(0, 150)}...`
                    : resource.content}
            </p>
            <button
                onClick={() => {
                    setPreviewResource(resource);
                    setIsPreviewModalOpen(true);
                }}
                className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center"
            >
                Read More
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );

    const PreviewModal = ({ resource, onClose }: { resource: Resource; onClose: () => void }) => (
        <>
            {/* Backdrop with blur effect */}
            <div className="fixed inset-0 z-40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
                    {/* Modal Header */}
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">{resource.title}</h1>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Featured Image */}
                    {resource.featuredImage && (
                        <div className="relative h-[300px]">
                            <Image src={resource.featuredImage} alt={resource.title} fill className="object-cover" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        <div className="prose max-w-none">
                            <div
                                className="text-gray-700"
                                dangerouslySetInnerHTML={{
                                    __html: (resource.content || "")
                                        .replace(/\n/g, "<br>")
                                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                        .replace(/^• (.*)$/gm, "<li>$1</li>")
                                        .replace(/^\d+\. (.*)$/gm, "<li>$1</li>")
                                        .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>"),
                                }}
                            />
                        </div>
                    </div>

                    {/* Footer with Category and Date */}
                    <div className="p-6 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full">{resource.category}</span>
                            <span>Published on {new Date(resource.publishDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setShowProfileMenu(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            const numbersOnly = value.replace(/[^\d]/g, '');
            const formattedPhone = numbersOnly.startsWith('60') 
                ? numbersOnly 
                : `60${numbersOnly}`;
            
            setEditedUser(prev => ({
                ...prev,
                [name]: formattedPhone
            }));
        } else {
            setEditedUser(prev => ({
                ...prev,
                [name]: value
            }));
        }
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

    const handleSaveChanges = async () => {
        setFormErrors({
            firstName: '',
            lastName: '',
            phone: ''
        });

        let hasErrors = false;
        const newErrors = {
            firstName: '',
            lastName: '',
            phone: ''
        };

        if (!editedUser.firstName.trim()) {
            newErrors.firstName = 'First name is required';
            hasErrors = true;
        }

        if (!editedUser.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
            hasErrors = true;
        }

        const phoneWithoutPrefix = String(editedUser.phone).startsWith('60') 
            ? String(editedUser.phone).slice(2) 
            : String(editedUser.phone);

        if (!phoneWithoutPrefix || phoneWithoutPrefix.length < 9 || phoneWithoutPrefix.length > 10) {
            newErrors.phone = 'Phone number must be between 9 and 10 digits';
            hasErrors = true;
        }

        if (hasErrors) {
            setFormErrors(newErrors);
            return;
        }

        try {
            const response = await axios.put('/api/users/profile', editedUser);
            if (response.data.success) {
                setUser(editedUser);
                setIsProfileModalOpen(false);
                setProfileSuccessMessage(true);
                
                setTimeout(() => {
                    setProfileSuccessMessage(false);
                }, 3000);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.error || 'Failed to update profile. Please try again.');
        }
    };

    const handlePasswordChange = async () => {
        setPasswordErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });

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
            const response = await axios.put('/api/users/password', passwordForm);
            if (response.data.success) {
                setIsProfileModalOpen(false);
                setProfileSuccessMessage(true);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                
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

    const handleCancelClick = () => {
        // Reset profile form
        setEditedUser({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
        });
        
        // Reset password form
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        // Clear all errors
        setFormErrors({
            firstName: '',
            lastName: '',
            phone: ''
        });
        setPasswordErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        // Close modal
        setIsProfileModalOpen(false);
    };

    const handleAllEventsModalClose = () => {
        setShowAllEventsModal(false);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (isProfileModalOpen) {
                try {
                    const response = await axios.get('/api/users/profile');
                    if (response.data.success) {
                        setUser(response.data.user);
                        setEditedUser(response.data.user);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();
    }, [isProfileModalOpen]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() &&
                            date.getMonth() === yesterday.getMonth() &&
                            date.getFullYear() === yesterday.getFullYear();
        if (isToday) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            return `Today at ${formattedHours}:${formattedMinutes} ${ampm}`;
        } else if (isYesterday) {
            return 'Yesterday';
        } else {
            const options: Intl.DateTimeFormatOptions = {
                month: 'short',
                day: 'numeric'
            };
            if (date.getFullYear() !== today.getFullYear()) {
                options.year = 'numeric';
            }
            return date.toLocaleDateString('en-US', options);
        }
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            if (isDropdownOpen) {
                setIsLoadingNotifications(true);
                setNotificationError(null);
                try {
                    const response = await axios.get('/api/notifications');
                    if (response.data.success) {
                        setNotifications(response.data.notifications);
                        const unreadCount = response.data.notifications.filter(
                            (n: NotificationData) => !n.isRead
                        ).length;
                        setNotificationCount(unreadCount);
                    }
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                    setNotificationError('Failed to load notifications');
                } finally {
                    setIsLoadingNotifications(false);
                }
            }
        };

        fetchNotifications();
    }, [isDropdownOpen]);

    const handleNotificationClick = async (notification: NotificationData) => {
        try {
            if (!notification.isRead) {
                const response = await axios.put('/api/notifications/read', {
                    notificationId: notification._id
                });

                if (response.data.success) {
                    setNotifications(prevNotifications => 
                        prevNotifications.map(n => 
                            n._id === notification._id 
                                ? { ...n, isRead: true }
                                : n
                        )
                    );
                    setNotificationCount(prev => Math.max(0, prev - 1));
                }
            }

            setSelectedNotification(notification);
            setIsNotificationModalOpen(true);
        } catch (error) {
            console.error('Error updating notification read status:', error);
        }
    };

    const handleCloseModal = () => {
        setSelectedNotification(null);
        setIsNotificationModalOpen(false);
    };

    return (
        <div id="top" className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            {/* Header */}
            <div className="w-full bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Image src="/logo.png" alt="Breast Cancer Detection Logo" width={50} height={50} className="w-auto h-auto" />
                        </div>

                        <nav className="flex-1">
                            <ul className="flex items-center justify-end space-x-6">
                                <li>
                                    <Link href="/dashboard" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/services" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Services
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/ourteams" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Our Team
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/resources" className="text-pink-600 hover:text-pink-600 font-medium">
                                        Patient Resources
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/appointments" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Appointments
                                    </Link>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-600 hover:text-pink-600 relative">
                                        <div className="relative">
                                            <BiMessageRounded className="h-6 w-6" />
                                            {messageCount > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                    {messageCount}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                                            className="text-gray-600 hover:text-pink-600 relative p-2 rounded-full hover:bg-gray-100"
                                        >
                                            <FaRegBell className="h-6 w-6" aria-label="Notifications" />
                                            {notificationCount > 0 && (
                                                <span className="absolute top-0 right-0 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                                                    {notificationCount}
                                                </span>
                                            )}
                                        </button>

                                        {isDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                                <div className="px-4 py-2 border-b border-gray-200">
                                                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                                </div>
                                                
                                                <div className="max-h-96 overflow-y-auto">
                                                    {isLoadingNotifications ? (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto"></div>
                                                            <p className="mt-2">Loading notifications...</p>
                                                        </div>
                                                    ) : notificationError ? (
                                                        <div className="px-4 py-3 text-sm text-red-500">
                                                            {notificationError}
                                                        </div>
                                                    ) : notifications.length > 0 ? (
                                                        notifications.map((notification) => (
                                                            <div 
                                                                key={notification._id} 
                                                                className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                                                                    !notification.isRead ? 'bg-pink-50' : ''
                                                                } cursor-pointer`}
                                                                onClick={() => handleNotificationClick(notification)}
                                                            >
                                                                <div className="flex items-start">
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            Appointment {notification.status}
                                                                        </p>
                                                                        <p className="text-xs text-gray-600 mt-1">
                                                                            {notification.appointmentDay}, {new Date(notification.appointmentDate).toLocaleDateString('en-US', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            })} at {formatTime(notification.appointmentTime)}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-2">
                                                                            {formatDate(notification.createdAt)}
                                                                        </p>
                                                                    </div>
                                                                    {!notification.isRead && (
                                                                        <span className="h-2 w-2 bg-pink-500 rounded-full mt-1"></span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                            No notifications
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </li>
                                <li className="relative">
                                    <button 
                                        className="text-gray-600 hover:text-pink-600 focus:outline-none p-2 rounded-full hover:bg-gray-100"
                                        onClick={handleProfileIconClick}
                                    >
                                        <FaRegUser className="h-6 w-6" aria-label="Profile" />
                                    </button>
                                    
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                            <button
                                                onClick={handleProfileClick}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <FaRegUser className="h-4 w-4 mr-3" />
                                                Profile
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                    />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </li>
                                <li>
                                    <a
                                        href="/dashboard/ourteams" 
                                        className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                    >
                                        Schedule Appointment
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-pink-50 to-white pt-12 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-6">Patient Resources & Support</h1>
                        <p className="text-lg text-gray-700 max-w-4xl">
                            Access conprehensive resources, support materials, and educational content to help you better understand and manage your breast cancer journey. Our
                            dedicated team is here to support you every step of the way.
                        </p>
                    </div>
                </div>
            </div>

            {/* Resources Content */}
            <div className="bg-white pt-5 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Resource Tabs */}
                    <div className="mb-8">
                        <div className="flex space-x-4">
                            {["All Resources", "Tips & Guides", "Latest News & Articles"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setResourceTab(tab)}
                                    className={`px-4 py-2 rounded-md transition-colors ${resourceTab === tab ? "bg-pink-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resource Cards */}
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {isLoadingResources ? (
                                <div className="col-span-3 text-center py-8">
                                    <div className="text-gray-600">Loading resources...</div>
                                </div>
                            ) : resourceError ? (
                                <div className="col-span-3 text-center py-8">
                                    <div className="text-red-600">{resourceError}</div>
                                </div>
                            ) : displayedResources.length > 0 ? (
                                displayedResources.map((resource) => <ResourceCard key={resource._id} resource={resource} />)
                            ) : (
                                <div className="col-span-3 text-center py-8">
                                    <div className="text-gray-600">No resources found</div>
                                </div>
                            )}
                        </div>

                        {/* View More Button - Only show if there are more than 3 resources */}
                        {!isLoadingResources && !resourceError && resources.length > 3 && (
                            <div className="text-center">
                                <button
                                    onClick={() => setShowAllResources(!showAllResources)}
                                    className="inline-flex items-center px-6 py-3 border-2 border-pink-600 text-pink-600 font-medium rounded-md hover:bg-pink-50 transition-colors"
                                >
                                    {showAllResources ? (
                                        <>
                                            Show Less
                                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </>
                                    ) : (
                                        <>
                                            View More
                                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upcoming Events & Support Groups Section */}
            <div className="pt-12 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Upcoming Events & Support Groups</h2>
                        <button onClick={() => setShowAllEventsModal(true)} className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center">
                            View All
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            <div className="col-span-3 text-center py-8">
                                <div className="text-gray-600">Loading events...</div>
                            </div>
                        ) : error ? (
                            <div className="col-span-3 text-center py-8">
                                <div className="text-red-600">{error}</div>
                            </div>
                        ) : events.length > 0 ? (
                            events.map((event) => <EventCard key={event._id} event={event} />)
                        ) : (
                            <div className="col-span-3 text-center py-8">
                                <div className="text-gray-600">No upcoming events found</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* All Events Modal */}
            {showAllEventsModal && (
                <>
                    {/* Backdrop with blur effect */}
                    <div className="fixed inset-0 z-40 backdrop-blur-sm" onClick={handleAllEventsModalClose} />

                    {/* Modal content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg w-full max-w-[90%] h-[85vh] shadow-xl flex flex-col">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-2xl font-bold text-gray-900">All Upcoming Events</h3>
                                <button 
                                    onClick={handleAllEventsModalClose}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body - Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-600">Loading events...</div>
                                    </div>
                                ) : allEvents.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {allEvents.map((event) => (
                                            <EventCard key={event._id} event={event} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-600">No upcoming events found</div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-200 flex-shrink-0">
                                <button
                                    onClick={handleAllEventsModalClose}
                                    className="w-full md:w-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Preview Modal */}
            {isPreviewModalOpen && previewResource && (
                <PreviewModal
                    resource={previewResource}
                    onClose={() => {
                        setIsPreviewModalOpen(false);
                        setPreviewResource(null);
                    }}
                />
            )}

            {/* Call-to-Action Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-pink-50 rounded-2xl p-8 md:p-12">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h2>
                            <p className="text-lg text-gray-700 mb-8">Our care team is able to answer your questions and provide support. Don't hesitate to reach out.</p>
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                <div className="w-full md:w-auto">
                                    <div className="inline-flex items-center justify-center px-6 py-3 border-2 border-pink-600 text-pink-600 font-medium rounded-md hover:bg-pink-50 transition-colors">
                                        <FaPhone className="h-5 w-5 mr-2" />
                                        +60 3-1234 5678
                                    </div>
                                </div>
                                <div className="w-full md:w-auto">
                                    <button 
                                        onClick={() => router.push('/dashboard/ourteams')}
                                        className="w-full md:w-auto px-8 py-3 bg-pink-600 text-white font-medium rounded-md hover:bg-pink-700 transition-colors"
                                    >
                                        Schedule Appointment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 pt-8 pb-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-5">
                    <Image src="/pink-ribbon.png" alt="" width={300} height={300} className="object-contain" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                        {/* Contact Information */}
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <FaMapMarkerAlt className="text-pink-500 mt-1" />
                                    <p>
                                        123 Medical Center Drive
                                        <br />
                                        Kuala Lumpur, 50450
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <FaPhone className="text-pink-500" />
                                    <p>+60 3-1234 5678</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <FaEnvelope className="text-pink-500" />
                                    <p>info@pinkpath.com</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/dashboard" className="hover:text-pink-500 transition-colors">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/services" className="hover:text-pink-500 transition-colors">
                                        Our Services
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/resources" className="hover:text-pink-500 transition-colors">
                                        Patient Resources
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Working Hours */}
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-4">Working Hours</h3>
                            <ul className="space-y-2">
                                <li className="flex justify-between">
                                    <span>Monday - Friday:</span>
                                    <span>8:00 AM - 7:00 PM</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Saturday:</span>
                                    <span>8:00 AM - 2:00 PM</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Sunday:</span>
                                    <span>Closed</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-800 pt-4">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-sm mb-4 md:mb-0">© 2024 PinkPath Breast Cancer Care Center. All rights reserved.</p>
                            <div className="flex space-x-4">
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaFacebookF className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaTwitter className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaInstagram className="w-5 h-5" />
                                </a>
                                <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors">
                                    <FaLinkedinIn className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl w-full max-w-2xl border border-gray-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Account</h2>
                                    <p className="text-gray-600 mt-1">
                                        Set your account settings down below
                                    </p>
                                </div>
                                <button 
                                    onClick={handleCancelClick}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === 'profile'
                                            ? 'bg-gray-100 text-pink-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('password')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === 'password'
                                            ? 'bg-gray-100 text-pink-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Password
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {activeTab === 'profile' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={editedUser.firstName}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border ${
                                                formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                                            } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                        />
                                        {formErrors.firstName && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={editedUser.lastName}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border ${
                                                formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                                            } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                        />
                                        {formErrors.lastName && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                                                +60
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={String(editedUser.phone).startsWith('60') 
                                                    ? String(editedUser.phone).slice(2) 
                                                    : String(editedUser.phone)}
                                                onChange={handleInputChange}
                                                className={`w-full pl-12 pr-3 py-2 border ${
                                                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                                                } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
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
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordForm.currentPassword}
                                            onChange={handlePasswordInputChange}
                                            className={`w-full px-3 py-2 border ${
                                                passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                                            } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                        />
                                        {passwordErrors.currentPassword && (
                                            <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordForm.newPassword}
                                            onChange={handlePasswordInputChange}
                                            className={`w-full px-3 py-2 border ${
                                                passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                            } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                        />
                                        {passwordErrors.newPassword && (
                                            <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordForm.confirmPassword}
                                            onChange={handlePasswordInputChange}
                                            className={`w-full px-3 py-2 border ${
                                                passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                            } rounded-md text-black focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                        />
                                        {passwordErrors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50/95 backdrop-blur-sm rounded-b-lg flex justify-end space-x-3">
                            <button
                                onClick={handleCancelClick}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            {activeTab === 'profile' ? (
                                <button
                                    onClick={handleSaveChanges}
                                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                                >
                                    Save Changes
                                </button>
                            ) : (
                                <button
                                    onClick={handlePasswordChange}
                                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                                >
                                    Change Password
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {profileSuccessMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {activeTab === 'profile' ? 'Profile updated successfully!' : 'Password changed successfully!'}
                </div>
            )}

            {/* Notification Modal */}
            {isNotificationModalOpen && selectedNotification && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Appointment {selectedNotification.status.charAt(0).toUpperCase() + selectedNotification.status.slice(1)}
                                </h3>
                                <button 
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            selectedNotification.status === 'cancelled' 
                                                ? 'bg-red-100 text-red-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {selectedNotification.status.charAt(0).toUpperCase() + selectedNotification.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <FaCalendar className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Date</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(selectedNotification.appointmentDate).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
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
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

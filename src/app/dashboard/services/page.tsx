'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { BiMessageRounded } from 'react-icons/bi';
import { FaRegBell, FaRegUser, FaUserMd, FaHandHoldingMedical, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaXRay, FaStethoscope, FaMicroscope, FaVial, FaNotesMedical, FaFirstAid, FaPrescription, FaHeartbeat, FaHospital, FaHandHolding, FaComments, FaUsers, FaUserNurse, FaShieldAlt, FaChartLine, FaClinicMedical, FaHospitalUser, FaCalendar, FaClock } from 'react-icons/fa';
import { TbStethoscope, TbReportMedical, TbMicroscope, TbHeartRateMonitor, TbActivity, TbBrain, TbDna2, TbMedicineSyrup, TbPill, TbVaccine, TbHeartPlus, TbNurse } from 'react-icons/tb';
import { GiMicroscope, GiMedicalDrip, GiMedicines, GiHealthNormal, GiHealing } from 'react-icons/gi';
import { RiMentalHealthLine } from 'react-icons/ri';
import { IoMdPulse } from 'react-icons/io';
import { FiSearch } from 'react-icons/fi';
import useCheckCookies from '@/controller/UseCheckCookie';
import axios from 'axios';
import NavBar from '@/components/UserNavBar';
import SessionOut from '@/components/SessionOut';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

// Add these types
type ServiceContent = {
    subheader: string;
    description: string;
};

type Service = {
    _id: string;
    name: string;
    icon: string;
    contents: ServiceContent[];
    status: 'active' | 'inactive';
};

// Update the renderIcon function to map the service names to their icons
const renderIcon = (iconName: string) => {
    const iconProps = { className: "h-6 w-6 text-pink-600" };
    const iconMapping: { [key: string]: React.ReactElement } = {
        // Screening & Detection
        'Mammogram': <FaXRay {...iconProps} />,
        'Clinical Exam': <FaStethoscope {...iconProps} />,
        'Early Detection': <FiSearch {...iconProps} />,
        'Regular Checkup': <FaCalendar {...iconProps} />,

        // Diagnosis
        'Biopsy': <FaMicroscope {...iconProps} />,
        'Lab Tests': <FaVial {...iconProps} />,
        'Medical Report': <FaNotesMedical {...iconProps} />,
        'Diagnostic Imaging': <FaXRay {...iconProps} />,

        // Treatment
        'Surgery': <FaFirstAid {...iconProps} />,
        'Chemotherapy': <FaPrescription {...iconProps} />,
        'Radiation': <FaHeartbeat {...iconProps} />,
        'Medical Care': <FaUserMd {...iconProps} />,
        'Hospital Care': <FaHospital {...iconProps} />,

        // Support Services
        'Patient Support': <FaHandHolding {...iconProps} />,
        'Counseling': <FaComments {...iconProps} />,
        'Support Group': <FaUsers {...iconProps} />,
        'Care Team': <FaUserNurse {...iconProps} />,

        // Prevention & Wellness
        'Prevention': <FaShieldAlt {...iconProps} />,
        'Monitoring': <FaChartLine {...iconProps} />,
        'Clinical Care': <FaClinicMedical {...iconProps} />,
        'Patient Care': <FaHospitalUser {...iconProps} />
    };

    const icon = iconMapping[iconName];
    
    return icon || <TbStethoscope {...iconProps} />;
};

// After the existing type definitions, add the NotificationData type:
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

// Add these helper functions before the ServicesPage component:
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if the date is today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
    
    // Check if the date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();
    
    if (isToday) {
        // Format the time
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        
        return `Today at ${formattedHours}:${formattedMinutes} ${ampm}`;
    } else if (isYesterday) {
        return 'Yesterday';
    } else {
        // Format date for older notifications
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric'
        };
        
        // Add year if it's not the current year
        if (date.getFullYear() !== today.getFullYear()) {
            options.year = 'numeric';
        }
        
        return date.toLocaleDateString('en-US', options);
    }
};

const formatTime = (time: string) => {
    // Assuming time is in 24-hour format like "14:30"
    const [hours, minutes] = time.split(':').map(Number);
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    
    return `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
};

export default function ServicesPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
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

    // New state for notifications
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    useCheckCookies();

    // Fetch notifications when dropdown is opened
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

    // Add useEffect to fetch services
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axios.get('/api/admin/services?status=active');
                if (response.data.success) {
                    setServices(response.data.services);
                }
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };

        fetchServices();
    }, []);

    const handleLogout = async() => {
        await axios.get("/api/users/logout");
        localStorage.removeItem('firstname');
        window.location.href = '/login';
    };

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

        // Update phone validation
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

    // Add useEffect to fetch user data when modal opens
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

    // First, add the handleProfileIconClick function
    const handleProfileIconClick = () => {
        setShowProfileMenu(prev => !prev);
    };

    // Add this function before the return statement
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

    return (
        <div className={`flex flex-col min-h-screen bg-gray-50 ${poppins.className}`}>
            {/* Navigation Bar */}
            <NavBar onProfileClick={handleProfileClick} onNotificationClick={handleNotificationClick} />
            <SessionOut />

            {/* Notification Detail Modal */}
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
                            {selectedNotification.status === 'rescheduled' ? (
                                <button
                                    onClick={() => {
                                        handleCloseModal();
                                        if (selectedNotification.doctorId) {
                                            router.push(`/appointment/${selectedNotification.doctorId}`);
                                        } else {
                                            console.error('Doctor ID not found in notification data');
                                            alert('Error finding doctor information. Please try again.');
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    Book Again
                                </button>
                            ) : (
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="relative h-[300px] w-full"> {/* Smaller height compared to main dashboard */}
                {/* Hero Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/services-hero.jpg" // Make sure to add this image to your public folder
                        alt="Medical services and equipment"
                        fill
                        priority
                        className="object-cover"
                    />
                    {/* Darker Gradient Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/70"></div>
                </div>

                {/* Hero Content */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex flex-col justify-center h-full">
                        {/* Breadcrumb */}
                        <nav className="mb-4">
                            <ol className="flex items-center space-x-2 text-sm text-gray-600">
                                <li>
                                    <Link 
                                        href="/dashboard" 
                                        className="hover:text-pink-600 transition-colors"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <span className="mx-2">/</span>
                                </li>
                                <li className="text-pink-600">Services</li>
                            </ol>
                        </nav>

                        {/* Title and Description */}
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Our Comprehensive Services
                        </h1>
                        <p className="text-lg text-gray-700 max-w-2xl">
                            Expert care through every step of your journey, from screening to recovery.
                        </p>
                    </div>
                </div>
            </div>

            {/* Service Categories */}
            <div className="bg-white flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="p-8">
                        {services.map((service) => (
                            <div key={service._id} className="mb-8 border-b pb-8 last:border-b-0">
                                <button 
                                    className="w-full flex justify-between items-center"
                                    onClick={() => setExpandedCategory(expandedCategory === service._id ? null : service._id)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-pink-50 p-3 rounded-full">
                                            {/* Render the icon dynamically */}
                                            {renderIcon(service.icon)}
                                        </div>
                                        <h2 className="text-2xl font-semibold text-gray-900">{service.name}</h2>
                                    </div>
                                    <svg 
                                        className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedCategory === service._id ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {expandedCategory === service._id && (
                                    <div className="mt-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {service.contents.map((content, index) => (
                                                <div key={index}>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                        {content.subheader}
                                                    </h3>
                                                    <div className="text-gray-600 space-y-3">
                                                        {/* Render the description with markdown formatting */}
                                                        {content.description.split('\n').map((line, i) => (
                                                            <p key={i}>{line}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Insurance & Financial Information Section */}
            <div className="bg-gray-50 py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Insurance & Financial Information</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We work with most major insurance providers and offer various payment options to make your care accessible.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Accepted Insurance */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Accepted Insurance</h3>
                            <ul className="space-y-3 text-gray-600">
                                {[
                                    'FWD Insurance',
                                    'Generali',
                                    'Allianz',
                                    'AIA',
                                    'Prudential',
                                    'Great Eastern',
                                    'Zurich'
                                ].map((insurance) => (
                                    <li key={insurance} className="flex items-center space-x-3">
                                        <div className="relative">
                                            <svg 
                                                className="w-5 h-5 text-pink-600"
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                {/* Circle */}
                                                <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                                                {/* Checkmark */}
                                                <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={1.5}
                                                    d="M8 12l3 3 5-5" 
                                                />
                                            </svg>
                                        </div>
                                        <span>{insurance}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Financial Assistance */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="bg-pink-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Assistance</h3>
                            <p className="text-gray-600 mb-4">
                                We believe that quality care should be accessible to everyone. 
                                Our financial counsellors will work with you to explore payment options and assistance programs.
                            </p>
                            <div className="space-y-3 mt-6">
                                <div className="flex items-center space-x-3 text-gray-600">
                                    <FaPhone className="w-4 h-4 text-pink-600" />
                                    <span>+60 3-1234 5678</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-600">
                                    <FaEnvelope className="w-4 h-4 text-pink-600" />
                                    <span>finance@pinkpath.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call-to-Action Section */}
            <div className="bg-white py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to Take the Next Step?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Schedule your appointment today and let our expert team provide you with the care you deserve.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button 
                            onClick={() => router.push('/dashboard/ourteams')}
                            className="px-8 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-lg font-medium min-w-[200px]"
                        >
                            Schedule an Appointment
                        </button>
                        <div className="flex items-center space-x-3 text-gray-700">
                            <FaPhone className="w-5 h-5 text-pink-600" />
                            <span className="text-lg font-medium">Call us at+60 3-1234 5678</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Section */}
            <footer className="bg-gray-900 text-gray-300 pt-8 pb-4 relative overflow-hidden">
                {/* Pink Ribbon Background */}
                <div className="absolute right-0 top-0 opacity-5">
                    <Image
                        src="/pink-ribbon.png"
                        alt=""
                        width={300}
                        height={300}
                        className="object-contain"
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                        {/* Contact Information */}
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <FaMapMarkerAlt className="text-pink-500 mt-1" />
                                    <p>123 Medical Center Drive<br />Kuala Lumpur, 50450</p>
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
                                    <Link 
                                        href="/dashboard" 
                                        className="hover:text-pink-500 transition-colors"
                                    >
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/services" 
                                        className="hover:text-pink-500 transition-colors"
                                    >
                                        Our Services
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/resources" 
                                        className="hover:text-pink-500 transition-colors"
                                    >
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
                            <p className="text-sm mb-4 md:mb-0">
                                © 2024 PinkPath Breast Cancer Care Center. All rights reserved.
                            </p>
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
                                                placeholder="1123456789"
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
        </div>
    );
}

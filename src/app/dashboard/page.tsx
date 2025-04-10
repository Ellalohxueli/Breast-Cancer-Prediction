'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { FaRegBell } from 'react-icons/fa';
import { FaRegUser } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import { BiMessageRounded } from 'react-icons/bi';
import { FaStethoscope, FaMicroscope, FaHandHoldingMedical, FaUsers } from 'react-icons/fa';
import { TbStethoscope } from 'react-icons/tb';
import { GiMicroscope } from 'react-icons/gi';
import { RiMentalHealthLine } from 'react-icons/ri';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { FaStar } from 'react-icons/fa';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/pagination';
import Link from 'next/link';
import useCheckCookies from '@/controller/UseCheckCookie';
import axios from 'axios';
import { FaXRay, FaCalendar, FaVial, FaNotesMedical, FaFirstAid, FaPrescription, FaHeartbeat, FaUserMd, FaHospital, FaHandHolding, FaComments, FaShieldAlt, FaChartLine, FaClinicMedical, FaHospitalUser } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { FaClock } from 'react-icons/fa';
import NavBar from '@/components/UserNavBar';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

type Doctor = {
    _id: string;
    name: string;
    specialization: string;
    bio: string;
    image: string;
};

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

type ReviewErrors = {
    rating?: string;
    reviewComment?: string;
};

type Review = {
    _id: string;
    firstName: string;
    rating: number;
    reviewComment: string;
    created_at: string;
};

type NotificationData = {
    _id: string;
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    appointmentDay: string;
    appointmentTime: string;
    status: 'cancelled' | 'rescheduled' | 'completed';
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [teamDoctors, setTeamDoctors] = useState<Doctor[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState({ 
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [successMessage, setSuccessMessage] = useState<'add' | null>(null);
    const [errors, setErrors] = useState<ReviewErrors>({});
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
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
    const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    useCheckCookies();

    useEffect(() => {
        const fetchUserData = async () => {
            if (isProfileModalOpen) {
                setIsLoading(true);
                setError('');
                try {
                    const response = await axios.get('/api/users/profile');
                    if (response.data.success) {
                        setUser(response.data.user);
                    }
                } catch (error: any) {
                    console.error('Error fetching user data:', error);
                    setError(error.response?.data?.error || 'Failed to load user data');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchUserData();
    }, [isProfileModalOpen]);

    useEffect(() => {
        setEditedUser(user);
    }, [user]);

    const handleHomeClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default navigation
    };

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");
            localStorage.removeItem('firstname');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await axios.get('/api/users/ourteams');
                setTeamDoctors(response.data.data.slice(0, 3)); // Get first 3 doctors
            } catch (error) {
                console.error('Error fetching doctors:', error);
            }
        };

        fetchDoctors();
    }, []);

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

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await axios.get('/api/users/reviews');
                if (response.data.success) {
                    setReviews(response.data.reviews);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
        };

        fetchReviews();
    }, []);

    useEffect(() => {
        const fetchInitialNotifications = async () => {
            try {
                const response = await axios.get('/api/notifications');
                if (response.data.success) {
                    setNotifications(response.data.notifications);
                    // Count unread notifications
                    const unreadCount = response.data.notifications.filter(
                        (n: NotificationData) => !n.isRead
                    ).length;
                    setNotificationCount(unreadCount);
                }
            } catch (error) {
                console.error('Error fetching initial notifications:', error);
            }
        };

        fetchInitialNotifications();
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (isDropdownOpen) {
                setIsLoadingNotifications(true);
                setNotificationError(null);
                try {
                    const response = await axios.get('/api/notifications');
                    if (response.data.success) {
                        setNotifications(response.data.notifications);
                        // Update notification count
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

    useEffect(() => {
        console.log('Notification count updated:', notificationCount);
    }, [notificationCount]);

    const renderIcon = (iconName: string) => {
        const iconProps = { className: "h-8 w-8" };
        const iconMapping: { [key: string]: React.ReactElement } = {
            'Mammogram': <FaXRay {...iconProps} />,
            'Clinical Exam': <FaStethoscope {...iconProps} />,
            'Early Detection': <FiSearch {...iconProps} />,
            'Regular Checkup': <FaCalendar {...iconProps} />,
            'Biopsy': <FaMicroscope {...iconProps} />,
            'Lab Tests': <FaVial {...iconProps} />,
            'Medical Report': <FaNotesMedical {...iconProps} />,
            'Diagnostic Imaging': <FaXRay {...iconProps} />,
            'Surgery': <FaFirstAid {...iconProps} />,
            'Chemotherapy': <FaPrescription {...iconProps} />,
            'Radiation': <FaHeartbeat {...iconProps} />,
            'Medical Care': <FaUserMd {...iconProps} />,
            'Hospital Care': <FaHospital {...iconProps} />,
            'Patient Support': <FaHandHolding {...iconProps} />,
            'Counseling': <FaComments {...iconProps} />,
            'Support Group': <FaUsers {...iconProps} />,
            'Care Team': <FaUserMd {...iconProps} />,
            'Prevention': <FaShieldAlt {...iconProps} />,
            'Monitoring': <FaChartLine {...iconProps} />,
            'Clinical Care': <FaClinicMedical {...iconProps} />,
            'Patient Care': <FaHospitalUser {...iconProps} />
        };

        return iconMapping[iconName] || <TbStethoscope {...iconProps} />;
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setErrors({});
        
        // Validate inputs
        const newErrors: ReviewErrors = {};
        if (!rating) {
            newErrors.rating = 'Please select a rating';
        }
        if (!reviewComment.trim()) {
            newErrors.reviewComment = 'Please provide a review comment';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const firstName = localStorage.getItem('firstname');
        if (!firstName) {
            alert('Please log in to submit a review');
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            // First, check if user has already submitted a review
            const checkResponse = await axios.get(`/api/users/reviews/check?firstName=${firstName}`);
            
            if (checkResponse.data.hasReviewed) {
                setErrors({
                    reviewComment: 'You have already submitted a review before. Only one review per user is allowed.'
                });
                setIsSubmitting(false);
                return;
            }

            // If no previous review, proceed with submission
            const response = await axios.post('/api/users/reviews', {
                firstName,
                rating,
                reviewComment,
                created_at: new Date()
            });

            if (response.data.success) {
                setSuccessMessage('add');
                setRating(0);
                setReviewComment('');
                setErrors({});
                
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            }
        } catch (error: any) {
            console.error('Error submitting review:', error);
            if (error.response?.status === 401) {
                alert('Please log in to submit a review');
                router.push('/login');
            } else if (error.response?.data?.error) {
                setErrors({
                    reviewComment: error.response.data.error
                });
            } else {
                setErrors({
                    reviewComment: 'Failed to submit review. Please try again.'
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProfileIconClick = () => {
        setShowProfileMenu(prev => !prev);
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setShowProfileMenu(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'phone') {
            // Only allow numbers
            const numbersOnly = value.replace(/[^\d]/g, '');
            // Add '60' prefix if it doesn't exist
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

    const handleSaveChanges = async () => {
        // Reset errors
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
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    setProfileSuccessMessage(false);
                }, 3000);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.error || 'Failed to update profile. Please try again.');
        }
    };

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
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
            const response = await axios.put('/api/users/password', passwordForm);
            if (response.data.success) {
                setIsProfileModalOpen(false);
                setProfileSuccessMessage(true);
                // Reset form
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

    // Update the formatDate function
    const formatDate = (dateString: string) => {
        // Create dates with Malaysia timezone offset
        const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const now = new Date();
        const malaysiaTime = new Date(now.getTime() + malaysiaOffset);
        const createdAt = new Date(dateString);
        
        // Get time differences in milliseconds
        const diffInMs = malaysiaTime.getTime() - createdAt.getTime();
        
        // Convert to minutes, hours, and days
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        
        // More precise time difference handling
        if (diffInMinutes < 1) {
            return 'just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInHours < 24) {
            const remainingMinutes = diffInMinutes % 60;
            if (remainingMinutes === 0) {
                return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
            } else {
                return `${diffInHours}h ${remainingMinutes}m ago`;
            }
        } else if (diffInDays < 7) {
            return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
        } else {
            return createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    // const handleNotificationClick = async (notification: NotificationData) => {
    //     try {
    //         // Only update if notification is unread
    //         if (!notification.isRead) {
                
    //             const response = await axios.put('/api/notifications/read', {
    //                 notificationId: notification._id
    //             });

    //             if (response.data.success) {
    //                 // Update the notification in the local state
    //                 setNotifications(prevNotifications => 
    //                     prevNotifications.map(n => 
    //                         n._id === notification._id 
    //                             ? { ...n, isRead: true }
    //                             : n
    //                     )
    //                 );

    //                 // Update the notification count
    //                 setNotificationCount(prev => Math.max(0, prev - 1));
    //             }
    //         }

    //         // Set the selected notification and open modal
    //         setSelectedNotification(notification);
    //         setIsNotificationModalOpen(true);
    //     } catch (error) {
    //         console.error('Error updating notification read status:', error);
    //     }
    // };
    const handleNotificationClick = async (notification: NotificationData) => {
        try {
            console.log('Notification clicked:', notification);
    
            // Only update if notification is unread
            if (!notification.isRead) {
                console.log('Marking notification as read:', notification._id);
                
                const response = await axios.put('/api/notifications/read', {
                    notificationId: notification._id
                });
    
                if (response.data.success) {
                    console.log('API response success. Updating local state.');
    
                    // Update the notification in the local state
                    setNotifications(prevNotifications => {
                        const updatedNotifications = prevNotifications.map(n => 
                            n._id === notification._id 
                                ? { ...n, isRead: true }
                                : n
                        );
                        console.log('Updated notifications array:', updatedNotifications);
    
                        // Recalculate the unread count based on the updated notifications
                        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
                        console.log('New unread count:', unreadCount);
    
                        // Update the notification count atomically
                        setNotificationCount(unreadCount);
    
                        return updatedNotifications;
                    });
                } else {
                    console.error('API response indicates failure:', response.data);
                }
            } else {
                console.log('Notification is already marked as read. No action needed.');
            }
    
            // Set the selected notification and open modal
            setSelectedNotification(notification);
            setIsNotificationModalOpen(true);
    
            console.log('Notification modal opened for:', notification._id);
        } catch (error) {
            console.error('Error updating notification read status:', error);
        }
    };

    const handleCloseModal = () => {
        setSelectedNotification(null);
        setIsNotificationModalOpen(false);
    };

    // Add this helper function near your other utility functions
    const formatTime = (time: string) => {
        // Check if time is in 24-hour format (e.g., "14:30")
        if (time.includes(':')) {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const formattedHour = hour % 12 || 12; // Convert 0 to 12
            return `${formattedHour}:${minutes}${ampm}`;
        }
        return time; // Return original if not in expected format
    };

    return (
        <div id="top" className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            {/* Full width white navigation bar */}
            <NavBar onProfileClick={handleProfileClick} onNotificationClick={handleNotificationClick}/>

            {/* Hero Section */}
            <div className="relative h-[600px] w-full">
                {/* Hero Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/hero-medical.jpg"
                        alt="Medical professionals providing compassionate care"
                        fill
                        priority
                        className="object-cover"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/70 to-white/30"></div>
                </div>

                {/* Hero Content */}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex flex-col justify-center h-full max-w-2xl">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                            Compassionate Care for Your Journey
                        </h1>
                        <p className="text-2xl text-gray-700 mb-8">
                            Leading Breast Cancer Care in Malaysia
                        </p>
                        <p className="text-lg text-gray-600 mb-8 max-w-xl">
                            Experience exceptional care with our team of dedicated specialists. 
                            We're here to support you every step of the way.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => router.push('/dashboard/ourteams')}
                                className="px-8 py-4 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-300 font-medium text-lg shadow-lg hover:shadow-xl"
                            >
                                Book Your Consultation
                            </button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex gap-8 mt-12">
                            <div className="flex items-center gap-2">
                                <div className="h-12 w-12 rounded-full bg-gray-900/10 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-900">15+</span>
                                </div>
                                <div className="text-gray-700">
                                    <p className="text-sm">Years of</p>
                                    <p className="font-medium">Excellence</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-12 w-12 rounded-full bg-gray-900/10 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-900">98%</span>
                                </div>
                                <div className="text-gray-700">
                                    <p className="text-sm">Patient</p>
                                    <p className="font-medium">Satisfaction</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Overview Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Comprehensive Services</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        We offer a complete range of breast cancer care services, from early detection to treatment and ongoing support.
                    </p>
                </div>

                <div className="flex justify-center">
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ${
                        services.length < 4 ? 'lg:grid-cols-' + services.length : ''
                    }`}>
                        {services.slice(0, 4).map((service) => (
                            <div key={service._id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow w-full max-w-sm">
                                <div className="text-pink-600 mb-4 bg-pink-50 h-16 w-16 rounded-full flex items-center justify-center">
                                    {renderIcon(service.icon)}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {service.name}
                                </h3>
                                <div className="text-gray-600 mb-4">
                                    {service.contents.map((content, index) => (
                                        <p key={index} className={index !== service.contents.length - 1 ? 'mb-2' : ''}>
                                            {content.subheader}
                                        </p>
                                    ))}
                                </div>
                                <Link 
                                    href="/dashboard/services" 
                                    className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center"
                                >
                                    Learn More
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Patient Testimonials Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Patient Stories</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Read experiences from our brave patients who have shared their journey with us.
                        </p>
                    </div>

                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={30}
                        slidesPerView={1}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 }
                        }}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        pagination={{
                            clickable: true,
                            bulletActiveClass: 'swiper-pagination-bullet-active bg-pink-600',
                        }}
                        className="py-8"
                    >
                        {reviews.map((review) => (
                            <SwiperSlide key={review._id}>
                                <div className="bg-white rounded-lg p-8 shadow-sm h-[260px] flex flex-col">
                                    {/* Header with user info and rating */}
                                    <div className="flex items-center mb-4">
                                        <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-pink-600 font-semibold text-xl">
                                                {review.firstName.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h4 className="text-gray-900 font-semibold">{review.firstName}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex text-pink-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar 
                                                            key={i} 
                                                            className={`h-4 w-4 ${
                                                                i < review.rating ? 'text-pink-500' : 'text-gray-300'
                                                            }`} 
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    • {new Date(review.created_at).toLocaleDateString('en-US', { 
                                                        year: 'numeric', 
                                                        month: 'long'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review content with text truncation */}
                                    <blockquote className="text-gray-600 italic flex-1 overflow-hidden">
                                        <p className="line-clamp-5">"{review.reviewComment}"</p>
                                    </blockquote>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>

            {/* Meet Our Team Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Expert Team</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Our dedicated team of specialists is committed to providing the highest quality care.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {teamDoctors.map((doctor) => (
                        <div key={doctor._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative h-48 w-full">
                                <Image
                                    src={doctor.image || '/default-doctor.jpg'}
                                    alt={doctor.name}
                                    fill
                                    className="object-contain"
                                    style={{ backgroundColor: '#f3f4f6' }}
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-1">{doctor.name}</h3>
                                <p className="text-pink-600 font-medium mb-3">{doctor.specialization}</p>
                                <p className="text-gray-600 mb-4">
                                    {doctor.bio}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All Team Button */}
                <div className="text-center">
                    <Link 
                        href="/dashboard/ourteams"
                        className="inline-flex items-center px-6 py-3 border border-pink-600 text-pink-600 hover:bg-pink-50 rounded-md font-medium transition-colors"
                    >
                        View All Team Members
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Review Section */}
            <div className="bg-white py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Share Your Experience</h2>
                        <p className="text-lg text-gray-600">
                            Your feedback helps us improve and helps others in their journey.
                        </p>
                    </div>

                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                        {/* Rating */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-3">
                                Your Rating
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => {
                                            setRating(star);
                                            setErrors(prev => ({ ...prev, rating: undefined }));
                                        }}
                                        className={`${
                                            star <= rating ? 'text-pink-500' : 'text-gray-300'
                                        } hover:text-pink-500 focus:text-pink-500 text-2xl focus:outline-none transition-colors`}
                                    >
                                        <FaStar />
                                    </button>
                                ))}
                            </div>
                            {errors.rating && (
                                <p className="mt-1 text-sm text-red-500">{errors.rating}</p>
                            )}
                        </div>

                        {/* Review Comment */}
                        <div>
                            <label htmlFor="review" className="block text-gray-700 font-medium mb-3">
                                Your Review
                            </label>
                            <textarea
                                id="review"
                                rows={4}
                                value={reviewComment}
                                onChange={(e) => {
                                    setReviewComment(e.target.value);
                                    setErrors(prev => ({ ...prev, reviewComment: undefined }));
                                }}
                                className={`w-full px-4 py-3 rounded-md border ${
                                    errors.reviewComment ? 'border-red-500' : 'border-gray-300'
                                } focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none placeholder-gray-400 text-black`}
                                placeholder="Share your experience with us..."
                            ></textarea>
                            {errors.reviewComment && (
                                <p className="mt-1 text-sm text-red-500">{errors.reviewComment}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="text-center">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-8 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors font-medium ${
                                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Messages */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    Review submitted successfully!
                </div>
            )}
            {profileSuccessMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    Profile updated successfully!
                </div>
            )}

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
                                <div className="space-y-6">
                                    {/* Profile Information Form */}
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                                            {error}
                                        </div>
                                    )}
                                    {isLoading ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                                            <p className="mt-2 text-gray-600">Loading profile...</p>
                                        </div>
                                    ) : (
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
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Password Form */}
                                    <div>
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
                                        href="#top" 
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
        </div>
    );
}


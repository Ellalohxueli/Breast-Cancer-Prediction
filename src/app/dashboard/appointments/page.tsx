'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { FaRegBell, FaRegUser, FaCalendar, FaClock, FaStar } from 'react-icons/fa';
import { BiMessageRounded } from 'react-icons/bi';
import Link from 'next/link';
import useCheckCookies from '@/controller/UseCheckCookie';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import NavBar from '@/components/UserNavBar';
import jsPDF from 'jspdf';
import SessionOut from '@/components/SessionOut';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

interface Doctor {
    _id: string;
    name: string;
    specialization: string;
    image?: string;
}

interface BookedAppointment {
    _id: string;
    doctorId: string;
    patientId: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    day: string;
    timeSlot: {
        startTime: string;
        endTime: string;
    };
    status: 'Booked' | 'Upcoming' | 'Completed' | 'Cancelled' | 'Rescheduled';
    appointmentType: 'Consultation' | 'Follow-up';
    doctor?: Doctor;
    reviews?: {
        rating: number;
        review: string;
        createdAt: Date;
    }[];
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

// Helper function to format time to 12-hour format with AM/PM
const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
};

export default function AppointmentsPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'booked' | 'past'>('booked');
    const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'password'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
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
    const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
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
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewErrors, setReviewErrors] = useState<{
        rating?: string;
        reviewComment?: string;
    }>({});
    const [reviewSuccessMessage, setReviewSuccessMessage] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    useCheckCookies();

    const handleProfileIconClick = () => {
        setShowProfileMenu(prev => !prev);
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
        setEditedUser({
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
        });
        
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
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
        
        setIsProfileModalOpen(false);
    };

    const confirmReschedule = async () => {
        if (!appointmentToReschedule) return;

        try {
            const malaysiaOffset = 8 * 60 * 60 * 1000;
            const now = new Date();
            const malaysiaTime = new Date(now.getTime() + malaysiaOffset);

            const response = await axios.put('/api/doctors/appointment/reschedule', {
                appointmentId: appointmentToReschedule._id,
                updatedAt: malaysiaTime.toISOString()
            });

            if (response.data.success) {
                setRescheduleConfirmationModal(false);
                setAppointmentToReschedule(null);
                setShowRescheduleSuccessMessage(true);
                
                setTimeout(() => {
                    setShowRescheduleSuccessMessage(false);
                    if (appointmentToReschedule.doctor?._id) {
                        router.push(`/appointment/${appointmentToReschedule.doctor._id}`);
                    } else {
                        console.error('Doctor ID not found in appointment data');
                        alert('Error finding doctor information. Please try again.');
                    }
                }, 2000);
            } else {
                alert('Failed to reschedule appointment');
            }
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            alert('Failed to reschedule appointment');
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

    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoadingAppointments(true);
            setAppointmentError(null);
            try {
                const response = await axios.get('/api/users/showAppointment');
                
                if (response.data.success) {
                    const appointments = response.data.appointments;
                    
                    // Filter appointments for booked/upcoming tab
                    const booked = appointments.filter((apt: BookedAppointment) => {
                        return apt.status === 'Booked' || apt.status === 'Upcoming';
                    });

                    // Filter appointments for past/cancelled/rescheduled tab
                    const cancelled = appointments
                        .filter((apt: BookedAppointment) => {
                            return apt.status === 'Cancelled' || apt.status === 'Rescheduled' || apt.status === 'Completed';
                        })
                        .sort((a: BookedAppointment, b: BookedAppointment) => {
                            // First sort by date
                            const dateA = new Date(a.dateRange.startDate);
                            const dateB = new Date(b.dateRange.startDate);
                            const dateDiff = dateB.getTime() - dateA.getTime();
                            
                            // If dates are the same, sort by time
                            if (dateDiff === 0) {
                                const timeA = a.timeSlot.startTime.split(':').map(Number);
                                const timeB = b.timeSlot.startTime.split(':').map(Number);
                                const minutesA = timeA[0] * 60 + timeA[1];
                                const minutesB = timeB[0] * 60 + timeB[1];
                                return minutesB - minutesA;
                            }
                            
                            return dateDiff;
                        });
                    
                    setBookedAppointments(booked);
                    setCancelledAppointments(cancelled);
                }
            } catch (error: any) {
                console.error('Error fetching appointments:', error);
                setAppointmentError(error.response?.data?.error || 'Failed to load appointments');
            } finally {
                setIsLoadingAppointments(false);
            }
        };

        fetchAppointments();
    }, []);

    useEffect(() => {
        const fetchInitialNotifications = async () => {
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

    const handleReviewClick = (appointment: BookedAppointment) => {
        // Check if a review already exists
        if (appointment.reviews && appointment.reviews.length > 0) {
            toast.error('You have already submitted a review for this appointment.');
            return;
        }

        setSelectedAppointment(appointment);
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setReviewErrors({});
        
        // Validate inputs
        const newErrors: { rating?: string; reviewComment?: string } = {};
        if (!rating) {
            newErrors.rating = 'Please select a rating';
        }
        if (!reviewComment.trim()) {
            newErrors.reviewComment = 'Please provide a review comment';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setReviewErrors(newErrors);
            return;
        }

        if (!selectedAppointment) return;

        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/appointments/reviews', {
                appointmentId: selectedAppointment._id,
                rating,
                reviewComment
            });

            if (response.data.success) {
                // Update the appointment in the cancelledAppointments state
                setCancelledAppointments(prevAppointments => 
                    prevAppointments.map(apt => 
                        apt._id === selectedAppointment._id 
                            ? {
                                ...apt,
                                reviews: [{
                                    rating,
                                    review: reviewComment,
                                    createdAt: new Date()
                                }]
                            }
                            : apt
                    )
                );

                setReviewSuccessMessage(true);
                setTimeout(() => {
                    setReviewSuccessMessage(false);
                    setIsReviewModalOpen(false);
                    setRating(0);
                    setReviewComment('');
                    setSelectedAppointment(null);
                }, 2000);
            }
        } catch (error: any) {
            console.error('Error submitting review:', error);
            if (error.response?.data?.error) {
                setReviewErrors({
                    reviewComment: error.response.data.error
                });
            } else {
                setReviewErrors({
                    reviewComment: 'Failed to submit review. Please try again.'
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchReportData = async (appointmentId: string) => {
        setIsLoadingReport(true);
        setReportError(null);
        try {
            const response = await axios.get(`/api/reports/${appointmentId}`);
            if (response.data.success) {
                // Ensure we have all the required data
                const reportData = {
                    ...response.data.report,
                    appointment: response.data.report.appointment || {
                        dateRange: { startDate: new Date().toISOString() },
                        timeSlot: { startTime: '00:00' },
                        appointmentType: 'N/A',
                        doctor: { name: 'N/A' }
                    }
                };
                setReportData(reportData);
                setIsReportModalOpen(true);
            } else {
                setReportError('Failed to load report data');
            }
        } catch (error: any) {
            console.error('Error fetching report:', error);
            setReportError(error.response?.data?.error || 'Failed to load report data');
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleDownloadReport = async (report: any) => {
        if (!report) return;

        try {
            // Log the report data structure
            console.log('Report Data Structure:', {
                timeSlot: report.appointment?.dateRange?.timeSlot,
                startTime: report.appointment?.dateRange?.timeSlot?.startTime
            });

            // Create a new PDF document (A4 size in portrait orientation)
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);
            const lineHeight = 5;
            let yPos = 15;

            // Function to load image
            const loadImage = (url: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new window.Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = url;
                });
            };

            // Header with Logo and Title on the same level
            try {
                // Load logo
                const logoImg = await loadImage('/logo.png');
                const logoWidth = 20;
                const logoHeight = logoWidth * (logoImg.height / logoImg.width);
                
                // Add logo on the left
                doc.addImage(logoImg, 'PNG', margin, yPos, logoWidth, logoHeight);
                
                // Add title next to the logo
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Mammogram Report', margin + logoWidth + 3, yPos + (logoHeight/2) + 1);
                
                // Add a horizontal line below the header
                yPos += logoHeight + 5;
                doc.setDrawColor(220, 220, 220);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5;
            } catch (logoError) {
                // If logo fails to load, just add the title
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Mammogram Report', pageWidth / 2, yPos, { align: 'center' });
                yPos += lineHeight * 2;
            }

            // Appointment Information Section
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Appointment Information', margin, yPos);
            yPos += lineHeight * 0.8;
            
            // Line under section title
            doc.setDrawColor(220, 220, 220);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += lineHeight;
            
            // Add a light gray background rectangle for the content
            doc.setFillColor(249, 250, 251); // very light gray
            const apptHeight = 25;
            doc.rect(margin, yPos, contentWidth, apptHeight, 'F');
            
            // Add appointment details
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            // Format date and time
            const appointmentDate = new Date(report.appointment?.dateRange?.startDate || report.createdAt);
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Get the appointment time from the correct location
            const appointmentTime = report.appointment?.dateRange?.timeSlot?.startTime 
                ? formatTime(report.appointment.dateRange.timeSlot.startTime)
                : 'N/A';

            console.log('Time Formatting:', {
                rawTime: report.appointment?.dateRange?.timeSlot?.startTime,
                formattedTime: appointmentTime
            });
            
            // Add appointment details with proper spacing
            doc.text(`Doctor: ${report.appointment?.doctor?.name || 'N/A'}`, margin + 5, yPos + 5);
            doc.text(`Date: ${formattedDate}`, margin + 5, yPos + 10);
            doc.text(`Time: ${appointmentTime}`, margin + 5, yPos + 15);
            doc.text(`Type: ${report.appointment?.appointmentType || 'N/A'}`, margin + 5, yPos + 20);
            
            yPos += apptHeight + lineHeight;
            
            // Mammogram Analysis Section
            if (report.mammograms && report.mammograms.length > 0) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Mammogram Analysis', margin, yPos);
                yPos += lineHeight * 0.8;
                
                // Line under section title
                doc.setDrawColor(220, 220, 220);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += lineHeight;

                // Load and add mammogram image
                try {
                    // Use first mammogram
                    const mammogram = report.mammograms[0];
                    const mammogramImg = await loadImage(mammogram.image);
                    
                    // Calculate dimensions to fit within column width while maintaining aspect ratio
                    const maxImageWidth = contentWidth - 30;
                    const maxImageHeight = 65; // Maximum height for the image
                    
                    let imgWidth = maxImageWidth;
                    let imgHeight = imgWidth * (mammogramImg.height / mammogramImg.width);
                    
                    // If the height exceeds the maximum, scale down
                    if (imgHeight > maxImageHeight) {
                        imgHeight = maxImageHeight;
                        imgWidth = imgHeight * (mammogramImg.width / mammogramImg.height);
                    }
                    
                    // Center the image horizontally
                    const xPos = (pageWidth - imgWidth) / 2;
                    doc.addImage(mammogramImg, 'JPEG', xPos, yPos, imgWidth, imgHeight);
                    
                    // Adjust position after image
                    yPos += imgHeight + lineHeight;

                    // Add prediction result with appropriate background
                    const resultText = `Prediction: ${mammogram.predictionResult}`;
                    
                    // Different styling based on prediction result
                    if (mammogram.predictionResult === 'Benign') {
                        doc.setFillColor(240, 249, 244); // light green background
                        doc.setTextColor(22, 101, 52); // green text
                    } else if (mammogram.predictionResult === 'Malignant') {
                        doc.setFillColor(254, 242, 242); // light red background
                        doc.setTextColor(153, 27, 27); // red text
                    } else {
                        doc.setFillColor(241, 245, 249); // light gray background
                        doc.setTextColor(71, 85, 105); // gray text
                    }
                    
                    // Draw rounded rectangle for the result
                    doc.setFontSize(9);
                    const textWidth = doc.getTextWidth(resultText) + 8;
                    const rectX = (pageWidth - textWidth) / 2;
                    doc.roundedRect(rectX - 3, yPos - 4, textWidth + 6, 12, 3, 3, 'F');
                    
                    // Add the text
                    doc.setFont('helvetica', 'bold');
                    doc.text(resultText, pageWidth / 2, yPos + 2, { align: 'center' });
                    
                    // Reset text color
                    doc.setTextColor(0, 0, 0);
                    yPos += lineHeight * 3;
                } catch (imageError) {
                    doc.setFontSize(8);
                    doc.text('Mammogram image could not be loaded', margin, yPos);
                    yPos += lineHeight * 2;
                }
            }

            // Medical Description Section
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Medical Description', margin, yPos);
            yPos += lineHeight * 0.8;
            
            // Line under section title
            doc.setDrawColor(220, 220, 220);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += lineHeight;
            
            // Add a light gray background rectangle for the content
            doc.setFillColor(249, 250, 251); // very light gray
            const descHeight = 25;
            doc.rect(margin, yPos, contentWidth, descHeight, 'F');
            
            // Wrap text for description
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const splitDescription = doc.splitTextToSize(report.description || 'No description available', contentWidth - 10);
            doc.text(splitDescription, margin + 5, yPos + 5);
            yPos += descHeight + lineHeight;

            // Medications Section
            if (report.medications && report.medications.length > 0) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Prescribed Medications', margin, yPos);
                yPos += lineHeight * 0.8;
                
                // Line under section title
                doc.setDrawColor(220, 220, 220);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += lineHeight;
                
                // Add a light gray background rectangle for the content
                doc.setFillColor(249, 250, 251); // very light gray
                const medHeight = Math.min(20, report.medications.length * lineHeight + 6);
                doc.rect(margin, yPos, contentWidth, medHeight, 'F');

                // Add medications list
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                
                const maxDisplay = 3; // Limit medications display to fit on one page
                const displayedMeds = report.medications.slice(0, maxDisplay);
                
                displayedMeds.forEach((medication: string, i: number) => {
                    doc.text(`• ${medication}`, margin + 5, yPos + 6 + (i * lineHeight));
                });
                
                // Show count of remaining medications if any
                if (report.medications.length > maxDisplay) {
                    doc.text(`• ... and ${report.medications.length - maxDisplay} more`, 
                        margin + 5, yPos + 6 + (maxDisplay * lineHeight));
                }
                
                yPos += medHeight + lineHeight;
            }

            // Add footer
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('This is a computer-generated report. For any queries, please contact your healthcare provider.', 
                pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Save the PDF with a filename based on the appointment date
            const fileName = `mammogram-report-${formattedDate.replace(/,/g, '')}.pdf`;
            doc.save(fileName);
            toast.success('Report downloaded successfully');
        } catch (error) {
            toast.error('Failed to download report');
        }
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            {/* Full width white navigation bar */}
            <NavBar onProfileClick={handleProfileClick} onNotificationClick={handleNotificationClick} />
            <SessionOut />

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Appointments</h1>
                
                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('booked')}
                            className={`${
                                activeTab === 'booked'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200`}
                        >
                            Booked Appointments
                        </button>

                        <button
                            onClick={() => setActiveTab('past')}
                            className={`${
                                activeTab === 'past'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200`}
                        >
                            Past Appointments & Reports
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow">
                    {appointmentError ? (
                        <div className="p-6 text-center text-red-600">
                            <p>{appointmentError}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 text-pink-600 hover:text-pink-700"
                            >
                                Try again
                            </button>
                        </div>
                    ) : isLoadingAppointments ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading appointments...</p>
                        </div>
                    ) : activeTab === 'booked' ? (
                        <div className="p-6">
                            {bookedAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {bookedAppointments.map((appointment) => (
                                        <div 
                                            key={appointment._id} 
                                            className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
                                        >
                                            <div className="flex justify-between">
                                                {/* Left side: Calendar icon with doctor info */}
                                                <div className="flex items-center space-x-4">
                                                    {/* Calendar Icon */}
                                                    <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                                                        <svg 
                                                            className="w-6 h-6 text-pink-600" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                strokeWidth="2" 
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                                            />
                                                        </svg>
                                                    </div>

                                                    {/* Doctor Info and Appointment Type */}
                                                    <div className="space-y-1">
                                                        <div className="text-xl font-bold text-gray-900">
                                                            <span>{appointment.appointmentType}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-gray-600">
                                                                with {appointment.doctor?.name || 'Doctor Name Not Available'}
                                                            </h3>
                                                            <p className="text-gray-500">
                                                                {appointment.doctor?.specialization || 'Specialization Not Available'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right side: Date, time, and buttons */}
                                                <div className="flex flex-col items-end space-y-4">
                                                    {/* Date and Time */}
                                                    <div className="flex items-center text-gray-700">
                                                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>
                                                            {new Date(appointment.dateRange.startDate).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })} at {formatTime(appointment.timeSlot.startTime)}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex space-x-4">
                                                        <button 
                                                            className="px-4 py-2.5 text-sm font-medium text-pink-600 border border-pink-600 rounded-md hover:bg-pink-50 transition-colors"
                                                            onClick={() => {
                                                                setAppointmentToReschedule(appointment);
                                                                setRescheduleConfirmationModal(true);
                                                            }}
                                                        >
                                                            Reschedule
                                                        </button>
                                                        <button 
                                                            className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                                                            onClick={async () => {
                                                                try {
                                                                    // Calculate Malaysia time (UTC+8)
                                                                    const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
                                                                    const now = new Date();
                                                                    const malaysiaTime = new Date(now.getTime() + malaysiaOffset);

                                                                    const response = await axios.put('/api/doctors/appointment/cancel', {
                                                                        appointmentId: appointment._id,
                                                                        updatedAt: malaysiaTime.toISOString()
                                                                    });

                                                                    if (response.data.success) {
                                                                        // Refresh the appointments list
                                                                        window.location.reload();
                                                                    } else {
                                                                        alert('Failed to cancel appointment');
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error cancelling appointment:', error);
                                                                    alert('Failed to cancel appointment');
                                                                }
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <p className="text-lg">No upcoming appointments</p>
                                    <Link 
                                        href="/dashboard/ourteams"
                                        className="mt-4 inline-block px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
                                    >
                                        Book an Appointment
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            {cancelledAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {cancelledAppointments.map((appointment) => (
                                        <div 
                                            key={appointment._id} 
                                            className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
                                        >
                                            <div className="flex justify-between">
                                                {/* Left side: Calendar icon with doctor info */}
                                                <div className="flex items-center space-x-4">
                                                    {/* Calendar Icon */}
                                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <svg 
                                                            className="w-6 h-6 text-gray-600" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path 
                                                                strokeLinecap="round" 
                                                                strokeLinejoin="round" 
                                                                strokeWidth="2" 
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                                            />
                                                        </svg>
                                                    </div>

                                                    {/* Doctor Info and Appointment Type */}
                                                    <div className="space-y-1">
                                                        <div className="text-xl font-bold text-gray-900">
                                                            <span>{appointment.appointmentType}</span>
                                                            <span className={`ml-2 text-sm font-normal px-2 py-1 rounded ${
                                                                appointment.status === 'Cancelled' 
                                                                    ? 'text-red-600 bg-red-50'
                                                                    : appointment.status === 'Completed'
                                                                    ? 'text-green-600 bg-green-50'
                                                                    : 'text-orange-600 bg-orange-50'
                                                            }`}>
                                                                {appointment.status}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-gray-600">
                                                                with {appointment.doctor?.name || 'Doctor Name Not Available'}
                                                            </h3>
                                                            <p className="text-gray-500">
                                                                {appointment.doctor?.specialization || 'Specialization Not Available'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right side: Date and time */}
                                                <div className="flex flex-col items-end space-y-4">
                                                    {/* Date and Time */}
                                                    <div className="flex items-center text-gray-700">
                                                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>
                                                            {new Date(appointment.dateRange.startDate).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })} at {formatTime(appointment.timeSlot.startTime)}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons for Completed Appointments */}
                                                    {appointment.status === 'Completed' && (
                                                        <div className="flex space-x-4">
                                                            <button 
                                                                onClick={() => fetchReportData(appointment._id)}
                                                                className="px-4 py-2.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                                                            >
                                                                View Report
                                                            </button>
                                                            {(!appointment.reviews || appointment.reviews.length === 0) && (
                                                                <button 
                                                                    onClick={() => handleReviewClick(appointment)}
                                                                    className="px-4 py-2.5 text-sm font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors"
                                                                >
                                                                    Review
                                                                </button>
                                                            )}
                                                            {appointment.reviews && appointment.reviews.length > 0 && (
                                                                <div className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-md bg-gray-50">
                                                                    Review
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <p className="text-lg">No past appointments</p>
                                </div>
                            )}
                        </div>
                    )}
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
                                    onClick={() => setActiveProfileTab('profile')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeProfileTab === 'profile'
                                            ? 'bg-gray-100 text-pink-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => setActiveProfileTab('password')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeProfileTab === 'password'
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
                            {activeProfileTab === 'profile' ? (
                                <div className="space-y-6">
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
                                                    Confirm Password
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
                                onClick={handleSaveChanges}
                                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            >
                                Save Changes
                            </button>
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

            {/* Reschedule Confirmation Modal */}
            {rescheduleConfirmationModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white/95 rounded-lg p-8 w-full max-w-2xl relative shadow-xl backdrop-blur-sm border border-gray-200">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Confirm Reschedule
                        </h2>
                        <div className="mb-8 text-gray-600">
                            <p className="text-lg mb-4">Are you sure you want to reschedule this appointment? The current appointment will be cancelled and a new appointment will be created.</p>
                            {appointmentToReschedule && (
                                <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-100">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Appointment Details</h3>
                                    <div className="space-y-3 text-base">
                                        <div className="flex items-center">
                                            <span className="font-medium w-24">Doctor:</span>
                                            <span>{appointmentToReschedule.doctor?.name}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium w-24">Date:</span>
                                            <span>{new Date(appointmentToReschedule.dateRange.startDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium w-24">Time:</span>
                                            <span>{formatTime(appointmentToReschedule.timeSlot.startTime)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setRescheduleConfirmationModal(false);
                                    setAppointmentToReschedule(null);
                                }}
                                className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReschedule}
                                className="bg-pink-600 text-white px-6 py-2.5 rounded-lg hover:bg-pink-700 font-medium"
                            >
                                Confirm Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRescheduleSuccessMessage && (
                <div className="fixed top-24 right-4 flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <p>Appointment rescheduled successfully!</p>
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

            {/* Review Modal */}
            {isReviewModalOpen && selectedAppointment && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white/95 rounded-lg p-8 w-full max-w-2xl relative shadow-xl backdrop-blur-sm border border-gray-200">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            Review Your Appointment
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Share your experience with {selectedAppointment.doctor?.name || 'Doctor Name Not Available'}
                        </p>

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
                                                setReviewErrors(prev => ({ ...prev, rating: undefined }));
                                            }}
                                            className={`${
                                                star <= rating ? 'text-pink-500' : 'text-gray-300'
                                            } hover:text-pink-500 focus:text-pink-500 text-2xl focus:outline-none transition-colors`}
                                        >
                                            <FaStar />
                                        </button>
                                    ))}
                                </div>
                                {reviewErrors.rating && (
                                    <p className="mt-1 text-sm text-red-500">{reviewErrors.rating}</p>
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
                                        setReviewErrors(prev => ({ ...prev, reviewComment: undefined }));
                                    }}
                                    className={`w-full px-4 py-3 rounded-md border ${
                                        reviewErrors.reviewComment ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none placeholder-gray-400 text-black`}
                                    placeholder="Share your experience with us..."
                                ></textarea>
                                {reviewErrors.reviewComment && (
                                    <p className="mt-1 text-sm text-red-500">{reviewErrors.reviewComment}</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsReviewModalOpen(false);
                                        setSelectedAppointment(null);
                                        setRating(0);
                                        setReviewComment('');
                                    }}
                                    className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium transition-colors ${
                                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </form>

                        {/* Success Message */}
                        {reviewSuccessMessage && (
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
                                Review submitted successfully!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white/95 rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-xl backdrop-blur-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Medical Report</h2>
                            <button
                                onClick={() => {
                                    setIsReportModalOpen(false);
                                    setReportData(null);
                                }}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {isLoadingReport ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                            </div>
                        ) : reportError ? (
                            <div className="text-center py-8">
                                <p className="text-red-600">{reportError}</p>
                            </div>
                        ) : reportData && (
                            <div className="space-y-6">
                                {/* Last Updated */}
                                <div className="text-sm text-gray-500">
                                    Last updated: {reportData.updatedAt.split('T')[0]}, {new Date(reportData.updatedAt).toLocaleString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                        timeZone: 'UTC'
                                    })}
                                </div>

                                {/* Mammogram Section */}
                                {reportData.mammograms && reportData.mammograms.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Mammogram Results</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {reportData.mammograms.map((mammogram: any, index: number) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="aspect-w-16 aspect-h-9 mb-4">
                                                        <Image
                                                            src={mammogram.image}
                                                            alt="Mammogram"
                                                            width={400}
                                                            height={300}
                                                            className="rounded-lg object-cover"
                                                        />
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            mammogram.predictionResult === 'Malignant' 
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {mammogram.predictionResult}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description Section */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Medical Description</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap">{reportData.description}</p>
                                    </div>
                                </div>

                                {/* Medications Section */}
                                {reportData.medications && reportData.medications.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Prescribed Medications</h3>
                                        <ul className="list-disc pl-5 space-y-2">
                                            {reportData.medications.map((medication: string, index: number) => (
                                                <li key={index} className="text-gray-700">{medication}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Footer with download button */}
                                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center">
                                    <button
                                        onClick={() => handleDownloadReport(reportData)}
                                        className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                        disabled={isLoadingReport}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
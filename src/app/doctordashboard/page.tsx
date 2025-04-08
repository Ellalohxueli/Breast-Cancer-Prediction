'use client';

import { Poppins } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiHome, FiCalendar, FiUsers, FiMessageSquare, FiFileText, FiLogOut, FiGrid, FiBell, FiSun, FiMoon, FiUser, FiMessageCircle, FiChevronDown, FiClock, FiMoreVertical } from 'react-icons/fi';
import useCheckCookies from '@/controller/UseCheckCookie';
import { FaRegUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import UseRemoveLocalStorage from '@/controller/UseRemoveLocalStorage';
import DoctorNavBar from '@/components/DoctorNavBar';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

interface Patient {
    _id: string;
    firstname: string;
    lastname: string;
    dob: string;
    image?: string;
}

interface BookedAppointment {
    _id: string;
    patient: Patient;
    dateRange: {
        startDate: string;
    };
    timeSlot: {
        startTime: string;
        endTime: string;
    };
    appointmentType: string;
    status: string;
    patientReports?: {
        appointmentId: string;
        report: {
            _id: string;
            patientId: string;
            appointments: {
                doctorId: string;
                appointmentId: string;
                dateRange: {
                    startDate: string;
                };
                appointmentType: string;
            }[];
            mammograms: {
                image: string;
                predictionResult: string;
            }[];
            description: string;
            medications: string[];
            createdAt: string;
            updatedAt: string;
        } | null;
    }[];
}

interface Review {
    _id: string;
    name: string;
    date: string;
    rating: number;
    comment: string;
}

export default function DoctorDashboard() {
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctorName, setDoctorName] = useState('');
    const [profileImage, setProfileImage] = useState('');
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
        status: ''
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
    const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [appointmentError, setAppointmentError] = useState<string | null>(null);
    const [totalPatients, setTotalPatients] = useState(0);
    const [todayStats, setTodayStats] = useState({
        total: 0,
        completed: 0,
        remaining: 0
    });
    const [excludedPatients, setExcludedPatients] = useState(0);
    const [isMedicalPassModalOpen, setIsMedicalPassModalOpen] = useState(false);
    const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<BookedAppointment | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    // Check Cookies Token
    useCheckCookies();

    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

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

    // Add this useEffect to fetch doctor profile data when modal opens
    useEffect(() => {
        if (isProfileModalOpen) {
            const fetchDoctorProfile = async () => {
                try {
                    const response = await axios.get('/api/doctors/profile');
                    if (response.data.success) {
                        const profileData = response.data.data;
                        setDoctorProfile(prev => ({
                            ...prev,
                            ...profileData,
                            status: profileData.status
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching doctor profile:', error);
                }
            };
            fetchDoctorProfile();
        }
    }, [isProfileModalOpen]);

    // Update the function to calculate today's appointments
    const calculateTodayAppointments = (appointments: any[]) => {
        const today = new Date();
        const todayAppointments = appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.dateRange.startDate);
            return appointmentDate.toDateString() === today.toDateString();
        });

        // Count all appointments for today, excluding 'Cancelled' and 'Rescheduled'
        const total = todayAppointments.filter(app => 
            app.status !== 'Cancelled' && app.status !== 'Rescheduled'
        ).length;
        const completed = todayAppointments.filter(app => app.status === 'Completed').length;
        const remaining = todayAppointments.filter(app => app.status === 'Booked' || app.status === 'Ongoing').length;

        return {
            total,
            completed,
            remaining
        };
    };

    // Update the useEffect that fetches appointments
    useEffect(() => {
        const fetchTodayAppointments = async () => {
            setIsLoadingAppointments(true);
            setAppointmentError(null);
            try {
                const response = await axios.get('/api/doctors/appointment');
                if (response.data.success) {
                    setTodayAppointments(response.data.appointments);
                    
                    // Calculate today's appointment stats
                    const stats = calculateTodayAppointments(response.data.appointments);
                    setTodayStats(stats);
                    
                    // Set total patients count - handle potential undefined
                    const totalCount = response.data.totalPatientsCount || 0;
                    setTotalPatients(totalCount);
                    
                    // Set excluded patients count
                    const excludedCount = response.data.excludedPatientsCount || 0;
                    setExcludedPatients(excludedCount);
                    
                }
            } catch (error: any) {
                console.error('Error fetching appointments:', error);
                setAppointmentError(error.response?.data?.error || 'Failed to load appointments');
            } finally {
                setIsLoadingAppointments(false);
            }
        };

        fetchTodayAppointments();
    }, []);

    // Add new useEffect for fetching reviews
    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoadingReviews(true);
            setReviewError(null);
            try {
                const response = await axios.get('/api/doctors/reviews');
                if (response.data.success) {
                    setReviews(response.data.reviews);
                    setAverageRating(response.data.averageRating);
                }
            } catch (error: any) {
                console.error('Error fetching reviews:', error);
                setReviewError(error.response?.data?.error || 'Failed to load reviews');
            } finally {
                setIsLoadingReviews(false);
            }
        };

        fetchReviews();
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleLogout = async () => {
        try {
            await axios.get('/api/users/logout');
            
            UseRemoveLocalStorage();
            
            router.push('/login');
        } catch (error: any) {
            localStorage.removeItem("firstname");
            localStorage.removeItem("userId");
    
            localStorage.removeItem("doctorId");
            localStorage.removeItem("name");
            localStorage.removeItem("image");
            sessionStorage.removeItem('token');
    
            localStorage.removeItem("userType");

            router.push('/login');
        }
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setIsProfileOpen(false);
    };

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
            status: ''
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

    // Add a helper function to format the status
    const formatStatus = (status: string): string => {
        if (status === 'out_of_office') {
            return 'Out of Office';
        }
        return status.charAt(0).toUpperCase() + status.slice(1);
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

    // Update the handlePasswordChange function
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
                handleCloseModal(); // Use handleCloseModal instead of setIsProfileModalOpen(false)
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

    // Update the StatusIndicator component
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

    // Add this function after your component's state declarations
    const formatTime = (time: string) => {
        // Convert 24-hour format to 12-hour format with AM/PM
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    // Update the getAppointmentStatus function
    const getAppointmentStatus = (status: string) => {
        switch (status) {
            case 'Booked':
                return {
                    style: 'bg-yellow-100 text-yellow-800',
                    text: 'Upcoming'
                };
            case 'Completed':
                return {
                    style: 'bg-green-100 text-green-800',
                    text: 'Completed'
                };
            case 'Cancelled':
                return {
                    style: 'bg-red-100 text-red-800',
                    text: 'Cancelled'
                };
            case 'Rescheduled':
                return {
                    style: 'bg-orange-100 text-orange-800',
                    text: 'Rescheduled'
                };
            default:
                return {
                    style: 'bg-gray-100 text-gray-800',
                    text: status
                };
        }
    };

    // Update the getNextAppointment function
    const getNextAppointment = (appointments: BookedAppointment[]) => {
        const nextAppointment = appointments
            .filter((appointment: BookedAppointment) => {
                return (appointment.status === 'Booked' || 
                       appointment.status === 'Ongoing' ||
                       getAppointmentStatus(appointment.status).text === 'Upcoming');
            })
            .sort((a: BookedAppointment, b: BookedAppointment): number => {
                if (a.status === 'Ongoing' && b.status !== 'Ongoing') return -1;
                if (a.status !== 'Ongoing' && b.status === 'Ongoing') return 1;
                
                const aTime = new Date(a.dateRange.startDate);
                const bTime = new Date(b.dateRange.startDate);
                aTime.setHours(parseInt(a.timeSlot.startTime.split(':')[0]), parseInt(a.timeSlot.startTime.split(':')[1]));
                bTime.setHours(parseInt(b.timeSlot.startTime.split(':')[0]), parseInt(b.timeSlot.startTime.split(':')[1]));
                return aTime.getTime() - bTime.getTime();
            })[0];

        // If there are no ongoing appointments, ensure doctor status is "Active"
        const hasOngoingAppointment = appointments.some(app => app.status === 'Ongoing');
        if (!hasOngoingAppointment && currentStatus === 'Busy') {
            updateDoctorStatus('Active');
        }

        return nextAppointment;
    };

    // Add this helper function after your state declarations
    const isCurrentMonth = (date: string) => {
        const appointmentDate = new Date(date);
        const now = new Date();
        return appointmentDate.getMonth() === now.getMonth() && 
               appointmentDate.getFullYear() === now.getFullYear();
    };

    const handleCancelAppointment = async (appointment: BookedAppointment) => {
        try {
            // Create the notification with all required data
            const notificationData = {
                appointmentId: appointment._id,
                patientId: appointment.patient._id,
                appointmentDate: new Date(appointment.dateRange.startDate).toISOString(), // Convert to ISO string
                appointmentDay: new Date(appointment.dateRange.startDate).toLocaleDateString('en-US', { weekday: 'long' }),
                appointmentTime: appointment.timeSlot.startTime,
                status: 'cancelled'
            };

            try {
                const response = await axios.post('/api/notifications', notificationData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    toast.success('Appointment cancelled successfully');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            } catch (axiosError: any) {
                console.error('Axios error:', {
                    message: axiosError.message,
                    response: axiosError.response?.data,
                    status: axiosError.response?.status,
                    data: axiosError.response?.data
                });
                throw new Error(axiosError.response?.data?.error || axiosError.message);
            }
        } catch (error: any) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            toast.error(error.message || 'Failed to cancel appointment');
        }
    };

    const handleRescheduleAppointment = async (appointment: BookedAppointment) => {
        try {
            // Create the notification with all required data
            const notificationData = {
                appointmentId: appointment._id,
                patientId: appointment.patient._id,
                appointmentDate: new Date(appointment.dateRange.startDate).toISOString(), // Convert to ISO string
                appointmentDay: new Date(appointment.dateRange.startDate).toLocaleDateString('en-US', { weekday: 'long' }),
                appointmentTime: appointment.timeSlot.startTime,
                status: 'rescheduled'
            };

            try {
                const response = await axios.post('/api/notifications', notificationData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    toast.success('Appointment rescheduled successfully');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            } catch (axiosError: any) {
                console.error('Axios error:', {
                    message: axiosError.message,
                    response: axiosError.response?.data,
                    status: axiosError.response?.status,
                    data: axiosError.response?.data
                });
                throw new Error(axiosError.response?.data?.error || axiosError.message);
            }
        } catch (error: any) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            toast.error(error.message || 'Failed to reschedule appointment');
        }
    };

    const handleVisitClick = async (appointment: BookedAppointment) => {
        try {
            // Log the appointment details
            console.log('Selected Appointment Details:', {
                appointmentId: appointment._id,
                patientId: appointment.patient._id,
                patientName: `${appointment.patient.firstname} ${appointment.patient.lastname}`,
                date: appointment.dateRange.startDate,
                timeSlot: appointment.timeSlot,
                status: appointment.status,
                appointmentType: appointment.appointmentType
            });

            // Update appointment status to "Ongoing"
            const response = await axios.put(`/api/doctors/appointment/${appointment._id}`);
            console.log('Appointment status update response:', response.data);

            if (response.data.success) {
                // Update local state
                setTodayAppointments(prevAppointments => 
                    prevAppointments.map(app => 
                        app._id === appointment._id 
                            ? { ...app, status: 'Ongoing' }
                            : app
                    )
                );

                // Update doctor status to "Busy"
                await updateDoctorStatus('Busy');
                console.log('Doctor status updated to Busy');

                // Fetch completed appointments for the patient
                const patientAppointmentsResponse = await axios.get(`/api/doctors/appointment/patient/${appointment.patient._id}`);
                console.log('Patient completed appointments:', patientAppointmentsResponse.data);

                // Create a new appointment object with the patient appointments
                const appointmentWithHistory = {
                    ...appointment,
                    patientReports: patientAppointmentsResponse.data.patientReports || []
                };

                // Open medical pass modal with the updated appointment data
                setSelectedPatientForVisit(appointmentWithHistory);
                setIsMedicalPassModalOpen(true);
                console.log('Medical pass modal opened with appointment:', {
                    appointment: appointmentWithHistory,
                    lastVisitDate: patientAppointmentsResponse.data.patientReports?.[0]?.report?.createdAt
                });
            }
        } catch (error: any) {
            console.error('Error in handleVisitClick:', {
                error: error.message,
                response: error.response?.data,
                appointmentId: appointment._id
            });
            toast.error(error.response?.data?.error || 'Failed to update appointment status');
        }
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

    // Add new function to handle appointment completion
    const handleCompleteAppointment = async (appointment: BookedAppointment) => {
        try {
            // Update appointment status to "Completed"
            const response = await axios.put(`/api/doctors/appointment/${appointment._id}/complete`);

            if (response.data.success) {
                // Update local state
                setTodayAppointments(prevAppointments => 
                    prevAppointments.map(app => 
                        app._id === appointment._id 
                            ? { ...app, status: 'Completed' }
                            : app
                    )
                );

                // Update doctor status back to "Active"
                await updateDoctorStatus('Active');

                toast.success('Appointment completed successfully');
            }
        } catch (error: any) {
            console.error('Error completing appointment:', error);
            toast.error(error.response?.data?.error || 'Failed to complete appointment');
        }
    };

    const handleCloseMedicalPassModal = () => {
        setSelectedPatientForVisit(null);
        setIsMedicalPassModalOpen(false);
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} ${poppins.className}`}>
            {/* Sidebar - Fixed */}
            <DoctorNavBar />

            {/* Main Content */}
            <div className="ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Dashboard
                        </h1>
                        <p className={`text-base ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                            {currentDate}
                        </p>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-6">

                        {/* Notifications */}
                        <button className="relative">
                            <FiBell className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                3
                            </span>
                        </button>

                        {/* Vertical Divider */}
                        <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

                        <div className="flex items-center space-x-3">
                            {/* Theme Toggle */}
                            {/* <div className={`flex items-center justify-between w-16 h-8 rounded-full p-1 cursor-pointer ${
                                isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
                            }`}
                            onClick={toggleTheme}>
                                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                                    isDarkMode ? 'bg-transparent' : 'bg-white'
                                }`}>
                                    <FiSun className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-pink-800'}`} />
                                </div>
                                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                                    isDarkMode ? 'bg-white' : 'bg-transparent'
                                }`}>
                                    <FiMoon className={`w-4 h-4 ${isDarkMode ? 'text-gray-800' : 'text-gray-400'}`} />
                                </div>
                            </div> */}

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
                                    <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 ${
                                        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                                    }`}>
                                        <button
                                            onClick={handleProfileClick}
                                            className={`w-full text-left px-4 py-2 text-sm ${
                                                isDarkMode 
                                                    ? 'text-gray-200 hover:bg-gray-700' 
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            } transition-colors flex items-center space-x-2`}
                                        >
                                            <FaRegUser className="h-4 w-4 mr-3" />
                                            <span>Profile</span>
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className={`w-full text-left px-4 py-2 text-sm ${
                                                isDarkMode 
                                                    ? 'text-red-400 hover:bg-gray-700' 
                                                    : 'text-red-600 hover:bg-gray-50'
                                            } transition-colors flex items-center space-x-2`}
                                        >
                                            <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                />
                                            </svg>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Adjusted for fixed header */}
                <div className="pt-24">
                    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Total Patients Card */}
                            <div className={`p-6 rounded-xl shadow-sm ${
                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className={`text-sm font-medium ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Total Patients</h3>
                                    </div>
                                    <div className={`p-3 rounded-lg ${
                                        isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
                                    }`}>
                                        <FiUsers className={`w-6 h-6 ${
                                            isDarkMode ? 'text-pink-400' : 'text-pink-600'
                                        }`} />
                                    </div>
                                </div>
                                <p className={`text-4xl font-bold -mt-3 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{totalPatients - (excludedPatients || 0)}</p>
                            </div>

                            {/* Today's Appointments Card */}
                            <div className={`p-6 rounded-xl shadow-sm ${
                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className={`text-sm font-medium ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Today's Appointments</h3>
                                        <p className={`text-2xl font-bold mt-1 ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>{todayStats.total}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${
                                        isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
                                    }`}>
                                        <FiCalendar className={`w-6 h-6 ${
                                            isDarkMode ? 'text-pink-400' : 'text-pink-600'
                                        }`} />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {todayStats.completed} completed
                                    </span>
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>•</span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                                        {todayStats.remaining} remaining
                                    </span>
                                </div>
                            </div>

                            {/* Average Review Score Card */}
                            <div className={`p-6 rounded-xl shadow-sm ${
                                isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className={`text-sm font-medium ${
                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Average Review Score</h3>
                                    </div>
                                    <div className="flex -space-x-1">
                                        {[...Array(5)].map((_, index) => (
                                            <svg key={index} className={`w-5 h-5 ${index < Math.round(averageRating) ? 'text-pink-500' : 'text-pink-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                                <p className={`text-4xl font-bold ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{averageRating}</p>
                            </div>
                        </div>

                        {/* Main Dashboard Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Today's Appointments Section - Left Column */}
                            <div className={`lg:col-span-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm h-[calc(100vh-0px)]`}>
                                <div className="flex flex-col h-full">
                                    <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Today's Appointments
                                        </h2>
                                    </div>

                                    {/* Appointments List - Make it scrollable */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {isLoadingAppointments ? (
                                            <div className="flex justify-center items-center h-full">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                                            </div>
                                        ) : appointmentError ? (
                                            <div className="text-center text-red-600">
                                                <p>{appointmentError}</p>
                                            </div>
                                        ) : todayAppointments.length === 0 ? (
                                            <div className="text-center text-gray-500">
                                                <p>No appointments scheduled for today</p>
                                            </div>
                                        ) : (
                                            // Sort appointments: active appointments first, then completed/cancelled/rescheduled
                                            [...todayAppointments].sort((a, b) => {
                                                const isActiveA = !['Completed', 'Cancelled', 'Rescheduled'].includes(a.status);
                                                const isActiveB = !['Completed', 'Cancelled', 'Rescheduled'].includes(b.status);
                                                
                                                if (isActiveA === isActiveB) {
                                                    // If both are active or both are inactive, sort by time
                                                    return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
                                                }
                                                return isActiveA ? -1 : 1;
                                            }).map((appointment) => (
                                                    <div 
                                                        key={appointment._id}
                                                        className={`p-4 rounded-lg ${
                                                            isDarkMode 
                                                                ? appointment.status === 'Cancelled'
                                                                    ? 'bg-gray-700/50'
                                                                    : 'bg-gray-700 hover:bg-gray-600'
                                                                : appointment.status === 'Cancelled'
                                                                    ? 'bg-gray-50/80'
                                                                    : 'bg-gray-50 hover:bg-gray-100'
                                                        } transition-colors`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`w-10 h-10 rounded-full overflow-hidden ${
                                                                    isDarkMode ? 'bg-pink-200' : 'bg-pink-100'
                                                                }`}>
                                                                    {appointment.patient.image ? (
                                                                        <img
                                                                            src={appointment.patient.image}
                                                                            alt={`${appointment.patient.firstname} ${appointment.patient.lastname}`}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className={`w-full h-full flex items-center justify-center ${
                                                                            isDarkMode ? 'text-pink-400' : 'text-pink-600'
                                                                        }`}>
                                                                            {appointment.patient.firstname[0]}
                                                                            {appointment.patient.lastname[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-medium ${
                                                                        appointment.status === 'Cancelled'
                                                                            ? isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                                            : isDarkMode ? 'text-white' : 'text-gray-900'
                                                                    }`}>
                                                                        {`${appointment.patient?.firstname} ${appointment.patient?.lastname}`}
                                                                    </p>
                                                                    <p className={`text-xs ${
                                                                        appointment.status === 'Cancelled'
                                                                            ? isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                                    }`}>
                                                                        {appointment.appointmentType}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="text-right">
                                                                <p className={`text-sm font-medium mb-2 ${
                                                                    appointment.status === 'Cancelled'
                                                                        ? isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                                        : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                                }`}>
                                                                    {formatTime(appointment.timeSlot.startTime)}
                                                                </p>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAppointmentStatus(appointment.status).style}`}>
                                                                    {getAppointmentStatus(appointment.status).text}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Action buttons - Only show for active appointments */}
                                                        {(appointment.status !== 'Cancelled' && appointment.status !== 'Rescheduled') && (
                                                            <div className="flex justify-end mt-3 space-x-2">
                                                                <div className="flex gap-2">
                                                                    {appointment.status === 'Booked' && (
                                                                        <button 
                                                                            onClick={() => handleRescheduleAppointment(appointment)}
                                                                            className={`p-2 rounded-lg ${
                                                                                isDarkMode 
                                                                                    ? 'bg-orange-600 hover:bg-orange-500 text-gray-300' 
                                                                                    : 'bg-orange-200 hover:bg-orange-300 text-gray-700'
                                                                            } transition-colors`}
                                                                        >
                                                                            <FiCalendar className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    
                                                                    {appointment.status === 'Booked' && (
                                                                        <button 
                                                                            onClick={() => handleCancelAppointment(appointment)}
                                                                            className={`p-2 rounded-lg ${
                                                                                isDarkMode 
                                                                                    ? 'bg-red-600 hover:bg-red-500 text-gray-300' 
                                                                                    : 'bg-red-200 hover:bg-red-300 text-gray-700'
                                                                            } transition-colors`}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Other columns will go here */}
                            <div className="lg:col-span-2 flex flex-col space-y-6">
                                {/* Next Patient Details Card */}
                                <div className={`rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="p-6">
                                        <h2 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Next Patient
                                        </h2>
                                        
                                        {isLoadingAppointments ? (
                                            <div className="flex justify-center items-center h-40">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                                            </div>
                                        ) : appointmentError ? (
                                            <div className="text-center text-red-600 h-40 flex items-center justify-center">
                                                <p>{appointmentError}</p>
                                            </div>
                                        ) : (() => {
                                            const nextAppointment = getNextAppointment(todayAppointments);
                                            
                                            if (!nextAppointment) {
                                                return (
                                                    <div className="text-center h-40 flex items-center justify-center">
                                                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            No more appointments for today
                                                        </p>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <>
                                                    {/* Patient Info Section */}
                                                    <div className="flex items-start space-x-4 mb-6">
                                                        <div className="w-16 h-16 rounded-full bg-pink-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                            {nextAppointment.patient?.image ? (
                                                                <Image 
                                                                    src={nextAppointment.patient.image}
                                                                    alt={`${nextAppointment.patient.firstname} ${nextAppointment.patient.lastname}`}
                                                                    width={64}
                                                                    height={64}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className={`text-xl font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                                                                    {nextAppointment.patient?.firstname?.charAt(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {`${nextAppointment.patient?.firstname} ${nextAppointment.patient?.lastname}`}
                                                            </h3>
                                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                                                Age: {new Date().getFullYear() - new Date(nextAppointment.patient?.dob).getFullYear()} years old
                                                            </p>
                                                            <div className="flex flex-col mt-1 space-y-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    nextAppointment.appointmentType === 'Consultation'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : 'bg-green-100 text-green-800'
                                                                } w-fit`}>
                                                                    {nextAppointment.appointmentType}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Appointment Time */}
                                                    <div className={`mb-6 flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <FiClock className="w-4 h-4" />
                                                        <span className="text-sm">
                                                            Appointment at {formatTime(nextAppointment.timeSlot.startTime)}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center space-x-4">
                                                        <button 
                                                            onClick={() => handleVisitClick(nextAppointment)}
                                                            className={`flex-grow px-8 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                                isDarkMode
                                                                    ? 'bg-pink-500 hover:bg-pink-600 text-white'
                                                                    : 'bg-pink-600 hover:bg-pink-700 text-white'
                                                            }`}
                                                        >
                                                            {nextAppointment.status === 'Ongoing' ? 'Continue' : 'Visit'}
                                                        </button>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Patient Reviews Card */}
                                <div className={`mt-6 rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Patient Reviews
                                            </h2>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{averageRating}</span>
                                                <div className="flex -space-x-1">
                                                    {[...Array(5)].map((_, index) => (
                                                        <svg key={index} className={`w-5 h-5 ${index < Math.round(averageRating) ? 'text-pink-500' : 'text-pink-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reviews List */}
                                        <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
                                            {isLoadingReviews ? (
                                                <div className="flex justify-center items-center h-40">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                                                </div>
                                            ) : reviewError ? (
                                                <div className="text-center text-red-600 h-40 flex items-center justify-center">
                                                    <p>{reviewError}</p>
                                                </div>
                                            ) : reviews.length === 0 ? (
                                                <div className="text-center h-40 flex items-center justify-center">
                                                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        No reviews yet
                                                    </p>
                                                </div>
                                            ) : (
                                                reviews.map((review) => (
                                                    <div key={review._id} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {review.name}
                                                                </h4>
                                                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    {review.date}
                                                                </span>
                                                            </div>
                                                            <div className="flex">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg 
                                                                        key={i} 
                                                                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                                                        fill="currentColor" 
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                            {review.comment}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

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
                                                ? isDarkMode
                                                    ? 'bg-pink-500 text-white'
                                                    : 'bg-pink-600 text-white'
                                                : isDarkMode
                                                    ? 'text-gray-400 hover:bg-gray-700'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        Account
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('password')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            activeTab === 'password'
                                                ? isDarkMode
                                                    ? 'bg-pink-500 text-white'
                                                    : 'bg-pink-600 text-white'
                                                : isDarkMode
                                                    ? 'text-gray-400 hover:bg-gray-700'
                                                    : 'text-gray-600 hover:bg-gray-100'
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
                                                <div className="w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center overflow-hidden relative">
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
                                                Age: {new Date().getFullYear() - new Date(selectedPatientForVisit.patient?.dob).getFullYear()} years old
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
                                            <span>
                                                {selectedPatientForVisit.patientReports && 
                                                 selectedPatientForVisit.patientReports.length > 0 &&
                                                 selectedPatientForVisit.patientReports[0].report?.createdAt
                                                    ? new Date(selectedPatientForVisit.patientReports[0].report.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })
                                                    : 'No previous visits'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Test Results */}
                                <div className="mb-6">
                                    <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Recent Test Results
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedPatientForVisit.patientReports && selectedPatientForVisit.patientReports.length > 0 ? (
                                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                                                <div className="flex items-center space-x-4 mb-4">
                                                    <div className="relative w-24 h-24">
                                                        {selectedPatientForVisit.patientReports[0].report?.mammograms && selectedPatientForVisit.patientReports[0].report.mammograms.length > 0 ? (
                                                            <Image
                                                                src={selectedPatientForVisit.patientReports[0].report.mammograms[0].image}
                                                                alt="Mammogram"
                                                                fill
                                                                className="object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>N/A</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {selectedPatientForVisit.patientReports[0].report?.mammograms && selectedPatientForVisit.patientReports[0].report.mammograms.length > 0 
                                                                ? selectedPatientForVisit.patientReports[0].report.mammograms[0].predictionResult 
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    <p>{selectedPatientForVisit.patientReports[0].report?.description || 'No description available'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                No test results available
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Medications */}
                                <div className="mb-6">
                                    <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Medications
                                    </h3>
                                    <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {selectedPatientForVisit.patientReports && selectedPatientForVisit.patientReports.length > 0 ? (
                                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                                                <div className="space-y-2">
                                                    {selectedPatientForVisit.patientReports[0].report?.medications && selectedPatientForVisit.patientReports[0].report.medications.length > 0 ? (
                                                        selectedPatientForVisit.patientReports[0].report.medications.map((medication, medIndex) => (
                                                            <div key={medIndex} className="flex items-center space-x-2">
                                                                <span className="text-sm">{medication}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            N/A
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                No medications recorded
                                            </p>
                                        )}
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

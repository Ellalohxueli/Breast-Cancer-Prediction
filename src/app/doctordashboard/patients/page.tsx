'use client';

import { Poppins } from 'next/font/google';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { FiBell, FiChevronDown, FiX } from "react-icons/fi";
import { FaRegUser } from "react-icons/fa";
import { toast } from "react-hot-toast";
import DoctorNavBar from '@/components/DoctorNavBar';
import useCheckCookies from '@/controller/UseCheckCookie';
import UseRemoveLocalStorage from '@/controller/UseRemoveLocalStorage';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export default function PatientsPage() {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctorName, setDoctorName] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [totalAppointments, setTotalAppointments] = useState(0);
    const [completedAppointments, setCompletedAppointments] = useState(0);
    const [completedPatients, setCompletedPatients] = useState<Array<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        patientId: string;
        appointmentId: string;
        date: string;
        time: string;
        status: string;
        sex: string;
        dob: string;
        role: string;
        mammogramResult: string;
        predictionResult: string;
        description: string;
        reportId: string;
        reportCreatedAt: string;
        appointmentType: string;
        mammogramImage: string;
        day: string;
        reviews: any[];
    }>>([]);
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
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Check Cookies Token
    useCheckCookies();

    useEffect(() => {
        const storedName = localStorage.getItem('name');
        const storedImage = localStorage.getItem('image');
        const storedId = localStorage.getItem('id');
        
        if (storedName) {
            setDoctorName(storedName);
        }
        if (storedImage) {
            setProfileImage(storedImage);
        }
        if (storedId) {
            setDoctorId(storedId);
            console.log('Doctor ID from localStorage:', storedId);
        }

        // Fetch doctor ID and appointments
        const getDoctorData = async () => {
            try {
                const response = await axios.get('/api/doctors/profile');
                if (response.data.success) {
                    const id = response.data.data._id;
                    setDoctorId(id);
                    console.log('Doctor ID from API:', id);
                    
                    // Fetch appointments
                    const appointmentsResponse = await axios.get('/api/doctors/appointments');
                    if (appointmentsResponse.data.success) {
                        const appointments = appointmentsResponse.data.data;
                        const total = appointmentsResponse.data.totalAppointments;
                        setTotalAppointments(total);
                        
                        // Filter completed appointments and extract patient info
                        const completedAppts = appointments.filter((appointment: any) => 
                            appointment.status === 'Completed'
                        );
                        setCompletedAppointments(completedAppts.length);
                        
                        // Extract patient information from completed appointments
                        const patientInfo = completedAppts.map((appointment: any) => {
                            // Get patient ID and appointment ID
                            const patientId = appointment.patient?._id;
                            const appointmentId = appointment._id;
                            const date = appointment.dateRange?.startDate;
                            const time = appointment.timeSlot?.startTime;
                            const status = appointment.status;
                            const appointmentType = appointment.appointmentType;
                            const day = appointment.dateRange?.day || 'N/A';
                            const reviews = appointment.reviews || [];
                            
                            // Log booked appointment details
                            console.log('\n=== Booked Appointment Details ===');
                            console.log('Appointment ID:', appointmentId);
                            console.log('Patient ID:', patientId);
                            console.log('Doctor ID:', appointment.doctorId);
                            console.log('Date:', date);
                            console.log('Day:', day);
                            console.log('Time:', time);
                            console.log('Status:', status);
                            console.log('Appointment Type:', appointmentType);
                            console.log('Reviews:', reviews);
                            console.log('Date Range:', {
                                startDate: appointment.dateRange?.startDate,
                                endDate: appointment.dateRange?.endDate
                            });
                            console.log('Time Slot:', {
                                startTime: appointment.timeSlot?.startTime,
                                endTime: appointment.timeSlot?.endTime
                            });
                            console.log('Created At:', appointment.createdAt);
                            console.log('Updated At:', appointment.updatedAt);
                            console.log('===============================\n');
                            
                            // Get report details
                            const report = appointment.report;
                            
                            // Log complete patient report details
                            console.log('\n=== Patient Report Details ===');
                            console.log('Report ID:', report?._id);
                            console.log('Patient ID:', report?.patientId);
                            console.log('Description:', report?.description || 'No description available');
                            console.log('Appointment Type:', appointment.appointmentType || 'No appointment type available');
                            
                            // Log appointments
                            console.log('\nAppointments:');
                            report?.appointments?.forEach((appt: any, index: number) => {
                                console.log(`\nAppointment ${index + 1}:`);
                                console.log('- Doctor ID:', appt.doctorId);
                                console.log('- Appointment ID:', appt.appointmentId);
                                console.log('- Date Range:');
                                console.log('  * Start Date:', appt.dateRange?.startDate);
                                console.log('  * Day:', appt.dateRange?.day);
                                console.log('- Time Slot:');
                                console.log('  * Start Time:', appt.timeSlot?.startTime);
                                console.log('  * Appointment Type:', appt.appointmentType);
                                console.log('- Appointment ID:', appt._id);
                            });
                            
                            // Log mammograms
                            console.log('\nMammograms:');
                            report?.mammograms?.forEach((mammogram: any, index: number) => {
                                console.log(`\nMammogram ${index + 1}:`);
                                console.log('- Image:', mammogram.image ? 'Available' : 'Not available');
                                console.log('- Prediction Result:', mammogram.predictionResult);
                                console.log('- Mammogram ID:', mammogram._id);
                            });
                            
                            // Log medications
                            console.log('\nMedications:', report?.medications?.length ? report.medications : 'No medications');
                            
                            // Log timestamps
                            console.log('\nTimestamps:');
                            console.log('- Created At:', report?.createdAt);
                            console.log('- Updated At:', report?.updatedAt);
                            console.log('===============================\n');
                            
                            // Get prediction result and description from report
                            const mammogram = report?.mammograms?.[0];
                            const predictionResult = mammogram?.predictionResult || 'No result';
                            const description = report?.description || 'No description available';
                            const mammogramImage = mammogram?.image || '';
                            
                            return {
                                firstName: appointment.patient?.firstname || 'N/A',
                                lastName: appointment.patient?.lastname || 'N/A',
                                email: appointment.patient?.email || 'N/A',
                                phone: appointment.patient?.phone || 'N/A',
                                patientId: patientId || 'N/A',
                                appointmentId: appointmentId || 'N/A',
                                date: date || 'N/A',
                                time: time || 'N/A',
                                status: status || 'N/A',
                                predictionResult: predictionResult,
                                description: description,
                                mammogramImage: mammogramImage,
                                appointmentType: appointmentType || 'N/A',
                                day: day,
                                reportId: report?._id || 'N/A',
                                reportCreatedAt: report?.createdAt || 'N/A',
                                reviews: reviews
                            };
                        });

                        // Sort patients by appointment date and time in descending order
                        const sortedPatientInfo = patientInfo.sort((a: { date: string; time: string }, b: { date: string; time: string }) => {
                            // Debug logs to see the actual date and time format
                            console.log('Date A:', a.date, 'Time A:', a.time);
                            console.log('Date B:', b.date, 'Time B:', b.time);

                            // Parse the dates and times into proper Date objects
                            const dateA = new Date(a.date);
                            const dateB = new Date(b.date);

                            // If dates are equal, compare times
                            if (dateA.getTime() === dateB.getTime()) {
                                const [aHour, aMinute] = a.time.split(':');
                                const [bHour, bMinute] = b.time.split(':');
                                const timeA = parseInt(aHour) * 60 + parseInt(aMinute);
                                const timeB = parseInt(bHour) * 60 + parseInt(bMinute);
                                return timeB - timeA;
                            }

                            return dateB.getTime() - dateA.getTime();
                        });

                        // Debug log to see the sorted results
                        console.log('Sorted appointments:', sortedPatientInfo.map((p: { date: string; time: string }) => ({
                            date: p.date,
                            time: p.time
                        })));

                        setCompletedPatients(sortedPatientInfo);
                        
                        console.log('Total appointments for doctor:', total);
                        console.log('Completed appointments:', completedAppts.length);
                        console.log('Patients with completed appointments:', sortedPatientInfo);
                    }
                }
            } catch (error) {
                console.error('Error fetching doctor data:', error);
            }
        };
        getDoctorData();

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

    const handleLogout = async () => {
        try {
            await axios.get('/api/users/logout');
            UseRemoveLocalStorage();
            router.push('/login');
        } catch (error) {
            UseRemoveLocalStorage();
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

    const handleCloseModal = () => {
        resetFormStates();
        setIsProfileModalOpen(false);
    };

    const handleSaveProfile = async () => {
        setFormErrors({
            phone: ''
        });
        setError('');

        try {
            const malaysiaOffset = 8 * 60 * 60 * 1000;
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
            const response = await axios.put('/api/doctors/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (response.data.success) {
                handleCloseModal();
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

    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const handleViewPatient = (patient: any) => {
        console.log('\n=== Patient Details ===');
        console.log('Basic Information:');
        console.log('Full Name:', `${patient.firstName} ${patient.lastName}`);
        console.log('Email:', patient.email);
        console.log('Phone:', patient.phone);
        console.log('Patient ID:', patient.patientId);
        console.log('Appointment ID:', patient.appointmentId);
        
        console.log('\nAppointment Details:');
        console.log('Date:', new Date(patient.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
        console.log('Time:', patient.time);
        console.log('Appointment Type:', patient.appointmentType);
        
        console.log('\nMedical Information:');
        console.log('Prediction Result:', patient.predictionResult);
        console.log('Description:', patient.description);
        console.log('Mammogram Image URL:', patient.mammogramImage);
        
        console.log('\nReport Information:');
        console.log('Report ID:', patient.reportId);
        console.log('Report Created At:', new Date(patient.reportCreatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
        console.log('===============================\n');

        setSelectedPatient(patient);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedPatient(null);
    };

    return (
        <div className={`min-h-screen bg-gray-100 ${poppins.className}`}>
            {/* Sidebar - Fixed */}
            <DoctorNavBar />

            {/* Main Content */}
            <div className="ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Patients
                        </h1>
                        <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {currentDate}
                        </p>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-6">
                        {/* Notifications */}
                        {/* <button className="relative">
                            <FiBell className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                3
                            </span>
                        </button> */}

                        {/* Vertical Divider */}
                        {/* <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div> */}

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

                {/* Main Content Area - Adjusted for fixed header */}
                <div className="pt-24">
                    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Patients with Completed Appointments
                                </h2>
                            </div>
                            {/* Patient List Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Phone Number
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Appointment Date & Time
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Prediction Result
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {completedPatients.map((patient, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {`${patient.firstName} ${patient.lastName}`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {patient.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {patient.phone}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(patient.date).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}, {patient.time}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {patient.predictionResult}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleViewPatient(patient)}
                                                        className="text-pink-600 hover:text-pink-900 text-sm font-medium"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={activeTab === 'account' ? handleSaveProfile : handlePasswordChange}
                                    className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors"
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
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                        Profile updated successfully!
                    </div>
                </div>
            )}

            {/* Patient Details Modal */}
            {isViewModalOpen && selectedPatient && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-2xl font-semibold text-gray-900">
                                                Patient Report
                                            </h3>
                                            <button
                                                onClick={handleCloseViewModal}
                                                className="text-gray-400 hover:text-gray-500"
                                            >
                                                <FiX className="h-6 w-6" />
                                            </button>
                                        </div>

                                        <div className="mt-4 space-y-6">
                                            {/* Patient Information Section */}
                                            <div className="border-b pb-4">
                                                <h4 className="text-lg font-medium text-gray-900 mb-3">Patient Information</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Full Name</p>
                                                        <p className="text-base font-medium">{`${selectedPatient.firstName} ${selectedPatient.lastName}`}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Email</p>
                                                        <p className="text-base font-medium">{selectedPatient.email}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Phone Number</p>
                                                        <p className="text-base font-medium">{selectedPatient.phone}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Appointment Date & Time</p>
                                                        <p className="text-base font-medium">
                                                            {new Date(selectedPatient.date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}, {selectedPatient.time}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Appointment Type</p>
                                                        <p className="text-base font-medium">{selectedPatient.appointmentType}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Medical Information Section */}
                                            <div className="border-b pb-4">
                                                <h4 className="text-lg font-medium text-gray-900 mb-3">Medical Information</h4>
                                                <div className="space-y-6">
                                                    {/* Mammogram Image Section */}
                                                    {selectedPatient.mammogramImage && (
                                                        <div>
                                                            <p className="text-sm text-gray-500 mb-2">Mammogram Image</p>
                                                            <div className="border rounded-lg p-2">
                                                                <img 
                                                                    src={selectedPatient.mammogramImage} 
                                                                    alt="Mammogram" 
                                                                    className="w-full h-64 object-contain"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Prediction and Description Section */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="col-span-2">
                                                            <p className="text-sm text-gray-500">Prediction Result</p>
                                                            <p className="text-base font-medium mt-1">{selectedPatient.predictionResult}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-sm text-gray-500">Description</p>
                                                            <p className="text-base font-medium mt-1">{selectedPatient.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reviews Section */}
                                            <div className="mt-8">
                                                <h3 className="text-lg font-semibold mb-4">Reviews</h3>
                                                {selectedPatient.reviews && selectedPatient.reviews.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {selectedPatient.reviews.map((review: any, index: number) => (
                                                            <div key={index} className="border rounded-lg p-4">
                                                                <div className="flex items-center mb-2">
                                                                    <div className="flex">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <svg
                                                                                key={i}
                                                                                className={`w-5 h-5 ${
                                                                                    i < review.rating
                                                                                        ? "text-yellow-400"
                                                                                        : "text-gray-300"
                                                                                }`}
                                                                                fill="currentColor"
                                                                                viewBox="0 0 20 20"
                                                                            >
                                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                            </svg>
                                                                        ))}
                                                                    </div>
                                                                    <span className="ml-2 text-sm text-gray-500">
                                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700">{review.review}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500">No reviews available</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleCloseViewModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

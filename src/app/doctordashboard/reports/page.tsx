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
import jsPDF from 'jspdf';
import SessionOut from '@/components/SessionOut';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export default function ReportsPage() {
    const router = useRouter();
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
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Check Cookies Token
    useCheckCookies();

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

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get('/api/reports');
                if (response.data.success) {
                    setReports(response.data.reports);
                }
            } catch (error) {
                setError('Failed to fetch reports');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

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

    const handleViewReport = (report: any, index: number) => {
        setSelectedReport({
            ...report,
            selectedMammogramIndex: index
        });
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedReport(null);
    };

    const handleDownloadReport = async (reportId: string, index: number) => {
        // Find the report
        const report: any = reports.find((r) => r._id === reportId);
        if (!report) return;

        try {
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

            // Report ID
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Report ID: ${report._id}`, margin, yPos);
            yPos += lineHeight * 2;
            
            // Mammogram Analysis Section
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
                const mammogram = report.mammograms[index];
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
            } catch (imageError) {
                doc.setFontSize(8);
                doc.text('Mammogram image could not be loaded', margin, yPos);
                yPos += lineHeight * 2;
            }

            // Add prediction result with appropriate background
            const mammogram = report.mammograms[index];
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
            const medHeight = report.medications && report.medications.length > 0 ? 
                Math.min(20, report.medications.length * lineHeight + 6) : 12;
            doc.rect(margin, yPos, contentWidth, medHeight, 'F');

            // Add medications list
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            if (report.medications && report.medications.length > 0) {
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
            } else {
                doc.setFont('helvetica', 'italic');
                doc.text('No medications prescribed', margin + 5, yPos + 8);
                doc.setFont('helvetica', 'normal');
            }
            yPos += medHeight + lineHeight;

            // Appointment Details Section (if available)
            if (report.appointments && report.appointments.length > 0) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Appointment Details', margin, yPos);
                yPos += lineHeight * 0.8;
                
                // Line under section title
                doc.setDrawColor(220, 220, 220);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += lineHeight;
                
                // Add a light gray background rectangle for the content
                doc.setFillColor(249, 250, 251); // very light gray
                doc.rect(margin, yPos, contentWidth, 20, 'F');

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                const appointment = report.appointments[0];
                
                const appointmentDate = new Date(appointment.dateRange.startDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                // Display appointment details in one line
                doc.setTextColor(100, 100, 100);
                doc.text('Date:', margin + 5, yPos + 8);
                doc.text('Time:', margin + 100, yPos + 8);
                doc.text('Type:', margin + 5, yPos + 16);
                
                // Values in black
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'bold');
                doc.text(appointmentDate, margin + 25, yPos + 8);
                
                if (appointment.dateRange.timeSlot && appointment.dateRange.timeSlot.startTime) {
                    doc.text(appointment.dateRange.timeSlot.startTime, margin + 120, yPos + 8);
                } else {
                    doc.text('Not specified', margin + 120, yPos + 8);
                }
                
                // Truncate appointment type if too long
                const aptType = appointment.appointmentType;
                const maxTypeLength = 60; // Maximum length to display
                const displayType = aptType.length > maxTypeLength ? 
                    aptType.substring(0, maxTypeLength) + '...' : aptType;
                    
                doc.text(displayType, margin + 25, yPos + 16);
                doc.setFont('helvetica', 'normal');
                
                yPos += 20 + lineHeight;
            }

            // Add footer
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150, 150, 150);
            doc.text('This is a computer-generated report. For any queries, please contact your healthcare provider.', 
                pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Save the PDF with a filename based on the report ID
            doc.save(`mammogram-report-${reportId}.pdf`);
            toast.success('Report downloaded successfully');
        } catch (error) {
            toast.error('Failed to download report');
        }
    };

    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setIsImageModalOpen(false);
        setSelectedImage(null);
    };

    return (
        <div className={`min-h-screen bg-gray-100 ${poppins.className}`}>
            {/* Sidebar - Fixed */}
            <DoctorNavBar />
            <SessionOut />

            {/* Main Content */}
            <div className="ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Reports
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
                                    Mammogram Reports
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Report ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Mammogram
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Result
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center">
                                                    <div className="flex justify-center items-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                                                    {error}
                                                </td>
                                            </tr>
                                        ) : reports.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    No reports found
                                                </td>
                                            </tr>
                                        ) : (
                                            reports.map((report: any) => (
                                                report.mammograms.map((mammogram: any, index: number) => (
                                                    <tr key={`${report._id}-${index}`}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {report._id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(report.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div 
                                                                className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => handleImageClick(mammogram.image)}
                                                            >
                                                                <Image
                                                                    src={mammogram.image}
                                                                    alt="Mammogram"
                                                                    width={40}
                                                                    height={40}
                                                                    className="rounded-lg object-cover"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                mammogram.predictionResult === 'Benign' 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : mammogram.predictionResult === 'Malignant'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {mammogram.predictionResult}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex space-x-3">
                                                                <button
                                                                    onClick={() => handleViewReport(report, index)}
                                                                    className="text-pink-600 hover:text-pink-900"
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadReport(report._id, index)}
                                                                    className="text-pink-600 hover:text-pink-900"
                                                                >
                                                                    Download
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ))
                                        )}
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

            {/* Image Modal */}
            {isImageModalOpen && selectedImage && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                        onClick={handleCloseImageModal}
                    />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                            {/* Close Button */}
                            <button
                                onClick={handleCloseImageModal}
                                className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>

                            {/* Image Container */}
                            <div className="relative w-full h-[400px] overflow-hidden rounded-lg">
                                <Image
                                    src={selectedImage}
                                    alt="Full Mammogram"
                                    width={500}
                                    height={500}
                                    className="w-full h-full object-contain"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report View Modal */}
            {isViewModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                        onClick={handleCloseViewModal}
                    />

                    {/* Modal */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto">
                            {/* Close Button */}
                            <button
                                onClick={handleCloseViewModal}
                                className="fixed top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
                            >
                                <FiX className="w-6 h-6" />
                            </button>

                            {/* PDF-like Content */}
                            <div className="p-8 bg-white min-h-[842px]">
                                {/* Header with Logo and Title */}
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                                    <div className="flex items-center gap-4">
                                        {/* Logo */}
                                        <div className="w-20">
                                            <Image
                                                src="/logo.png"
                                                alt="Logo"
                                                width={80}
                                                height={25}
                                                className="object-contain"
                                                priority
                                            />
                                        </div>
                                        {/* Title */}
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            Mammogram Report
                                        </h1>
                                    </div>
                                </div>

                                {/* Report Information */}
                                <div className="mb-8">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Report ID:</p>
                                            <p className="font-medium">{selectedReport._id}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mammogram Image and Result */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                        Mammogram Analysis
                                    </h2>
                                    <div className="flex flex-col items-center mb-4">
                                        <div className="w-96 h-96 relative mb-4">
                                            <Image
                                                src={selectedReport.mammograms[selectedReport.selectedMammogramIndex].image}
                                                alt="Mammogram"
                                                width={500}
                                                height={500}
                                                className="w-full h-full object-contain"
                                                priority
                                            />
                                        </div>
                                        <div className="text-center">
                                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                                selectedReport.mammograms[selectedReport.selectedMammogramIndex].predictionResult === 'Benign'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                Prediction Result: {selectedReport.mammograms[selectedReport.selectedMammogramIndex].predictionResult}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Description */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                        Medical Description
                                    </h2>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {selectedReport.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Medications */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                        Prescribed Medications
                                    </h2>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        {selectedReport.medications && selectedReport.medications.length > 0 ? (
                                            <ul className="list-disc pl-4 space-y-2">
                                                {selectedReport.medications.map((medication: string, index: number) => (
                                                    <li 
                                                        key={index}
                                                        className="text-gray-700"
                                                    >
                                                        {medication}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 italic">No medications prescribed</p>
                                        )}
                                    </div>
                                </div>

                                {/* Appointment Information */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                        Appointment Details
                                    </h2>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        {selectedReport.appointments && selectedReport.appointments.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-gray-600">Date:</p>
                                                    <p className="font-medium">
                                                        {new Date(selectedReport.appointments[0].dateRange.startDate).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Time:</p>
                                                    <p className="font-medium">
                                                        {selectedReport.appointments[0].dateRange.timeSlot.startTime}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-gray-600">Appointment Type:</p>
                                                    <p className="font-medium">
                                                        {selectedReport.appointments[0].appointmentType}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No appointment details available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Footer with Download Button */}
                                <div className="mt-12 pt-6 border-t border-gray-200">
                                    <div className="flex flex-col items-center space-y-4">
                                        <button
                                            onClick={() => {
                                                handleCloseViewModal();
                                                handleDownloadReport(selectedReport._id, selectedReport.selectedMammogramIndex);
                                            }}
                                            className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

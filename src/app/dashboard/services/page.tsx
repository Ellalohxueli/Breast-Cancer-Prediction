'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { BiMessageRounded } from 'react-icons/bi';
import { FaRegBell, FaRegUser, FaUserMd, FaHandHoldingMedical, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaXRay, FaStethoscope, FaMicroscope, FaVial, FaNotesMedical, FaFirstAid, FaPrescription, FaHeartbeat, FaHospital, FaHandHolding, FaComments, FaUsers, FaUserNurse, FaShieldAlt, FaChartLine, FaClinicMedical, FaHospitalUser, FaCalendar } from 'react-icons/fa';
import { TbStethoscope, TbReportMedical, TbMicroscope, TbHeartRateMonitor, TbActivity, TbBrain, TbDna2, TbMedicineSyrup, TbPill, TbVaccine, TbHeartPlus, TbNurse } from 'react-icons/tb';
import { GiMicroscope, GiMedicalDrip, GiMedicines, GiHealthNormal, GiHealing } from 'react-icons/gi';
import { RiMentalHealthLine } from 'react-icons/ri';
import { IoMdPulse } from 'react-icons/io';
import { FiSearch } from 'react-icons/fi';
import axios from 'axios';

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
    console.log('Icon name from database:', iconName);
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
    if (!icon) {
        console.log('Icon not found for:', iconName);
    }
    return icon || <TbStethoscope {...iconProps} />;
};

export default function ServicesPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);

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

    const handleLogout = () => {
        localStorage.removeItem('firstname');
        window.location.href = '/login';
    };

    return (
        <div className={`flex flex-col min-h-screen bg-gray-50 ${poppins.className}`}>
            {/* Navigation Bar */}
            <div className="w-full bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Breast Cancer Detection Logo"
                                width={50}
                                height={50}
                                className="w-auto h-auto"
                            />
                        </div>
                        
                        <nav className="flex-1">
                            <ul className="flex items-center justify-end space-x-6">
                                <li>
                                    <Link 
                                        href="/dashboard" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/services" 
                                        className="text-pink-600 hover:text-pink-600 font-medium"
                                    >
                                        Services
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/ourteams" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Our Team
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/resources" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
                                    >
                                        Patient Resources
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
                                    <a href="#" className="text-gray-600 hover:text-pink-600 relative">
                                        <FaRegBell className="h-6 w-6" aria-label="Notifications" />
                                        {notificationCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </a>
                                </li>
                                <li className="relative">
                                    <button 
                                        className="text-gray-600 hover:text-pink-600 focus:outline-none p-2 rounded-full hover:bg-gray-100"
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    >
                                        <FaRegUser className="h-6 w-6" aria-label="Profile" />
                                    </button>
                                    
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                            <button
                                                onClick={() => router.push('/profile')}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <FaRegUser className="h-4 w-4 mr-3" />
                                                View Profile
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </li>
                                <li>
                                    <a 
                                        href="#" 
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
                        <button className="px-8 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-lg font-medium min-w-[200px]">
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

        </div>
    );
}

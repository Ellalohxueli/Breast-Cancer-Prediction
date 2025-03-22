'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { BiMessageRounded } from 'react-icons/bi';
import { FaRegBell, FaRegUser } from 'react-icons/fa';
import { TbStethoscope } from 'react-icons/tb';
import { GiMicroscope } from 'react-icons/gi';
import { RiMentalHealthLine } from 'react-icons/ri';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export default function ServicesPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const handleLogout = () => {
        localStorage.removeItem('firstname');
        window.location.href = '/login';
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
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
                                <li><a href="#" className="text-gray-600 hover:text-pink-600 font-medium">Patient Resources</a></li>
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
                {/* Screening Services */}
                <div className="mb-6">
                    <button 
                        className="w-full bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex justify-between items-center"
                        onClick={() => setExpandedCategory(expandedCategory === 'screening' ? null : 'screening')}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-pink-50 p-3 rounded-full">
                                <TbStethoscope className="h-6 w-6 text-pink-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900">Screening Services</h2>
                        </div>
                        <svg 
                            className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedCategory === 'screening' ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {expandedCategory === 'screening' && (
                        <div className="mt-4 bg-white p-6 rounded-lg shadow-sm">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Mammography Services</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• 3D Digital Mammography</li>
                                        <li>• Screening Mammograms</li>
                                        <li>• Diagnostic Mammograms</li>
                                        <li>• Same-day Results Available</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ultrasound Screening</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Breast Ultrasound</li>
                                        <li>• Automated Whole Breast Ultrasound</li>
                                        <li>• Expert Radiologist Review</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preparation Guidelines</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• No deodorant or powder before exam</li>
                                        <li>• Wear comfortable two-piece clothing</li>
                                        <li>• Bring previous mammogram records</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Coverage</h3>
                                    <p className="text-gray-600 mb-4">We accept most major insurance plans. Contact our financial counselors for detailed coverage information.</p>
                                    <button className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 transition-colors">
                                        Schedule Screening
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Diagnostic Services */}
                <div className="mb-6">
                    <button 
                        className="w-full bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex justify-between items-center"
                        onClick={() => setExpandedCategory(expandedCategory === 'diagnostic' ? null : 'diagnostic')}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-pink-50 p-3 rounded-full">
                                <GiMicroscope className="h-6 w-6 text-pink-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900">Diagnostic Services</h2>
                        </div>
                        <svg 
                            className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedCategory === 'diagnostic' ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {expandedCategory === 'diagnostic' && (
                        <div className="mt-4 bg-white p-6 rounded-lg shadow-sm">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Biopsy Procedures</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Core Needle Biopsy</li>
                                        <li>• Stereotactic Biopsy</li>
                                        <li>• Ultrasound-Guided Biopsy</li>
                                        <li>• Fine Needle Aspiration</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Genetic Testing</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• BRCA1 and BRCA2 Testing</li>
                                        <li>• Genetic Counseling</li>
                                        <li>• Risk Assessment</li>
                                        <li>• Family History Analysis</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Services</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Blood Work</li>
                                        <li>• Pathology Services</li>
                                        <li>• Hormone Level Testing</li>
                                        <li>• Quick Result Turnaround</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Information</h3>
                                    <p className="text-gray-600 mb-4">Most diagnostic procedures are covered by insurance. Our team will help verify your coverage and explain any out-of-pocket costs.</p>
                                    <button className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 transition-colors">
                                        Schedule Consultation
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Treatment Options */}
                <div className="mb-6">
                    <button 
                        className="w-full bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex justify-between items-center"
                        onClick={() => setExpandedCategory(expandedCategory === 'treatment' ? null : 'treatment')}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-pink-50 p-3 rounded-full">
                                <RiMentalHealthLine className="h-6 w-6 text-pink-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900">Treatment Options</h2>
                        </div>
                        <svg 
                            className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedCategory === 'treatment' ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {expandedCategory === 'treatment' && (
                        <div className="mt-4 bg-white p-6 rounded-lg shadow-sm">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Surgery Options</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Lumpectomy</li>
                                        <li>• Mastectomy</li>
                                        <li>• Reconstructive Surgery</li>
                                        <li>• Minimally Invasive Procedures</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Chemotherapy</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Traditional Chemotherapy</li>
                                        <li>• Targeted Therapy</li>
                                        <li>• Hormone Therapy</li>
                                        <li>• Side Effect Management</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Radiation Therapy</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• External Beam Radiation</li>
                                        <li>• Internal Radiation</li>
                                        <li>• Treatment Planning</li>
                                        <li>• Follow-up Care</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Resources</h3>
                                    <p className="text-gray-600 mb-4">Our comprehensive treatment plans include support services to help you through your journey.</p>
                                    <button className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 transition-colors">
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Support Services */}
                <div className="mb-6">
                    <button 
                        className="w-full bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all flex justify-between items-center"
                        onClick={() => setExpandedCategory(expandedCategory === 'support' ? null : 'support')}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-pink-50 p-3 rounded-full">
                                <HiOutlineUserGroup className="h-6 w-6 text-pink-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900">Support Services</h2>
                        </div>
                        <svg 
                            className={`w-6 h-6 text-gray-500 transform transition-transform ${expandedCategory === 'support' ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {expandedCategory === 'support' && (
                        <div className="mt-4 bg-white p-6 rounded-lg shadow-sm">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Counseling Services</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Individual Counseling</li>
                                        <li>• Family Counseling</li>
                                        <li>• Genetic Counseling</li>
                                        <li>• Crisis Support</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Groups</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Patient Support Groups</li>
                                        <li>• Family Support Groups</li>
                                        <li>• Survivor Network</li>
                                        <li>• Online Communities</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Wellness Programs</h3>
                                    <ul className="space-y-3 text-gray-600">
                                        <li>• Nutrition Counseling</li>
                                        <li>• Exercise Programs</li>
                                        <li>• Meditation Classes</li>
                                        <li>• Art Therapy</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Support</h3>
                                    <p className="text-gray-600 mb-4">Our financial counselors can help you understand costs, insurance, and available assistance programs.</p>
                                    <button className="w-full bg-pink-600 text-white py-2 rounded-md hover:bg-pink-700 transition-colors">
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                                        href="/dashboard#top" 
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
                                    <a href="#" className="hover:text-pink-500 transition-colors">
                                        Patient Resources
                                    </a>
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

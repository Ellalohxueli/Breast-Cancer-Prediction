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
import axios from 'axios';
import { FaXRay, FaCalendar, FaVial, FaNotesMedical, FaFirstAid, FaPrescription, FaHeartbeat, FaUserMd, FaHospital, FaHandHolding, FaComments, FaShieldAlt, FaChartLine, FaClinicMedical, FaHospitalUser } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';

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

export default function DashboardPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [teamDoctors, setTeamDoctors] = useState<Doctor[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    const handleHomeClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default navigation
    };

    const handleLogout = () => {
        console.log('Logout clicked');
        try {
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

    return (
        <div id="top" className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            {/* Full width white navigation bar */}
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
                                        className="text-pink-600 hover:text-pink-600 font-medium"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        href="/dashboard/services" 
                                        className="text-gray-600 hover:text-pink-600 font-medium"
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
                                                onClick={() => {
                                                    localStorage.removeItem('firstname');
                                                    window.location.href = '/login';
                                                }}
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
                        {/* Testimonial 1 */}
                        <SwiperSlide>
                            <div className="bg-white rounded-lg p-8 shadow-sm h-full">
                                <div className="flex items-center mb-6">
                                    <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                                        <span className="text-pink-600 font-semibold text-xl">S</span>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-gray-900 font-semibold">Sarah Chen</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-pink-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className="h-4 w-4" />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500">• March 2024</span>
                                        </div>
                                    </div>
                                </div>
                                <blockquote className="text-gray-600 italic mb-4">
                                    "The care and support I received here was exceptional. The medical team was not only professional but also incredibly compassionate throughout my journey."
                                </blockquote>
                            </div>
                        </SwiperSlide>

                        {/* Testimonial 2 */}
                        <SwiperSlide>
                            <div className="bg-white rounded-lg p-8 shadow-sm h-full">
                                <div className="flex items-center mb-6">
                                    <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                                        <span className="text-pink-600 font-semibold text-xl">M</span>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-gray-900 font-semibold">Maria Rodriguez</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-pink-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className="h-4 w-4" />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500">• February 2024</span>
                                        </div>
                                    </div>
                                </div>
                                <blockquote className="text-gray-600 italic mb-4">
                                    "From diagnosis to treatment, every step was explained clearly. The support groups helped me connect with others going through similar experiences."
                                </blockquote>
                            </div>
                        </SwiperSlide>

                        {/* Testimonial 3 */}
                        <SwiperSlide>
                            <div className="bg-white rounded-lg p-8 shadow-sm h-full">
                                <div className="flex items-center mb-6">
                                    <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                                        <span className="text-pink-600 font-semibold text-xl">L</span>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-gray-900 font-semibold">Lisa Wong</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-pink-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className="h-4 w-4" />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500">• January 2024</span>
                                        </div>
                                    </div>
                                </div>
                                <blockquote className="text-gray-600 italic mb-4">
                                    "The early detection program here saved my life. The medical team's expertise and the support system they provide is truly outstanding."
                                </blockquote>
                            </div>
                        </SwiperSlide>

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


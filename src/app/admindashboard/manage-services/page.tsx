'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { FaUserDoctor, FaHospital, FaStethoscope, FaHeartPulse, FaXRay, FaKitMedical, FaVial, FaUserNurse, FaHandHolding, FaComments, FaUsers, FaShield, FaChartLine, FaCalendarDays } from 'react-icons/fa6';
import { FaUserMd, FaNotesMedical, FaClinicMedical, FaHospitalUser, FaHandHoldingMedical, FaMicroscope, FaPrescription } from 'react-icons/fa';
import { FaPlus, FaEdit, FaTrash, FaBold, FaItalic, FaListUl, FaListOl, FaQuoteRight, FaIndent, FaOutdent } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useCheckCookies from '@/controller/UseCheckCookie';
import axios from 'axios';

// First, add a type definition for your navigation items
type NavigationItem = {
    href: string;
    icon: React.ReactNode;
    text: string;
    custom?: boolean;
    component?: React.ReactNode;
};

// Add these types after your NavigationItem type
type ServiceContent = {
    id: string;
    subheader: string;
    description: string;
};

type Service = {
    _id: string;
    name: string;
    icon: string;
    contents: {
        subheader: string;
        description: string;
    }[];
    status: 'active' | 'inactive';
};

// Add this type for formatting actions
type FormattingAction = 'bold' | 'italic' | 'bullet' | 'number' | 'quote' | 'indent' | 'outdent';

// First, add a new type for the success message
type SuccessMessageType = 'add' | 'delete' | 'update' | null;

export default function ManageServices() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showInfoDropdown, setShowInfoDropdown] = useState(false);
    const pathname = usePathname();
    const [services, setServices] = useState<Service[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newService, setNewService] = useState({
        name: '',
        icon: '',
        contents: [{ id: '1', subheader: '', description: '' }],
        status: 'inactive' as 'active' | 'inactive'
    });
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
    const [successMessageType, setSuccessMessageType] = useState<SuccessMessageType>(null);
    const [editService, setEditService] = useState({
        name: '',
        icon: '',
        contents: [{ id: '1', subheader: '', description: '' }],
        status: 'inactive' as 'active' | 'inactive'
    });

    const availableIcons = [
        // Screening & Detection
        { name: 'Mammogram', component: FaXRay, category: 'Screening & Detection' },
        { name: 'Clinical Exam', component: FaStethoscope, category: 'Screening & Detection' },
        { name: 'Early Detection', component: FiSearch, category: 'Screening & Detection' },
        { name: 'Regular Checkup', component: FaCalendarDays, category: 'Screening & Detection' },

        // Diagnosis
        { name: 'Biopsy', component: FaMicroscope, category: 'Diagnosis' },
        { name: 'Lab Tests', component: FaVial, category: 'Diagnosis' },
        { name: 'Medical Report', component: FaNotesMedical, category: 'Diagnosis' },
        { name: 'Diagnostic Imaging', component: FaXRay, category: 'Diagnosis' },

        // Treatment
        { name: 'Surgery', component: FaKitMedical, category: 'Treatment' },
        { name: 'Chemotherapy', component: FaPrescription, category: 'Treatment' },
        { name: 'Radiation', component: FaHeartPulse, category: 'Treatment' },
        { name: 'Medical Care', component: FaUserMd, category: 'Treatment' },
        { name: 'Hospital Care', component: FaHospital, category: 'Treatment' },

        // Support Services
        { name: 'Patient Support', component: FaHandHolding, category: 'Support Services' },
        { name: 'Counseling', component: FaComments, category: 'Support Services' },
        { name: 'Support Group', component: FaUsers, category: 'Support Services' },
        { name: 'Care Team', component: FaUserNurse, category: 'Support Services' },

        // Prevention & Wellness
        { name: 'Prevention', component: FaShield, category: 'Prevention & Wellness' },
        { name: 'Monitoring', component: FaChartLine, category: 'Prevention & Wellness' },
        { name: 'Clinical Care', component: FaClinicMedical, category: 'Prevention & Wellness' },
        { name: 'Patient Care', component: FaHospitalUser, category: 'Prevention & Wellness' }
    ];

    const renderIcon = (iconName: string) => {
        const iconObj = availableIcons.find(icon => icon.name === iconName);
        if (!iconObj) return null;
        const IconComponent = iconObj.component;
        return <IconComponent />;
    };

    useCheckCookies();

    useEffect(() => {
        try {
            const storedFirstname = localStorage.getItem('firstname');
            if (storedFirstname) {
                setFirstName(storedFirstname);
            }
        } catch (error) {
            console.error('Error getting firstname from localStorage:', error);
        }

        // Set current date
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        setCurrentDate(date.toLocaleDateString('en-US', options));
    }, []);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axios.get('/api/admin/services');
                if (response.data.success) {
                    setServices(response.data.services);
                }
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };

        fetchServices();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");
            localStorage.removeItem("firstname");
            window.location.href = "/login";
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const navigationItems: NavigationItem[] = [
        { href: "/admindashboard", icon: <FiHome className="w-5 h-5 mr-4" />, text: "Dashboard" },
        { href: "/admindashboard/appointments", icon: <FiCalendar className="w-5 h-5 mr-4" />, text: "Appointments" },
        { href: "/admindashboard/doctors", icon: <FaUserDoctor className="w-5 h-5 mr-4" />, text: "Doctors" },
        { href: "/admindashboard/patients", icon: <FiUsers className="w-5 h-5 mr-4" />, text: "Patients" },
        {
            href: "/admindashboard/information",
            icon: <FiFileText className="w-5 h-5 mr-4" />,
            text: "Information",
            custom: true,
            component: (
                <div className="relative">
                    <div 
                        onClick={() => setShowInfoDropdown(!showInfoDropdown)}
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors relative cursor-pointer ${
                            pathname.includes('/admindashboard/manage-services') || pathname.includes('/admindashboard/manage-resources')
                                ? isDarkMode 
                                    ? 'text-pink-400'
                                    : 'text-pink-800'
                                : isDarkMode 
                                    ? 'text-gray-200 hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-pink-100'
                        }`}
                    >
                        <FiFileText className="w-5 h-5 mr-4" />
                        <span>Information</span>
                        <FiChevronRight className={`w-4 h-4 ml-auto transition-transform ${showInfoDropdown ? 'transform rotate-90' : ''}`} />
                    </div>

                    {showInfoDropdown && (
                        <div 
                            className={`absolute left-full top-0 ml-2 w-48 rounded-md shadow-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-white'
                            } py-1 z-50`}
                        >
                            <Link 
                                href="/admindashboard/manage-services"
                                className={`block px-4 py-2 text-sm ${
                                    isDarkMode 
                                        ? 'text-gray-200 hover:bg-gray-600' 
                                        : 'text-gray-700 hover:bg-pink-50'
                                }`}
                            >
                                Manage Services
                            </Link>
                            <Link 
                                href="/admindashboard/manage-resources"
                                className={`block px-4 py-2 text-sm ${
                                    isDarkMode 
                                        ? 'text-gray-200 hover:bg-gray-600' 
                                        : 'text-gray-700 hover:bg-pink-50'
                                }`}
                            >
                                Manage Resources
                            </Link>
                        </div>
                    )}
                </div>
            )
        },
        { href: "/admindashboard/settings", icon: <FiSettings className="w-5 h-5 mr-4" />, text: "Settings" }
    ];

    const handleEditService = (service: Service) => {
        setEditService({
            name: service.name,
            icon: service.icon,
            contents: service.contents.map((content, index) => ({
                id: (index + 1).toString(),
                subheader: content.subheader,
                description: content.description
            })),
            status: service.status
        });
        setSelectedService(service);
        setIsEditModalOpen(true);
    };

    const handleDeleteService = (serviceId: string) => {
        const service = services.find(s => s._id === serviceId);
        if (service) {
            setSelectedService(service);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (selectedService) {
            try {
                setLoading(true);
                
                // Updated API call with query parameter
                const response = await axios.delete(`/api/admin/services?id=${selectedService._id}`);

                if (response.data.success) {
                    setServices(services.filter(s => s._id !== selectedService._id));
                    setIsDeleteModalOpen(false);
                    setSelectedService(null);
                    
                    setSuccessMessageType('delete');
                    setShowSuccessMessage(true);
                    setTimeout(() => {
                        setShowSuccessMessage(false);
                        setSuccessMessageType(null);
                    }, 3000);
                }
            } catch (error: any) {
                console.error('Error deleting service:', error);
                alert(error.response?.data?.error || 'Error deleting service');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddContent = () => {
        setNewService(prev => ({
            ...prev,
            contents: [...prev.contents, {
                id: Date.now().toString(),
                subheader: '',
                description: ''
            }]
        }));
    };

    const handleRemoveContent = (contentId: string) => {
        setNewService(prev => ({
            ...prev,
            contents: prev.contents.filter(content => content.id !== contentId)
        }));
    };

    const handleContentChange = (id: string, field: 'subheader' | 'description', value: string) => {
        setNewService(prev => ({
            ...prev,
            contents: prev.contents.map(content => 
                content.id === id ? { ...content, [field]: value } : content
            )
        }));
    };

    const handleFormatting = (contentId: string, action: FormattingAction, isEdit: boolean = false) => {
        const textarea = document.getElementById(`description-${contentId}`) as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText = '';
        let newCursorPos = start;

        switch (action) {
            case 'bold':
                newText = `**${selectedText}**`;
                break;
            case 'italic':
                newText = `_${selectedText}_`;
                break;
            case 'bullet':
                newText = selectedText
                    .split('\n')
                    .map(line => `• ${line}`)
                    .join('\n');
                break;
            case 'number':
                newText = selectedText
                    .split('\n')
                    .map((line, i) => `${i + 1}. ${line}`)
                    .join('\n');
                break;
            case 'quote':
                newText = selectedText
                    .split('\n')
                    .map(line => `> ${line}`)
                    .join('\n');
                break;
            case 'indent':
                newText = selectedText
                    .split('\n')
                    .map(line => `    ${line}`)
                    .join('\n');
                break;
            case 'outdent':
                newText = selectedText
                    .split('\n')
                    .map(line => line.replace(/^( {4}|\t)/, ''))
                    .join('\n');
                break;
        }

        const newValue = 
            textarea.value.substring(0, start) + 
            newText + 
            textarea.value.substring(end);

        if (isEdit) {
            // Handle edit service formatting
            setEditService(prev => ({
                ...prev,
                contents: prev.contents.map(c =>
                    c.id === contentId ? { ...c, description: newValue } : c
                )
            }));
        } else {
            // Handle new service formatting
            handleContentChange(contentId, 'description', newValue);
        }

        newCursorPos = start + newText.length;

        // Reset cursor position after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { [key: string]: string } = {};

        // Validation checks...
        if (!newService.icon) {
            errors.icon = 'Please select an icon';
        }

        if (!newService.name.trim()) {
            errors.name = 'Service name is required';
        }

        const hasEmptyContent = newService.contents.some(
            content => !content.subheader.trim() || !content.description.trim()
        );

        if (newService.contents.length === 0) {
            errors.content = 'At least one content section is required';
        } else if (hasEmptyContent) {
            errors.content = 'All content sections must have both subheader and description';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            setLoading(true);
            
            // Make API call to create the service
            const response = await axios.post('/api/admin/services', {
                name: newService.name,
                icon: newService.icon,
                contents: newService.contents.map(content => ({
                    subheader: content.subheader,
                    description: content.description
                })),
                status: newService.status
            });

            if (response.data.success) {
                // Add the new service to the services list
                setServices([...services, response.data.service]);
                
                // Reset form and close modal
                setIsAddServiceModalOpen(false);
                setNewService({
                    name: '',
                    icon: '',
                    contents: [{ id: '1', subheader: '', description: '' }],
                    status: 'inactive'
                });
                setFormErrors({});
                
                // Show success message
                setSuccessMessageType('add');
                setShowSuccessMessage(true);
                setTimeout(() => {
                    setShowSuccessMessage(false);
                    setSuccessMessageType(null);
                }, 3000);
            }
        } catch (error: any) {
            console.error('Error adding service:', error);
            // Optionally show error message to user
            alert(error.response?.data?.error || 'Error adding service');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateService = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { [key: string]: string } = {};

        // Validation checks
        if (!editService.icon) {
            errors.icon = 'Please select an icon';
        }

        if (!editService.name.trim()) {
            errors.name = 'Service name is required';
        }

        const hasEmptyContent = editService.contents.some(
            content => !content.subheader.trim() || !content.description.trim()
        );

        if (editService.contents.length === 0) {
            errors.content = 'At least one content section is required';
        } else if (hasEmptyContent) {
            errors.content = 'All content sections must have both subheader and description';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            setLoading(true);
            
            // Make API call to update the service
            const response = await axios.put(`/api/admin/services?id=${selectedService?._id}`, {
                name: editService.name,
                icon: editService.icon,
                contents: editService.contents.map(content => ({
                    subheader: content.subheader,
                    description: content.description
                })),
                status: editService.status
            });

            if (response.data.success) {
                // Update the services list
                setServices(services.map(service => 
                    service._id === selectedService?._id ? response.data.service : service
                ));
                
                // Reset form and close modal
                setIsEditModalOpen(false);
                setSelectedService(null);
                setEditService({
                    name: '',
                    icon: '',
                    contents: [{ id: '1', subheader: '', description: '' }],
                    status: 'inactive'
                });
                setFormErrors({});
                
                // Show success message
                setSuccessMessageType('update');
                setShowSuccessMessage(true);
                setTimeout(() => {
                    setShowSuccessMessage(false);
                    setSuccessMessageType(null);
                }, 3000);
            }
        } catch (error: any) {
            console.error('Error updating service:', error);
            alert(error.response?.data?.error || 'Error updating service');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isIconDropdownOpen && !target.closest('.relative')) {
                setIsIconDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isIconDropdownOpen]);

    // Add a function to handle search
    const handleSearch = async (query: string) => {
        try {
            setSearchQuery(query);
            const response = await axios.get(`/api/admin/services${query ? `?search=${query}` : ''}`);
            if (response.data.success) {
                setServices(response.data.services);
            }
        } catch (error) {
            console.error('Error searching services:', error);
        }
    };

    return (
        <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sidebar - Fixed */}
            <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div>
                    <div className="p-6">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center space-x-4">
                                <div className={`p-1 rounded-xl w-[56px] h-[56px] flex items-center justify-center ${
                                    isDarkMode ? 'bg-gray-700' : 'bg-pink-100'
                                }`}>
                                    <Image 
                                        src="/logo.png"
                                        alt="PinkPath Logo"
                                        width={64}
                                        height={64}
                                        className="object-contain rounded-lg"
                                    />
                                </div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-pink-800'}`}>
                                    PinkPath
                                </h2>
                            </div>
                        </div>
                    </div>
                    <nav className="mt-6">
                        <div className="px-4 space-y-2">
                            {navigationItems.map((item, index) => (
                                item.custom ? (
                                    <div key={index}>{item.component}</div>
                                ) : (
                                    <Link 
                                        key={index}
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 rounded-lg transition-colors relative ${
                                            pathname === item.href
                                                ? isDarkMode 
                                                    ? 'text-pink-400'
                                                    : 'text-pink-800'
                                                : isDarkMode 
                                                    ? 'text-gray-200 hover:bg-gray-700' 
                                                    : 'text-gray-700 hover:bg-pink-100'
                                        }`}
                                    >
                                        {pathname === item.href && (
                                            <div className={`absolute right-0 top-0 h-full w-1 ${
                                                isDarkMode ? 'bg-pink-400' : 'bg-pink-800'
                                            }`}></div>
                                        )}
                                        {item.icon}
                                        <span>{item.text}</span>
                                    </Link>
                                )
                            ))}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main Content Area with Top Menu */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Manage Services
                        </h1>
                        <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {currentDate}
                        </p>
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center space-x-6">
                        {/* Messages */}
                        <button className="relative">
                            <FiMessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                5
                            </span>
                        </button>

                        {/* Notifications */}
                        <button className="relative">
                            <FiBell className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                3
                            </span>
                        </button>

                        {/* Vertical Divider */}
                        <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

                        {/* Profile */}
                        <div className="flex items-center space-x-3 relative">
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-3 focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center">
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-800' : 'text-pink-800'}`}>
                                        {firstName.charAt(0)}
                                    </span>
                                </div>
                                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    <p className="text-sm font-medium">{firstName}</p>
                                    <FiChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400/70'} transition-transform ${isProfileOpen ? 'transform rotate-180' : ''}`} />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 ${
                                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
                                }`}>
                                    <button
                                        onClick={handleLogout}
                                        className={`w-full text-left px-4 py-2 text-sm ${
                                            isDarkMode 
                                                ? 'text-gray-200 hover:bg-gray-700' 
                                                : 'text-gray-700 hover:bg-gray-50'
                                        } transition-colors flex items-center space-x-2`}
                                    >
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content - With increased top padding */}
                <div className="flex-1 p-4 pt-28 overflow-y-auto">
                    <div className="px-6">
                        {/* Services Management Card */}
                        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                            {/* Header and Search/Add Section */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="relative w-96">
                                    <input
                                        type="text"
                                        placeholder="Search services..."
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                            isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                                        } focus:outline-none focus:border-pink-500`}
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                    <FiSearch className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                </div>
                                <button 
                                    onClick={() => setIsAddServiceModalOpen(true)}
                                    className={`${
                                        isDarkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'
                                    } text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
                                >
                                    <FaPlus /> Add New Service
                                </button>
                            </div>

                            {/* Services Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <tr>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-500'
                                            } uppercase tracking-wider`}>
                                                Service Name
                                            </th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-500'
                                            } uppercase tracking-wider`}>
                                                Description
                                            </th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-500'
                                            } uppercase tracking-wider`}>
                                                Status
                                            </th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-500'
                                            } uppercase tracking-wider`}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} divide-y ${
                                        isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                                    }`}>
                                        {services.map((service) => (
                                            <tr key={service._id} className={`${
                                                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                            }`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                                            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                                        }`}>
                                                            {renderIcon(service.icon)}
                                                        </div>
                                                        <div className="font-medium">{service.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm max-w-xl">
                                                        {service.contents.map((content, index) => (
                                                            <div 
                                                                key={index} 
                                                                className={`${
                                                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                                } ${
                                                                    index !== service.contents.length - 1 ? 'mb-1' : ''
                                                                }`}
                                                            >
                                                                {content.subheader}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-sm ${
                                                        service.status === 'active'
                                                            ? isDarkMode 
                                                                ? 'bg-green-400/10 text-green-400' 
                                                                : 'bg-green-100 text-green-800'
                                                            : isDarkMode
                                                                ? 'bg-gray-400/10 text-gray-400'
                                                                : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => handleEditService(service)}
                                                            className={`${
                                                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                            } hover:opacity-80`}
                                                            title="Edit"
                                                        >
                                                            <FaEdit className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteService(service._id)}
                                                            className={`${
                                                                isDarkMode ? 'text-red-400' : 'text-red-600'
                                                            } hover:opacity-80`}
                                                            title="Delete"
                                                        >
                                                            <FaTrash className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {services.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                                    No services found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-6 flex justify-between items-center">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Showing {Math.min(services.length, 10)} of {services.length} services
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-lg ${
                                            isDarkMode 
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={services.length < 10}
                                        className={`px-3 py-1 rounded-lg ${
                                            isDarkMode 
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-md relative shadow-xl backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Confirm Delete
                        </h3>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setSelectedService(null);
                                }}
                                className={`px-4 py-2 rounded-lg ${
                                    isDarkMode 
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {successMessageType === 'add' 
                        ? 'Service successfully added!' 
                        : successMessageType === 'delete'
                        ? 'Service deleted successfully'
                        : 'Service updated successfully'}
                </div>
            )}

            {/* Add Service Modal */}
            {isAddServiceModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-8 w-full max-w-4xl relative shadow-xl backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} max-h-[90vh] overflow-y-auto`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Add New Service
                            </h3>
                            <button
                                onClick={() => {
                                    setIsAddServiceModalOpen(false);
                                    setNewService({
                                        name: '',
                                        icon: '',
                                        contents: [{ id: '1', subheader: '', description: '' }],
                                        status: 'inactive'
                                    });
                                    setFormErrors({});
                                }}
                                className={`p-2 rounded-lg ${
                                    isDarkMode 
                                        ? 'text-gray-300 hover:bg-gray-700' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddService} className="space-y-6">
                            {/* Icon Selection Dropdown */}
                            <div className="relative">
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Select Icon
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-700'
                                    } focus:outline-none focus:border-pink-500 ${
                                        formErrors.icon ? 'border-red-500' : ''
                                    } flex items-center justify-between`}
                                >
                                    <div className="flex items-center gap-2">
                                        {newService.icon ? (
                                            <>
                                                <div className="w-5 h-5">
                                                    {(() => {
                                                        const iconObj = availableIcons.find(icon => icon.name === newService.icon);
                                                        if (iconObj) {
                                                            const IconComponent = iconObj.component;
                                                            return <IconComponent className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />;
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                                <span>{newService.icon}</span>
                                            </>
                                        ) : (
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Select an icon</span>
                                        )}
                                    </div>
                                    <FiChevronDown className={`w-5 h-5 transition-transform ${isIconDropdownOpen ? 'transform rotate-180' : ''}`} />
                                </button>

                                {isIconDropdownOpen && (
                                    <div className={`absolute z-50 mt-1 w-full rounded-lg shadow-lg ${
                                        isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                                    } max-h-[300px] overflow-y-auto`}>
                                        {['Screening & Detection', 'Diagnosis', 'Treatment', 'Support Services', 'Prevention & Wellness'].map(category => (
                                            <div key={category}>
                                                <div className={`px-4 py-2 text-sm font-semibold ${
                                                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                                                }`}>
                                                    {category}
                                                </div>
                                                <div className="p-2">
                                                    {availableIcons
                                                        .filter(icon => icon.category === category)
                                                        .map((icon) => {
                                                            const IconComponent = icon.component;
                                                            return (
                                                                <button
                                                                    key={icon.name}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewService({ ...newService, icon: icon.name });
                                                                        setIsIconDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg ${
                                                                        newService.icon === icon.name
                                                                            ? isDarkMode
                                                                                ? 'bg-pink-500/10 text-pink-500'
                                                                                : 'bg-pink-50 text-pink-600'
                                                                            : isDarkMode
                                                                                ? 'text-gray-300 hover:bg-gray-600'
                                                                                : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    <IconComponent className="w-5 h-5" />
                                                                    <span>{icon.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {formErrors.icon && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.icon}</p>
                                )}
                            </div>

                            {/* Service Name */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Service Name
                                </label>
                                <input
                                    type="text"
                                    value={newService.name}
                                    onChange={(e) => {
                                        setNewService({ ...newService, name: e.target.value });
                                        if (formErrors.name) {
                                            setFormErrors({ ...formErrors, name: '' });
                                        }
                                    }}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-700'
                                    } focus:outline-none focus:border-pink-500 ${
                                        formErrors.name ? 'border-red-500' : ''
                                    }`}
                                    placeholder="Enter service name"
                                />
                                {formErrors.name && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            {/* Content Sections */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Content Sections
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddContent}
                                        className="text-pink-600 hover:text-pink-700 flex items-center space-x-1"
                                    >
                                        <FaPlus className="w-4 h-4" />
                                        <span>Add Content</span>
                                    </button>
                                </div>

                                {newService.contents.map((content, index) => (
                                    <div key={content.id} className="relative p-6 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-700/50">
                                        {/* Section number indicator */}
                                        <div className="absolute -top-3 left-4 px-2 py-1 rounded bg-pink-500 text-white text-sm">
                                            Section {index + 1}
                                        </div>

                                        {/* Remove button - only show if there's more than one section */}
                                        {newService.contents.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveContent(content.id)}
                                                className="absolute -top-3 right-4 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                                            >
                                                <FaTrash className="w-3 h-3" />
                                            </button>
                                        )}

                                        {/* Subheader */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Subheader
                                            </label>
                                            <input
                                                type="text"
                                                value={content.subheader}
                                                onChange={(e) => handleContentChange(content.id, 'subheader', e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    isDarkMode 
                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                        : 'bg-white border-gray-300 text-gray-700'
                                                } focus:outline-none focus:border-pink-500`}
                                                placeholder="Enter subheader"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Description
                                            </label>
                                            <div className={`border rounded-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                {/* Formatting Toolbar */}
                                                <div className={`flex items-center gap-1 p-2 border-b ${
                                                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                                                }`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'bold')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Bold"
                                                    >
                                                        <FaBold className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'italic')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Italic"
                                                    >
                                                        <FaItalic className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'bullet')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Bullet List"
                                                    >
                                                        <FaListUl className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'number')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Numbered List"
                                                    >
                                                        <FaListOl className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'quote')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Quote"
                                                    >
                                                        <FaQuoteRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'indent')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Indent"
                                                    >
                                                        <FaIndent className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'outdent')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Outdent"
                                                    >
                                                        <FaOutdent className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                
                                                {/* Text Area */}
                                                <textarea
                                                    id={`description-${content.id}`}
                                                    value={content.description}
                                                    onChange={(e) => handleContentChange(content.id, 'description', e.target.value)}
                                                    rows={6}
                                                    className={`w-full px-4 py-2 rounded-b-lg ${
                                                        isDarkMode 
                                                            ? 'bg-gray-700 text-white' 
                                                            : 'bg-white text-gray-700'
                                                    } focus:outline-none`}
                                                    placeholder="Enter description with formatting..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formErrors.content && (
                                    <p className="text-red-500 text-sm">{formErrors.content}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Status
                                </label>
                                <select
                                    value={newService.status}
                                    onChange={(e) => setNewService({ 
                                        ...newService, 
                                        status: e.target.value as 'active' | 'inactive' 
                                    })}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-700'
                                    } focus:outline-none focus:border-pink-500`}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddServiceModalOpen(false);
                                        setNewService({
                                            name: '',
                                            icon: '',
                                            contents: [{ id: '1', subheader: '', description: '' }],
                                            status: 'inactive'
                                        });
                                        setFormErrors({});
                                    }}
                                    className={`px-6 py-3 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-6 py-3 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                            <span>Adding...</span>
                                        </>
                                    ) : (
                                        'Add Service'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Service Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-8 w-full max-w-4xl relative shadow-xl backdrop-blur-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} max-h-[90vh] overflow-y-auto`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Edit Service
                            </h3>
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedService(null);
                                    setEditService({
                                        name: '',
                                        icon: '',
                                        contents: [{ id: '1', subheader: '', description: '' }],
                                        status: 'inactive'
                                    });
                                    setFormErrors({});
                                }}
                                className={`p-2 rounded-lg ${
                                    isDarkMode 
                                        ? 'text-gray-300 hover:bg-gray-700' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateService} className="space-y-6">
                            {/* Icon Selection Dropdown */}
                            <div className="relative">
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Select Icon
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-700'
                                    } focus:outline-none focus:border-pink-500 ${
                                        formErrors.icon ? 'border-red-500' : ''
                                    } flex items-center justify-between`}
                                >
                                    <div className="flex items-center gap-2">
                                        {editService.icon ? (
                                            <>
                                                <div className="w-5 h-5">
                                                    {(() => {
                                                        const iconObj = availableIcons.find(icon => icon.name === editService.icon);
                                                        if (iconObj) {
                                                            const IconComponent = iconObj.component;
                                                            return <IconComponent className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />;
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                                <span>{editService.icon}</span>
                                            </>
                                        ) : (
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Select an icon</span>
                                        )}
                                    </div>
                                    <FiChevronDown className={`w-5 h-5 transition-transform ${isIconDropdownOpen ? 'transform rotate-180' : ''}`} />
                                </button>

                                {isIconDropdownOpen && (
                                    <div className={`absolute z-50 mt-1 w-full rounded-lg shadow-lg ${
                                        isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                                    } max-h-[300px] overflow-y-auto`}>
                                        {['Screening & Detection', 'Diagnosis', 'Treatment', 'Support Services', 'Prevention & Wellness'].map(category => (
                                            <div key={category}>
                                                <div className={`px-4 py-2 text-sm font-semibold ${
                                                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                                                }`}>
                                                    {category}
                                                </div>
                                                <div className="p-2">
                                                    {availableIcons
                                                        .filter(icon => icon.category === category)
                                                        .map((icon) => {
                                                            const IconComponent = icon.component;
                                                            return (
                                                                <button
                                                                    key={icon.name}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditService({ ...editService, icon: icon.name });
                                                                        setIsIconDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg ${
                                                                        editService.icon === icon.name
                                                                            ? isDarkMode
                                                                                ? 'bg-pink-500/10 text-pink-500'
                                                                                : 'bg-pink-50 text-pink-600'
                                                                            : isDarkMode
                                                                                ? 'text-gray-300 hover:bg-gray-600'
                                                                                : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    <IconComponent className="w-5 h-5" />
                                                                    <span>{icon.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {formErrors.icon && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.icon}</p>
                                )}
                            </div>

                            {/* Service Name */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Service Name
                                </label>
                                <input
                                    type="text"
                                    value={editService.name}
                                    onChange={(e) => {
                                        setEditService({ ...editService, name: e.target.value });
                                        if (formErrors.name) {
                                            setFormErrors({ ...formErrors, name: '' });
                                        }
                                    }}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-700'
                                    } focus:outline-none focus:border-pink-500 ${
                                        formErrors.name ? 'border-red-500' : ''
                                    }`}
                                    placeholder="Enter service name"
                                />
                                {formErrors.name && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            {/* Status - Moved here */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Status
                                </label>
                                <select
                                    value={editService.status}
                                    onChange={(e) => setEditService({ ...editService, status: e.target.value as 'active' | 'inactive' })}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        isDarkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-700'
                                    } focus:outline-none focus:border-pink-500`}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Content Sections */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h4 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Content Sections
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditService({
                                                ...editService,
                                                contents: [...editService.contents, { id: Date.now().toString(), subheader: '', description: '' }]
                                            });
                                        }}
                                        className="text-pink-600 hover:text-pink-700 flex items-center space-x-1"
                                    >
                                        <FaPlus className="w-4 h-4" />
                                        <span>Add Content</span>
                                    </button>
                                </div>

                                {editService.contents.map((content, index) => (
                                    <div key={content.id} className="relative p-6 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-700/50">
                                        {/* Section number indicator */}
                                        <div className="absolute -top-3 left-4 px-2 py-1 rounded bg-pink-500 text-white text-sm">
                                            Section {index + 1}
                                        </div>

                                        {/* Remove button - only show if there's more than one section */}
                                        {editService.contents.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditService({
                                                        ...editService,
                                                        contents: editService.contents.filter(c => c.id !== content.id)
                                                    });
                                                }}
                                                className="absolute -top-3 right-4 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                                            >
                                                <FaTrash className="w-3 h-3" />
                                            </button>
                                        )}

                                        {/* Subheader */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Subheader
                                            </label>
                                            <input
                                                type="text"
                                                value={content.subheader}
                                                onChange={(e) => {
                                                    setEditService({
                                                        ...editService,
                                                        contents: editService.contents.map(c =>
                                                            c.id === content.id ? { ...c, subheader: e.target.value } : c
                                                        )
                                                    });
                                                }}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    isDarkMode 
                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                        : 'bg-white border-gray-300 text-gray-700'
                                                } focus:outline-none focus:border-pink-500`}
                                                placeholder="Enter subheader"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Description
                                            </label>
                                            <div className={`border rounded-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                {/* Formatting Toolbar */}
                                                <div className={`flex items-center gap-1 p-2 border-b ${
                                                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                                                }`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'bold', true)}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Bold"
                                                    >
                                                        <FaBold className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'italic', true)}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Italic"
                                                    >
                                                        <FaItalic className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'bullet', true)}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Bullet List"
                                                    >
                                                        <FaListUl className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'number', true)}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Numbered List"
                                                    >
                                                        <FaListOl className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'quote', true)}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Quote"
                                                    >
                                                        <FaQuoteRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'indent', true)}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Indent"
                                                    >
                                                        <FaIndent className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatting(content.id, 'outdent', true)}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                        }`}
                                                        title="Outdent"
                                                    >
                                                        <FaOutdent className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                
                                                {/* Text Area */}
                                                <textarea
                                                    id={`description-${content.id}`}
                                                    value={content.description}
                                                    onChange={(e) => {
                                                        setEditService({
                                                            ...editService,
                                                            contents: editService.contents.map(c =>
                                                                c.id === content.id ? { ...c, description: e.target.value } : c
                                                            )
                                                        });
                                                    }}
                                                    rows={6}
                                                    className={`w-full px-4 py-2 rounded-b-lg ${
                                                        isDarkMode 
                                                            ? 'bg-gray-700 text-white' 
                                                            : 'bg-white text-gray-700'
                                                    } focus:outline-none`}
                                                    placeholder="Enter description with formatting..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formErrors.content && (
                                    <p className="text-red-500 text-sm">{formErrors.content}</p>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setSelectedService(null);
                                        setEditService({
                                            name: '',
                                            icon: '',
                                            contents: [{ id: '1', subheader: '', description: '' }],
                                            status: 'inactive'
                                        });
                                        setFormErrors({});
                                    }}
                                    className={`px-6 py-3 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-6 py-3 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        'Update Service'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

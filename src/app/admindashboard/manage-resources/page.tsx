'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown, FiChevronRight, FiFilter, FiArrowDown, FiArrowUp, FiX, FiUpload, FiEye, FiClock } from 'react-icons/fi';
import { FaUserDoctor, FaHospital, FaPlus, FaBold, FaItalic, FaListUl, FaListOl, FaQuoteRight, FaIndent, FaOutdent } from 'react-icons/fa6';
import { FaEdit, FaTrash } from 'react-icons/fa';
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

// Add this type near the top with other type definitions
type ResourceCategory = 'Tips & Guides' | 'News & Articles' | 'Events & Support Groups';

// Add these types near the top with other type definitions
type ResourceStatus = 'published' | 'draft';

// Add these types near the other type definitions
type EventCategory = 'support group' | 'workshop' | 'seminar';

type SEOMetadata = {
    title: string;
    description: string;
    keywords: string;
};

// Update the ResourceFormData type to make status optional
type ResourceFormData = {
    _id?: string;
    title: string;
    category: ResourceCategory;
    content: string;
    featuredImage: string;
    status?: ResourceStatus; // Make status optional
    seoMetadata: SEOMetadata;
    publishDate: string;
    eventCategory?: EventCategory;
    eventDate?: string;
    eventTime?: string;
    shortDescription?: string;
};

// Update the Resource type as well
type Resource = {
    _id: string;
    title: string;
    category: ResourceCategory;
    content?: string;
    featuredImage: string;
    status?: ResourceStatus; // Make status optional
    seoMetadata: {
        title: string;
        description: string;
        keywords: string;
    };
    publishDate: string;
    eventCategory?: EventCategory;
    eventDate?: string;
    eventTime?: string;
    shortDescription?: string;
    createdAt: string;
    updatedAt: string;
};

// Add this type for validation errors
type ValidationErrors = {
    title?: string;
    category?: string;
    content?: string;
    featuredImage?: string;
    status?: string;
    seoMetadata?: {
        title?: string;
        description?: string;
        keywords?: string;
    };
    eventCategory?: string;
    eventDate?: string;
    eventTime?: string;
    shortDescription?: string;
};

// Add this type definition after other type definitions
type FormattingAction = 'bold' | 'italic' | 'bullet' | 'number' | 'quote' | 'indent' | 'outdent';

// Add this type after other type definitions
type SuccessMessageType = 'add' | 'delete' | 'update' | null;

// Note: Remove 'All Resources' from the type since it's only used for filtering
// The activeCategory state should have its own type that includes 'All Resources'
type ActiveCategoryFilter = ResourceCategory | 'All Resources';

export default function ManageResources() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showInfoDropdown, setShowInfoDropdown] = useState(false);
    const pathname = usePathname();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [activeCategory, setActiveCategory] = useState<ActiveCategoryFilter>('All Resources');
    const [isLoading, setIsLoading] = useState(true);
    const [resources, setResources] = useState<Resource[]>([]);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [searchQuery, setSearchQuery] = useState('');
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [resourceFormData, setResourceFormData] = useState<ResourceFormData>({
        title: '',
        category: '' as ResourceCategory,
        content: '',
        featuredImage: '',
        status: 'draft',
        seoMetadata: {
            title: '',
            description: '',
            keywords: ''
        },
        publishDate: new Date().toISOString().split('T')[0],
        eventCategory: undefined,
        eventDate: '',
        eventTime: '',
        shortDescription: ''
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [successMessage, setSuccessMessage] = useState<SuccessMessageType>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewResource, setPreviewResource] = useState<Resource | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | ResourceStatus>('all');

    // Add this near the top of the component where other state variables are defined
    const today = new Date().toISOString().split('T')[0]; // Gets today's date in YYYY-MM-DD format

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
        fetchResources();
    }, [activeCategory, sortBy, statusFilter]);

    const fetchResources = async () => {
        try {
            setIsLoading(true);
            let url = '/api/admin/resources?';
            
            // Add category filter if a specific category is selected
            if (activeCategory !== 'All Resources') {
                url += `category=${encodeURIComponent(activeCategory)}&`;
            }

            // Add status filter if not 'all'
            if (statusFilter !== 'all') {
                url += `status=${statusFilter}&`;
            }

            // Add sort parameter
            url += `sort=${sortBy}`;

            const response = await axios.get(url);
            if (response.data.success) {
                const sortedResources = [...response.data.data].sort((a, b) => {
                    if (sortBy === 'latest') {
                        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                    } else {
                        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                    }
                });
                setResources(sortedResources);
            }
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className="relative" style={{ position: 'relative', zIndex: 60 }}>
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
                            } py-1`}
                            style={{ 
                                position: 'absolute',
                                zIndex: 999,
                                left: '100%',
                                top: '0',
                                marginLeft: '8px'
                            }}
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
        }
    ];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setResourceFormData(prev => ({
                    ...prev,
                    featuredImage: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Update the handleInputChange function
    const handleInputChange = (field: string, value: string, nestedField?: string) => {
        // Clear error for the field when user starts typing
        if (nestedField) {
            // For nested fields like seoMetadata
            setErrors(prev => ({
                ...prev,
                [field]: {
                    ...(prev[field as keyof ValidationErrors] as Record<string, string | undefined>),
                    [nestedField]: undefined
                }
            }));
        } else {
            // For regular fields
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }

        // Update form data
        if (nestedField) {
            setResourceFormData(prev => ({
                ...prev,
                [field]: {
                    ...(prev[field as keyof ResourceFormData] as Record<string, string>),
                    [nestedField]: value
                }
            }));
        } else {
            setResourceFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Update the validateForm function
    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        // Common validations for all categories
        if (!resourceFormData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (!resourceFormData.category) {
            newErrors.category = 'Category is required';
        }

        // Specific validations based on category
        if (resourceFormData.category === 'Events & Support Groups') {
            if (!resourceFormData.eventCategory) {
                newErrors.eventCategory = 'Event category is required';
            }
            if (!resourceFormData.eventDate) {
                newErrors.eventDate = 'Event date is required';
            }
            if (!resourceFormData.eventTime) {
                newErrors.eventTime = 'Event time is required';
            }
            if (!resourceFormData.shortDescription?.trim()) {
                newErrors.shortDescription = 'Short description is required';
            }
        } else {
            // Validations for Tips & Guides and News & Articles
            if (!resourceFormData.content?.trim()) {
                newErrors.content = 'Content is required';
            }
            if (!resourceFormData.featuredImage) {
                newErrors.featuredImage = 'Featured image is required';
            }
            if (!resourceFormData.seoMetadata.title?.trim()) {
                newErrors.seoMetadata = {
                    ...newErrors.seoMetadata,
                    title: 'Meta title is required'
                };
            }
            if (!resourceFormData.seoMetadata.description?.trim()) {
                newErrors.seoMetadata = {
                    ...newErrors.seoMetadata,
                    description: 'Meta description is required'
                };
            }
            if (!resourceFormData.seoMetadata.keywords?.trim()) {
                newErrors.seoMetadata = {
                    ...newErrors.seoMetadata,
                    keywords: 'Keywords are required'
                };
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Update the handleSubmit function
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            // Create submission data based on category
            let submissionData;
            if (resourceFormData.category === 'Events & Support Groups') {
                // Only include specific fields for events and explicitly set status as null
                const { title, category, eventCategory, eventDate, eventTime, shortDescription } = resourceFormData;
                submissionData = {
                    title,
                    category,
                    eventCategory,
                    eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
                    eventTime,
                    shortDescription,
                    status: null // Explicitly set status as null for events
                };
            } else {
                submissionData = resourceFormData;
            }

            const response = await axios.post('/api/admin/resources', submissionData);
            
            if (response.data.success) {
                setResources(prevResources => [response.data.data, ...prevResources]);
                setIsResourceModalOpen(false);
                setSuccessMessage('add');
                // Reset form data
                setResourceFormData({
                    title: '',
                    category: '' as ResourceCategory,
                    content: '',
                    featuredImage: '',
                    status: 'draft',
                    seoMetadata: {
                        title: '',
                        description: '',
                        keywords: ''
                    },
                    publishDate: new Date().toISOString().split('T')[0],
                    eventCategory: undefined,
                    eventDate: '',
                    eventTime: '',
                    shortDescription: ''
                });

                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            }
        } catch (error) {
            console.error('Error submitting resource:', error);
        }
    };

    // Update the handleEditResource function
    const handleEditResource = (resource: Resource) => {
        console.log('Editing resource:', resource);
        setIsEditMode(true);
        
        // Format dates for form inputs
        const formattedResource = {
            _id: resource._id,
            title: resource.title,
            category: resource.category,
            content: resource.content || '',
            featuredImage: resource.featuredImage,
            status: resource.status,
            seoMetadata: {
                title: resource.seoMetadata?.title || '',
                description: resource.seoMetadata?.description || '',
                keywords: resource.seoMetadata?.keywords || ''
            },
            // Format dates to YYYY-MM-DD for input[type="date"]
            publishDate: new Date(resource.publishDate).toISOString().split('T')[0],
            eventCategory: resource.eventCategory,
            eventDate: resource.eventDate 
                ? new Date(resource.eventDate).toISOString().split('T')[0] 
                : '',
            eventTime: resource.eventTime || '',
            shortDescription: resource.shortDescription || ''
        };

        setResourceFormData(formattedResource);
        setIsResourceModalOpen(true);
    };

    // Update the handleDeleteResource function
    const handleDeleteResource = async (resourceId: string) => {
        try {
            setLoading(true);
            const response = await axios.delete(`/api/admin/resources?id=${resourceId}`);
            
            if (response.data.success) {
                setSuccessMessage('delete');
                // Refresh the resources list
                fetchResources();
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
        } finally {
            setLoading(false);
            setIsDeleteModalOpen(false);
            setSelectedResource(null);
        }
    };

    // Update the handleUpdateResource function
    const handleUpdateResource = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            if (!resourceFormData._id) {
                console.error('No resource ID found:', resourceFormData);
                alert('Error: Resource ID is missing');
                return;
            }

            let updateData;
            if (resourceFormData.category === 'Events & Support Groups') {
                // For events, explicitly set publishDate to null and include only event-specific fields
                updateData = {
                    title: resourceFormData.title,
                    category: resourceFormData.category,
                    eventCategory: resourceFormData.eventCategory,
                    eventDate: resourceFormData.eventDate 
                        ? new Date(resourceFormData.eventDate).toISOString() 
                        : undefined,
                    eventTime: resourceFormData.eventTime,
                    shortDescription: resourceFormData.shortDescription,
                    publishDate: null, // Explicitly set to null
                    status: null, // Explicitly set to null
                    content: null, // Explicitly set to null
                    featuredImage: null, // Explicitly set to null
                    seoMetadata: null // Explicitly set to null
                };
            } else {
                // For other categories, include all relevant fields
                const { _id, eventCategory, eventDate, eventTime, shortDescription, ...rest } = resourceFormData;
                updateData = {
                    ...rest,
                    publishDate: new Date(rest.publishDate).toISOString(),
                };
            }

            console.log('Updating resource:', resourceFormData._id, 'with data:', updateData);

            const response = await axios.put(`/api/admin/resources?id=${resourceFormData._id}`, updateData);
            
            if (response.data.success) {
                setIsResourceModalOpen(false);
                setSuccessMessage('update');
                setIsEditMode(false);
                
                // Reset form data
                setResourceFormData({
                    title: '',
                    category: '' as ResourceCategory,
                    content: '',
                    featuredImage: '',
                    status: 'draft',
                    seoMetadata: {
                        title: '',
                        description: '',
                        keywords: ''
                    },
                    publishDate: new Date().toISOString().split('T')[0],
                    eventCategory: undefined,
                    eventDate: '',
                    eventTime: '',
                    shortDescription: ''
                });

                await fetchResources();

                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            }
        } catch (error) {
            console.error('Error updating resource:', error);
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error || 'Unknown error';
                alert(`Error updating resource: ${errorMessage}`);
            } else {
                alert('Error updating resource: An unexpected error occurred');
            }
        }
    };

    // Update the handleFormatting function
    const handleFormatting = (action: FormattingAction) => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        // Prevent default button behavior
        event?.preventDefault();

        // Save the current scroll position
        const scrollPos = textarea.scrollTop;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let formattedText = '';
        let cursorOffset = 0;

        switch (action) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                cursorOffset = 2;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                cursorOffset = 1;
                break;
            case 'bullet':
                formattedText = selectedText
                    .split('\n')
                    .map(line => `• ${line}`)
                    .join('\n');
                cursorOffset = 2;
                break;
            case 'number':
                formattedText = selectedText
                    .split('\n')
                    .map((line, i) => `${i + 1}. ${line}`)
                    .join('\n');
                cursorOffset = 3;
                break;
            case 'quote':
                formattedText = selectedText
                    .split('\n')
                    .map(line => `> ${line}`)
                    .join('\n');
                cursorOffset = 2;
                break;
            case 'indent':
                formattedText = selectedText
                    .split('\n')
                    .map(line => `    ${line}`)
                    .join('\n');
                cursorOffset = 4;
                break;
            case 'outdent':
                formattedText = selectedText
                    .split('\n')
                    .map(line => line.replace(/^(\s{1,4})/, ''))
                    .join('\n');
                cursorOffset = 0;
                break;
        }

        const newContent = 
            textarea.value.substring(0, start) + 
            formattedText + 
            textarea.value.substring(end);

        setResourceFormData(prev => ({
            ...prev,
            content: newContent
        }));

        // Restore cursor position and scroll position after state update
        requestAnimationFrame(() => {
            textarea.focus();
            const newPosition = start + formattedText.length;
            textarea.setSelectionRange(newPosition, newPosition);
            textarea.scrollTop = scrollPos;
        });
    };

    const handlePreview = (resource: Resource) => {
        setPreviewResource(resource);
        setIsPreviewModalOpen(true);
    };

    // Add this function near other handlers
    const handleCloseModal = () => {
        // Reset form data
        setResourceFormData({
            title: '',
            category: '' as ResourceCategory, // Reset to empty string
            content: '',
            featuredImage: '',
            status: 'draft',
            seoMetadata: {
                title: '',
                description: '',
                keywords: ''
            },
            publishDate: new Date().toISOString().split('T')[0],
            eventCategory: undefined,
            eventDate: '',
            eventTime: '',
            shortDescription: ''
        });
        
        // Reset errors
        setErrors({});
        
        // Reset edit mode
        setIsEditMode(false);
        
        // Close modal
        setIsResourceModalOpen(false);
    };

    // Update the category selection handler
    const handleCategoryChange = (category: ResourceCategory) => {
        console.log('Category changed to:', category);
        setActiveCategory(category);
    };

    // Add this handler function
    const handleSortChange = (value: 'latest' | 'oldest') => {
        setSortBy(value);
        setShowSortDropdown(false);
    };

    // Add search handler function
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
    };

    // Update the resources display to filter by search query
    const filteredResources = resources.filter(resource => 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Update the pagination variables to use filteredResources
    const totalItems = filteredResources.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Add this handler function
    const handleStatusChange = (value: 'all' | ResourceStatus) => {
        setStatusFilter(value);
        setShowStatusDropdown(false);
    };

    // Add this helper function
    const isNonEventResource = (category: ResourceCategory): category is 'Tips & Guides' | 'News & Articles' => {
        return category === 'Tips & Guides' || category === 'News & Articles';
    };

    const isAnyModalOpen = () => {
        return isResourceModalOpen || isPreviewModalOpen || isDeleteModalOpen;
    };

    return (
        <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sidebar - Fixed */}
            <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen transition-all duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
            } ${isAnyModalOpen() ? 'backdrop-blur-sm bg-opacity-50' : ''} z-[40]`}>
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
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-[45] ${
                    isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
                } shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Manage Resources
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
                                {messageCount}
                            </span>
                        </button>

                        {/* Notifications */}
                        <button className="relative">
                            <FiBell className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {notificationCount}
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
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 z-50 ${
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
                <div className="flex-1 p-4 pt-28 overflow-y-auto z-[30]"> {/* Lower z-index for main content */}
                    <div className="px-6">
                        {/* Resource Categories Tabs */}
                        <div className="mb-6">
                            <div className={`inline-flex p-1 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                {['All Resources', 'Tips & Guides', 'News & Articles', 'Events & Support Groups'].map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryChange(category as ResourceCategory)}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            activeCategory === category
                                                ? isDarkMode
                                                    ? 'bg-pink-600 text-white'
                                                    : 'bg-white text-pink-600 shadow-sm'
                                                : isDarkMode
                                                    ? 'text-gray-300 hover:text-white'
                                                    : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search, Sort and Filter Section */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3 flex-1">
                                {/* Search */}
                                <div className="relative w-96">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        placeholder="Search resources..."
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                                : 'bg-white border-gray-200 text-gray-700'
                                        } focus:outline-none focus:border-pink-500`}
                                    />
                                    <FiSearch className={`absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                </div>

                                {/* Status Filter Button & Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <FiFilter className="w-4 h-4" />
                                        Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                    </button>

                                    {showStatusDropdown && (
                                        <div className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg ${
                                            isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                                        } py-2 z-20`}>
                                            <button
                                                onClick={() => handleStatusChange('all')}
                                                className={`w-full px-4 py-2 text-left ${
                                                    statusFilter === 'all'
                                                        ? isDarkMode ? 'bg-gray-600 text-pink-400' : 'bg-pink-50 text-pink-600'
                                                        : isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange('published')}
                                                className={`w-full px-4 py-2 text-left ${
                                                    statusFilter === 'published'
                                                        ? isDarkMode ? 'bg-gray-600 text-pink-400' : 'bg-pink-50 text-pink-600'
                                                        : isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                Published
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange('draft')}
                                                className={`w-full px-4 py-2 text-left ${
                                                    statusFilter === 'draft'
                                                        ? isDarkMode ? 'bg-gray-600 text-pink-400' : 'bg-pink-50 text-pink-600'
                                                        : isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                Draft
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Sort Button & Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="relative w-4 h-4">
                                            <FiArrowUp className="w-4 h-4 absolute -top-1" />
                                            <FiArrowDown className="w-4 h-4 absolute -bottom-1" />
                                        </div>
                                        Sort
                                    </button>

                                    {showSortDropdown && (
                                        <div className={`absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg ${
                                            isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                                        } py-2 z-20`}>
                                            <button
                                                onClick={() => handleSortChange('latest')}
                                                className={`w-full px-4 py-2 text-left ${
                                                    sortBy === 'latest'
                                                        ? isDarkMode ? 'bg-gray-600 text-pink-400' : 'bg-pink-50 text-pink-600'
                                                        : isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                Latest First
                                            </button>
                                            <button
                                                onClick={() => handleSortChange('oldest')}
                                                className={`w-full px-4 py-2 text-left ${
                                                    sortBy === 'oldest'
                                                        ? isDarkMode ? 'bg-gray-600 text-pink-400' : 'bg-pink-50 text-pink-600'
                                                        : isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                Oldest First
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add New Resource Button */}
                            <button 
                                onClick={() => {
                                    setIsEditMode(false);
                                    setIsResourceModalOpen(true);
                                }}
                                className={`${
                                    isDarkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'
                                } text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
                            >
                                <FaPlus /> Add New Resource
                            </button>
                        </div>

                        {/* Resources Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                // Loading skeleton
                                [...Array(6)].map((_, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-gray-700 border-gray-600' 
                                                : 'bg-white border-gray-200'
                                        } animate-pulse`}
                                    >
                                        <div className="aspect-video bg-gray-300 dark:bg-gray-600" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 dark:bg-gray-500 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : filteredResources.length === 0 ? (
                                // Empty state
                                <div className={`col-span-3 text-center py-8 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    <p className="text-lg">
                                        {searchQuery ? 'No resources found matching your search' : 'No resources found'}
                                    </p>
                                </div>
                            ) : (
                                // Resources list
                                filteredResources.map((resource) => (
                                    <div
                                        key={resource._id}
                                        className={`rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-gray-700 border-gray-600' 
                                                : 'bg-white border-gray-200'
                                        } overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
                                    >
                                        {resource.category === 'Events & Support Groups' ? (
                                            // Events & Support Groups Layout
                                            <div className="p-4">
                                                {/* Top Row: Event Type and Date */}
                                                <div className="flex justify-between items-start mb-4">
                                                    {/* Event Type Badge */}
                                                    <span className={`px-3 py-1 text-sm rounded-full capitalize ${
                                                        isDarkMode
                                                            ? 'bg-blue-400/10 text-blue-400'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {resource.eventCategory}
                                                    </span>

                                                    {/* Date Display */}
                                                    {resource.eventDate && (
                                                        <div className={`text-center px-3 py-1 rounded-lg ${
                                                            isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                                                        }`}>
                                                            <div className={`text-xl font-bold ${
                                                                isDarkMode ? 'text-white' : 'text-gray-900'
                                                            }`}>
                                                                {new Date(resource.eventDate).getDate()}
                                                            </div>
                                                            <div className={`text-sm font-medium ${
                                                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                            }`}>
                                                                {new Date(resource.eventDate).toLocaleString('default', { month: 'short' })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className={`font-semibold text-lg mb-2 ${
                                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                    {resource.title}
                                                </h3>

                                                {/* Description */}
                                                <p className={`text-sm mb-4 line-clamp-3 ${
                                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                }`}>
                                                    {resource.shortDescription}
                                                </p>

                                                {/* Bottom Row: Time and Actions */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                                                    {/* Time with Icon */}
                                                    <div className={`flex items-center ${
                                                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                    }`}>
                                                        <FiClock className="w-4 h-4 mr-2" />
                                                        <span className="text-sm">
                                                            {resource.eventTime ? new Date(`2000/01/01 ${resource.eventTime}`).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            }) : null}
                                                        </span>
                                                    </div>

                                                    {/* Action Buttons - Removed Preview Button */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            title="Edit"
                                                            onClick={() => handleEditResource(resource)}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                isDarkMode
                                                                    ? 'hover:bg-gray-600 text-blue-400'
                                                                    : 'hover:bg-gray-100 text-blue-600'
                                                            }`}
                                                        >
                                                            <FaEdit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            title="Delete"
                                                            onClick={() => {
                                                                setIsDeleteModalOpen(true);
                                                                setSelectedResource(resource);
                                                            }}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                isDarkMode
                                                                    ? 'hover:bg-gray-600 text-red-400'
                                                                    : 'hover:bg-gray-100 text-red-600'
                                                            }`}
                                                        >
                                                            <FaTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Default Layout for Tips & Guides and News & Articles
                                            <>
                                                {/* Thumbnail */}
                                                <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                                                    <Image
                                                        src={resource.featuredImage || '/placeholder-image.jpg'}
                                                        alt={resource.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 flex flex-col h-[160px]">
                                                    {/* Title and Status */}
                                                    <div className="flex justify-between items-start mb-2 min-h-[48px]">
                                                        <h3 className={`font-semibold ${
                                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                                        } line-clamp-2`}>
                                                            {resource.title}
                                                        </h3>
                                                        {isNonEventResource(resource.category) && resource.status && (
                                                            <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                                                                resource.status === 'published'
                                                                    ? isDarkMode
                                                                        ? 'bg-green-400/10 text-green-400'
                                                                        : 'bg-green-100 text-green-800'
                                                                    : isDarkMode
                                                                        ? 'bg-gray-600 text-gray-300'
                                                                        : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Category and Date */}
                                                    <div className="flex items-center gap-2 min-h-[24px] mb-1">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            resource.category === 'Tips & Guides'
                                                                ? isDarkMode
                                                                    ? 'bg-purple-400/10 text-purple-400'
                                                                    : 'bg-purple-100 text-purple-800'
                                                                : isDarkMode
                                                                    ? 'bg-pink-400/10 text-pink-400'
                                                                    : 'bg-pink-100 text-pink-800'
                                                        }`}>
                                                            {resource.category}
                                                        </span>
                                                        <span className={`text-sm ${
                                                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                            {new Date(resource.publishDate).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="border-t border-gray-200 dark:border-gray-600"></div>

                                                    {/* Action Buttons */}
                                                    <div className="mt-2">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                title="Preview"
                                                                onClick={() => handlePreview(resource)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    isDarkMode
                                                                        ? 'hover:bg-gray-600 text-gray-300'
                                                                        : 'hover:bg-gray-100 text-gray-600'
                                                                }`}
                                                            >
                                                                <FiEye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                title="Edit"
                                                                onClick={() => handleEditResource(resource)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    isDarkMode
                                                                        ? 'hover:bg-gray-600 text-blue-400'
                                                                        : 'hover:bg-gray-100 text-blue-600'
                                                                }`}
                                                            >
                                                                <FaEdit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                title="Delete"
                                                                onClick={() => {
                                                                    setIsDeleteModalOpen(true);
                                                                    setSelectedResource(resource);
                                                                }}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    isDarkMode
                                                                        ? 'hover:bg-gray-600 text-red-400'
                                                                        : 'hover:bg-gray-100 text-red-600'
                                                                }`}
                                                            >
                                                                <FaTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination Controls */}
                        <div className={`mt-8 flex items-center justify-between px-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            {/* Items per page selector and counter */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Show</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className={`px-2 py-1 rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                                : 'bg-white border-gray-200 text-gray-700'
                                        }`}
                                    >
                                        <option value={9}>9</option>
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                        <option value={36}>36</option>
                                    </select>
                                    <span className="text-sm">per page</span>
                                </div>
                                <div className="text-sm">
                                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                                </div>
                            </div>

                            {/* Page navigation */}
                            <div className="flex items-center gap-2">
                                {/* Previous page button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg border ${
                                        isDarkMode 
                                            ? 'border-gray-600 hover:bg-gray-700' 
                                            : 'border-gray-200 hover:bg-gray-50'
                                    } ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <FiChevronDown className="w-4 h-4 transform rotate-90" />
                                </button>

                                {/* Page numbers */}
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;
                                        // Show first page, last page, current page, and pages around current page
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => setCurrentPage(pageNumber)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        currentPage === pageNumber
                                                            ? isDarkMode
                                                                ? 'bg-pink-600 text-white'
                                                                : 'bg-pink-500 text-white'
                                                            : isDarkMode
                                                                ? 'hover:bg-gray-700'
                                                                : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        } else if (
                                            pageNumber === currentPage - 2 ||
                                            pageNumber === currentPage + 2
                                        ) {
                                            return <span key={pageNumber} className="px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                {/* Next page button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg border ${
                                        isDarkMode 
                                            ? 'border-gray-600 hover:bg-gray-700' 
                                            : 'border-gray-200 hover:bg-gray-50'
                                    } ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <FiChevronDown className="w-4 h-4 transform -rotate-90" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Modal */}
            {isResourceModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-4xl relative shadow-xl backdrop-blur-sm border ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    } max-h-[90vh] overflow-y-auto`}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {isEditMode ? 'Edit Resource' : 'Add New Resource'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className={`p-2 rounded-lg ${
                                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={isEditMode ? handleUpdateResource : handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={resourceFormData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className={`w-full px-4 py-2 rounded-lg border ${
                                        errors.title ? 'border-red-500' : 
                                        isDarkMode 
                                            ? 'border-gray-600' 
                                            : 'border-gray-300'
                                    } ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-white text-gray-900'
                                    } focus:ring-2 focus:ring-pink-500`}
                                    placeholder="Enter resource title"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Category *
                                </label>
                                <select
                                    value={resourceFormData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value as ResourceCategory)}
                                    className={`w-full px-4 py-2 rounded-lg border ${
                                        errors.category ? 'border-red-500' : 
                                        isDarkMode 
                                            ? 'border-gray-600' 
                                            : 'border-gray-300'
                                    } ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white' 
                                            : 'bg-white text-gray-900'
                                    } focus:ring-2 focus:ring-pink-500`}
                                >
                                    <option value="">Select category</option>
                                    <option value="Tips & Guides">Tips & Guides</option>
                                    <option value="News & Articles">News & Articles</option>
                                    <option value="Events & Support Groups">Events & Support Groups</option>
                                </select>
                                {errors.category && (
                                    <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                                )}
                            </div>

                            {/* Show event-specific fields if category is Events & Support Groups */}
                            {resourceFormData.category === 'Events & Support Groups' ? (
                                <>
                                    {/* Event Category */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Event Category *
                                        </label>
                                        <select
                                            value={resourceFormData.eventCategory}
                                            onChange={(e) => handleInputChange('eventCategory', e.target.value as EventCategory)}
                                            className={`w-full px-4 py-2 rounded-lg border ${
                                                errors.eventCategory ? 'border-red-500' :
                                                isDarkMode 
                                                    ? 'bg-gray-700 border-gray-600' 
                                                    : 'bg-white border-gray-300'
                                            } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                        >
                                            <option value="">Select event category</option>
                                            <option value="support group">Support Group</option>
                                            <option value="workshop">Workshop</option>
                                            <option value="seminar">Seminar</option>
                                        </select>
                                        {errors.eventCategory && (
                                            <p className="mt-1 text-sm text-red-500">{errors.eventCategory}</p>
                                        )}
                                    </div>

                                    {/* Event Date and Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Event Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={resourceFormData.eventDate}
                                                min={today}
                                                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    errors.eventDate ? 'border-red-500' :
                                                    isDarkMode 
                                                        ? 'bg-gray-700 border-gray-600' 
                                                        : 'bg-white border-gray-300'
                                                } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                            />
                                            {errors.eventDate && (
                                                <p className="mt-1 text-sm text-red-500">{errors.eventDate}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Event Time *
                                            </label>
                                            <input
                                                type="time"
                                                value={resourceFormData.eventTime}
                                                onChange={(e) => handleInputChange('eventTime', e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    errors.eventTime ? 'border-red-500' :
                                                    isDarkMode 
                                                        ? 'bg-gray-700 border-gray-600' 
                                                        : 'bg-white border-gray-300'
                                                } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                            />
                                            {errors.eventTime && (
                                                <p className="mt-1 text-sm text-red-500">{errors.eventTime}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Short Description */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Short Description *
                                        </label>
                                        <textarea
                                            value={resourceFormData.shortDescription}
                                            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                            rows={4}
                                            className={`w-full px-4 py-2 rounded-lg border ${
                                                errors.shortDescription ? 'border-red-500' :
                                                isDarkMode 
                                                    ? 'bg-gray-700 border-gray-600' 
                                                    : 'bg-white border-gray-300'
                                            } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                            placeholder="Enter a short description of the event"
                                        />
                                        {errors.shortDescription && (
                                            <p className="mt-1 text-sm text-red-500">{errors.shortDescription}</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Content Editor */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Content *
                                        </label>
                                        <div className={`border rounded-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                            {/* Formatting Toolbar */}
                                            <div className={`flex items-center gap-1 p-2 border-b ${
                                                isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                                            }`}>
                                                {/* Text Formatting */}
                                                <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
                                                    <button
                                                        type="button"
                                                        title="Bold"
                                                        onClick={(e) => handleFormatting('bold')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <FaBold className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Italic"
                                                        onClick={(e) => handleFormatting('italic')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <FaItalic className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* List Formatting */}
                                                <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
                                                    <button
                                                        type="button"
                                                        title="Bullet List"
                                                        onClick={(e) => handleFormatting('bullet')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <FaListUl className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Numbered List"
                                                        onClick={(e) => handleFormatting('number')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <FaListOl className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Indentation */}
                                                <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
                                                    <button
                                                        type="button"
                                                        title="Decrease Indent"
                                                        onClick={(e) => handleFormatting('outdent')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <FaOutdent className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Increase Indent"
                                                        onClick={(e) => handleFormatting('indent')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <FaIndent className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Block Quote */}
                                                <div className="flex items-center gap-1 pl-2">
                                                    <button
                                                        type="button"
                                                        title="Block Quote"
                                                        onClick={(e) => handleFormatting('quote')}
                                                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                                                            isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <FaQuoteRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content Area */}
                                            <textarea
                                                value={resourceFormData.content}
                                                onChange={(e) => handleInputChange('content', e.target.value)}
                                                rows={8}
                                                className={`w-full px-4 py-2 ${
                                                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                                                } focus:outline-none`}
                                                placeholder="Write your content here..."
                                            />
                                            {errors.content && (
                                                <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Featured Image */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Featured Image *
                                        </label>
                                        <div className={`border-2 border-dashed rounded-lg p-4 ${
                                            errors.featuredImage ? 'border-red-500' :
                                            isDarkMode ? 'border-gray-600' : 'border-gray-300'
                                        }`}>
                                            {resourceFormData.featuredImage ? (
                                                <div className="relative aspect-video">
                                                    <Image
                                                        src={resourceFormData.featuredImage}
                                                        alt="Featured image preview"
                                                        fill
                                                        className="object-cover rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange('featuredImage', '')}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                                    >
                                                        <FiX className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    handleInputChange('featuredImage', reader.result as string);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id="featured-image"
                                                    />
                                                    <label
                                                        htmlFor="featured-image"
                                                        className={`cursor-pointer inline-flex flex-col items-center ${
                                                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                        }`}
                                                    >
                                                        <FiUpload className="w-8 h-8 mb-2" />
                                                        <span>Click to upload or drag and drop</span>
                                                        <span className="text-sm text-gray-500">PNG, JPG up to 10MB</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                        {errors.featuredImage && (
                                            <p className="mt-1 text-sm text-red-500">{errors.featuredImage}</p>
                                        )}
                                    </div>

                                    {/* Publication Settings */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Status
                                            </label>
                                            <select
                                                value={resourceFormData.status}
                                                onChange={(e) => handleInputChange('status', e.target.value as ResourceStatus)}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    isDarkMode 
                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                } focus:ring-2 focus:ring-pink-500`}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Publication Date
                                            </label>
                                            <input
                                                type="date"
                                                value={resourceFormData.publishDate}
                                                min={today}
                                                onChange={(e) => handleInputChange('publishDate', e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    isDarkMode 
                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                } focus:ring-2 focus:ring-pink-500`}
                                            />
                                        </div>
                                    </div>

                                    {/* SEO Metadata */}
                                    <div className="space-y-4">
                                        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            SEO Metadata *
                                        </h3>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Meta Title *
                                            </label>
                                            <input
                                                type="text"
                                                value={resourceFormData.seoMetadata.title}
                                                onChange={(e) => handleInputChange('seoMetadata', e.target.value, 'title')}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    errors.seoMetadata?.title ? 'border-red-500' : 
                                                    isDarkMode 
                                                        ? 'border-gray-600' 
                                                        : 'border-gray-300'
                                                } ${
                                                    isDarkMode 
                                                        ? 'bg-gray-700 text-white' 
                                                        : 'bg-white text-gray-900'
                                                } focus:ring-2 focus:ring-pink-500`}
                                                placeholder="SEO title"
                                            />
                                            {errors.seoMetadata?.title && (
                                                <p className="mt-1 text-sm text-red-500">{errors.seoMetadata.title}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Meta Description *
                                            </label>
                                            <textarea
                                                value={resourceFormData.seoMetadata.description}
                                                onChange={(e) => handleInputChange('seoMetadata', e.target.value, 'description')}
                                                rows={3}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    errors.seoMetadata?.description ? 'border-red-500' :
                                                    isDarkMode 
                                                        ? 'border-gray-600' 
                                                        : 'border-gray-300'
                                                } ${
                                                    isDarkMode 
                                                        ? 'bg-gray-700 text-white' 
                                                        : 'bg-white text-gray-900'
                                                } focus:ring-2 focus:ring-pink-500`}
                                                placeholder="SEO description"
                                            />
                                            {errors.seoMetadata?.description && (
                                                <p className="mt-1 text-sm text-red-500">{errors.seoMetadata.description}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Keywords *
                                            </label>
                                            <input
                                                type="text"
                                                value={resourceFormData.seoMetadata.keywords}
                                                onChange={(e) => handleInputChange('seoMetadata', e.target.value, 'keywords')}
                                                className={`w-full px-4 py-2 rounded-lg border ${
                                                    errors.seoMetadata?.keywords ? 'border-red-500' :
                                                    isDarkMode 
                                                        ? 'border-gray-600' 
                                                        : 'border-gray-300'
                                                } ${
                                                    isDarkMode 
                                                        ? 'bg-gray-700 text-white' 
                                                        : 'bg-white text-gray-900'
                                                } focus:ring-2 focus:ring-pink-500`}
                                                placeholder="Comma-separated keywords"
                                            />
                                            {errors.seoMetadata?.keywords && (
                                                <p className="mt-1 text-sm text-red-500">{errors.seoMetadata.keywords}</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className={`px-4 py-2 rounded-lg ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
                                >
                                    {isEditMode ? 'Update Resource' : 'Create Resource'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {successMessage === 'add' 
                        ? 'Resource successfully added!' 
                        : successMessage === 'delete'
                        ? 'Resource deleted successfully'
                        : 'Resource updated successfully'}
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewModalOpen && previewResource && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-4xl relative shadow-xl backdrop-blur-sm border ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    } max-h-[90vh] overflow-y-auto`}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    isDarkMode
                                        ? 'bg-pink-400/10 text-pink-400'
                                        : 'bg-pink-100 text-pink-800'
                                }`}>
                                    {previewResource.category}
                                </span>
                                <span className={`ml-2 text-sm ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    {new Date(previewResource.publishDate).toLocaleDateString()}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsPreviewModalOpen(false)}
                                className={`p-2 rounded-lg ${
                                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Featured Image */}
                        <div className="relative h-[300px] mb-6 rounded-lg overflow-hidden">
                            <Image
                                src={previewResource.featuredImage || '/placeholder-image.jpg'}
                                alt={previewResource.title}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Title */}
                        <h1 className={`text-3xl font-bold mb-4 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            {previewResource.title}
                        </h1>

                        {previewResource.category === 'Events & Support Groups' ? (
                            // Event Details
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg ${
                                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                                }`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Event Type
                                            </p>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {previewResource.eventCategory}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Date & Time
                                            </p>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {new Date(previewResource.eventDate || '').toLocaleDateString()}{' '}
                                                {previewResource.eventTime}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`prose max-w-none ${
                                    isDarkMode ? 'prose-invert' : ''
                                }`}>
                                    {previewResource.shortDescription}
                                </div>
                            </div>
                        ) : (
                            // Article Content with SEO Metadata at bottom
                            <>
                                {/* Article Content */}
                                <div className={`prose max-w-none mb-8 ${
                                    isDarkMode ? 'prose-invert' : ''
                                }`}>
                                    <div 
                                        className={`${isDarkMode ? 'text-white' : 'text-black'}`}
                                        dangerouslySetInnerHTML={{ 
                                            __html: (previewResource.content || '')
                                                .replace(/\n/g, '<br>')
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                .replace(/^• (.*)$/gm, '<li>$1</li>')
                                                .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
                                                .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
                                        }} 
                                    />
                                </div>

                                {/* Divider */}
                                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} my-8`}></div>

                                {/* SEO Metadata Section */}
                                <div className={`p-4 rounded-lg ${
                                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                                }`}>
                                    <h3 className={`text-lg font-semibold mb-4 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        SEO Metadata
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Meta Title
                                            </p>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {previewResource.seoMetadata.title}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Meta Description
                                            </p>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {previewResource.seoMetadata.description}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Keywords
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {previewResource.seoMetadata.keywords.split(',').map((keyword, index) => (
                                                    <span 
                                                        key={index}
                                                        className={`px-2 py-1 text-sm rounded-full ${
                                                            isDarkMode 
                                                                ? 'bg-gray-600 text-gray-200' 
                                                                : 'bg-gray-200 text-gray-700'
                                                        }`}
                                                    >
                                                        {keyword.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} rounded-lg p-6 w-full max-w-md relative shadow-xl backdrop-blur-sm border ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Delete Resource
                            </h2>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className={`p-2 rounded-lg ${
                                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Confirmation Message */}
                        <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Are you sure you want to delete this resource? This action cannot be undone.
                        </p>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className={`px-4 py-2 rounded-lg ${
                                    isDarkMode 
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleDeleteResource(selectedResource?._id || '');
                                    setIsDeleteModalOpen(false);
                                }}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
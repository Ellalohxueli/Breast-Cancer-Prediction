'use client';

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaAngleLeft } from "react-icons/fa6";
import { Poppins } from 'next/font/google';
import toast from "react-hot-toast";

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export default function SignUpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Get today's date in YYYY-MM-DD format for the max attribute
    const today = new Date().toISOString().split('T')[0];

    const [user, setUser] = React.useState({
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        sex: "",
        dob: "",
        password: "",
        confirmPassword: "",
    });

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        if (!user.firstname.trim()) {
            newErrors.firstname = "First name is required";
            setUser(prev => ({ ...prev, firstname: "" }));
            isValid = false;
        }
        if (!user.lastname.trim()) {
            newErrors.lastname = "Last name is required";
            setUser(prev => ({ ...prev, lastname: "" }));
            isValid = false;
        }
        if (!user.email.trim()) {
            newErrors.email = "Email is required";
            setUser(prev => ({ ...prev, email: "" }));
            isValid = false;
        } else if (!user.email.includes('@')) {
            newErrors.email = "Please enter a valid email address";
            setUser(prev => ({ ...prev, email: "" }));
            isValid = false;
        }
        if (!user.phone.trim()) {
            newErrors.phone = "Phone number is required";
            setUser(prev => ({ ...prev, phone: "" }));
            isValid = false;
        } else if (user.phone.trim().length < 12) { // +60 + 9 digits
            newErrors.phone = "Please enter a valid phone number";
            setUser(prev => ({ ...prev, phone: "" }));
            isValid = false;
        }
        if (!user.sex) {
            newErrors.sex = "Please select your sex";
            setUser(prev => ({ ...prev, sex: "" }));
            isValid = false;
        }
        if (!user.dob) {
            newErrors.dob = "Date of birth is required";
            setUser(prev => ({ ...prev, dob: "" }));
            isValid = false;
        }
        if (!user.password) {
            newErrors.password = "Password is required";
            setUser(prev => ({ ...prev, password: "" }));
            isValid = false;
        } else if (user.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters long";
            setUser(prev => ({ ...prev, password: "" }));
            isValid = false;
        }
        if (!user.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
            setUser(prev => ({ ...prev, confirmPassword: "" }));
            isValid = false;
        } else if (user.password !== user.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            setUser(prev => ({ ...prev, confirmPassword: "" }));
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const onSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/api/users/signup', user);
            toast.success("Sign up successful! Please log in to continue.");
            router.push('/login');
        } catch (error: any) {
            if (error.response?.data?.error) {
                const field = error.response.data.field || 'email';
                setErrors({ [field]: error.response.data.error });
                setUser(prev => ({ ...prev, [field]: "" }));
            } else {
                setErrors({ email: "An error occurred during signup. Please try again." });
                setUser(prev => ({ ...prev, email: "" }));
            }
            toast.error("An error occurred during signup. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const clearError = (field: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    return (
        <div className={`min-h-screen bg-pink-50 flex flex-col items-center pt-16 px-4 sm:px-6 lg:px-8 ${poppins.className}`}>
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg overflow-visible">
                    <div className="relative bg-white px-6 pt-12 pb-8">
                        <div className="absolute left-1/2 transform -translate-x-1/2 -top-12">
                            <div className="bg-white rounded-xl shadow-lg flex items-center justify-center" style={{ width: '90px', height: '90px' }}>
                                <Image
                                    src="/logo.png"
                                    alt="Breast Cancer Detection Logo"
                                    width={110}
                                    height={110}
                                    priority
                                    className="w-auto h-auto object-contain"
                                />
                            </div>
                        </div>
                        
                        <h2 className="text-center text-3xl font-extrabold text-pink-800 mt-6 mb-6">
                            SIGNUP
                        </h2>

                        <form onSubmit={onSignUp} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstname" className="block text-sm font-medium text-pink-700">
                                        First Name
                                    </label>
                                    <input
                                        id="firstname"
                                        type="text"
                                        required
                                        className={`mt-1 block w-full px-3 py-2 border ${
                                            errors.firstname 
                                            ? 'border-red-500 ring-1 ring-red-500' 
                                            : 'border-gray-200'
                                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            errors.firstname 
                                            ? 'focus:border-red-500 focus:ring-red-500' 
                                            : 'focus:border-pink-500 focus:ring-pink-500'
                                        } bg-[#fff0f7] text-gray-600 placeholder-gray-400`}
                                        placeholder="John"
                                        value={user.firstname}
                                        onChange={(e) => {
                                            setUser({ ...user, firstname: e.target.value });
                                            clearError('firstname');
                                        }}
                                    />
                                    {errors.firstname && (
                                        <p className="mt-1 text-sm text-red-500">{errors.firstname}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="lastname" className="block text-sm font-medium text-pink-700">
                                        Last Name
                                    </label>
                                    <input
                                        id="lastname"
                                        type="text"
                                        required
                                        className={`mt-1 block w-full px-3 py-2 border ${
                                            errors.lastname 
                                            ? 'border-red-500 ring-1 ring-red-500' 
                                            : 'border-gray-200'
                                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            errors.lastname 
                                            ? 'focus:border-red-500 focus:ring-red-500' 
                                            : 'focus:border-pink-500 focus:ring-pink-500'
                                        } bg-[#fff0f7] text-gray-600 placeholder-gray-400`}
                                        placeholder="Doe"
                                        value={user.lastname}
                                        onChange={(e) => {
                                            setUser({ ...user, lastname: e.target.value });
                                            clearError('lastname');
                                        }}
                                    />
                                    {errors.lastname && (
                                        <p className="mt-1 text-sm text-red-500">{errors.lastname}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="sex" className="block text-sm font-medium text-pink-700">
                                        Sex
                                    </label>
                                    <select
                                        id="sex"
                                        required
                                        className={`mt-1 block w-full px-3 py-2 border ${
                                            errors.sex 
                                            ? 'border-red-500 ring-1 ring-red-500' 
                                            : 'border-gray-200'
                                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            errors.sex 
                                            ? 'focus:border-red-500 focus:ring-red-500' 
                                            : 'focus:border-pink-500 focus:ring-pink-500'
                                        } bg-[#fff0f7] text-gray-600`}
                                        value={user.sex}
                                        onChange={(e) => {
                                            setUser({ ...user, sex: e.target.value });
                                            clearError('sex');
                                        }}
                                    >
                                        <option value="">Select sex</option>
                                        <option value="female">Female</option>
                                        <option value="male">Male</option>
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                    </select>
                                    {errors.sex && (
                                        <p className="mt-1 text-sm text-red-500">{errors.sex}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="dob" className="block text-sm font-medium text-pink-700">
                                        Date of Birth
                                    </label>
                                    <input
                                        id="dob"
                                        type="date"
                                        required
                                        max={today}
                                        className={`mt-1 block w-full px-3 py-2 border ${
                                            errors.dob 
                                            ? 'border-red-500 ring-1 ring-red-500' 
                                            : 'border-gray-200'
                                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            errors.dob 
                                            ? 'focus:border-red-500 focus:ring-red-500' 
                                            : 'focus:border-pink-500 focus:ring-pink-500'
                                        } bg-[#fff0f7] text-gray-600`}
                                        value={user.dob}
                                        onChange={(e) => {
                                            setUser({ ...user, dob: e.target.value });
                                            clearError('dob');
                                        }}
                                    />
                                    {errors.dob && (
                                        <p className="mt-1 text-sm text-red-500">{errors.dob}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-pink-700">
                                    Phone Number
                                </label>
                                <div className="relative mt-1">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">
                                        +60
                                    </div>
                                    <input
                                        id="phone"
                                        type="tel"
                                        required
                                        className={`block w-full pl-12 pr-3 py-2 border ${
                                            errors.phone 
                                            ? 'border-red-500 ring-1 ring-red-500' 
                                            : 'border-gray-200'
                                        } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            errors.phone 
                                            ? 'focus:border-red-500 focus:ring-red-500' 
                                            : 'focus:border-pink-500 focus:ring-pink-500'
                                        } bg-[#fff0f7] text-gray-600 placeholder-gray-400`}
                                        placeholder="123456789"
                                        value={user.phone.startsWith('+60') ? user.phone.slice(3) : user.phone}
                                        onChange={(e) => {
                                            // Only allow digits
                                            const numbersOnly = e.target.value.replace(/\D/g, '');
                                            
                                            // Limit to 10 digits after +60
                                            if (numbersOnly.length <= 10) {
                                                setUser({ ...user, phone: '+60' + numbersOnly });
                                                clearError('phone');
                                            }
                                        }}
                                        maxLength={10}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-pink-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className={`mt-1 block w-full px-3 py-2 border ${
                                        errors.email 
                                        ? 'border-red-500 ring-1 ring-red-500' 
                                        : 'border-gray-200'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        errors.email 
                                        ? 'focus:border-red-500 focus:ring-red-500' 
                                        : 'focus:border-pink-500 focus:ring-pink-500'
                                    } bg-[#fff0f7] text-gray-600 placeholder-gray-400`}
                                    placeholder="you@example.com"
                                    value={user.email}
                                    onChange={(e) => {
                                        setUser({ ...user, email: e.target.value });
                                        clearError('email');
                                    }}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-pink-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className={`mt-1 block w-full px-3 py-2 border ${
                                        errors.password 
                                        ? 'border-red-500 ring-1 ring-red-500' 
                                        : 'border-gray-200'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        errors.password 
                                        ? 'focus:border-red-500 focus:ring-red-500' 
                                        : 'focus:border-pink-500 focus:ring-pink-500'
                                    } bg-[#fff0f7] text-gray-600 placeholder-gray-400`}
                                    placeholder="••••••••"
                                    value={user.password}
                                    onChange={(e) => {
                                        setUser({ ...user, password: e.target.value });
                                        clearError('password');
                                    }}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-pink-700">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    className={`mt-1 block w-full px-3 py-2 border ${
                                        errors.confirmPassword 
                                        ? 'border-red-500 ring-1 ring-red-500' 
                                        : 'border-gray-200'
                                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        errors.confirmPassword 
                                        ? 'focus:border-red-500 focus:ring-red-500' 
                                        : 'focus:border-pink-500 focus:ring-pink-500'
                                    } bg-[#fff0f7] text-gray-600 placeholder-gray-400`}
                                    placeholder="••••••••"
                                    value={user.confirmPassword}
                                    onChange={(e) => {
                                        setUser({ ...user, confirmPassword: e.target.value });
                                        clearError('confirmPassword');
                                    }}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Signing up..." : "Sign up"}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-pink-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-pink-600">
                                        Already have an account?
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href="/login"
                                    className="w-full flex justify-center py-2 px-4 border border-pink-300 rounded-md shadow-sm text-sm font-medium text-pink-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
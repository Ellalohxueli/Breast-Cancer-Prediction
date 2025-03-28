'use client';

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [user, setUser] = React.useState({
        email: "",
        password: "",
    });

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!user.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!user.email.includes('@')) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!user.password) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            // Try doctor login first
            try {
                const doctorResponse = await axios.post('/api/doctors/login', user);

                localStorage.setItem('doctorId', doctorResponse.data._id);
                localStorage.setItem('name', doctorResponse.data.name);
                localStorage.setItem('image', doctorResponse.data.image);
                localStorage.setItem('userType', 'doctor');
                router.push('/doctordashboard');
                return;
            } catch (doctorError) {
                // If doctor login fails, try regular user login
                const response = await axios.post('/api/users/login', user);

                localStorage.setItem('firstname', response.data.firstname);
                localStorage.setItem('userId', response.data.userId);
                
                // Check user role and redirect accordingly
                const userRole = response.data.role;
                if (userRole === 'admin') {
                    router.push('/admindashboard');
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (error: any) {
            setErrors({ 
                submit: error.response?.data?.error || "Invalid email or password"
            });
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
                            LOGIN
                        </h2>

                        {errors.submit && (
                            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-md">
                                {errors.submit}
                            </div>
                        )}

                        <form onSubmit={onLogin} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-pink-700">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        errors.email 
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                        : 'border-transparent focus:border-pink-500 focus:ring-pink-500'
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
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        errors.password 
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                        : 'border-transparent focus:border-pink-500 focus:ring-pink-500'
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
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Logging in..." : "Login"}
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
                                        Don't have an account?
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href="/sign-up"
                                    className="w-full flex justify-center py-2 px-4 border border-pink-300 rounded-md shadow-sm text-sm font-medium text-pink-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
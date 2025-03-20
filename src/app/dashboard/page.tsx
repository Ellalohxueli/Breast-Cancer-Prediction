'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

export default function DashboardPage() {
    const router = useRouter();

    return (
        <div className={`min-h-screen bg-pink-50 ${poppins.className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Breast Cancer Detection Logo"
                                width={50}
                                height={50}
                                className="w-auto h-auto"
                            />
                            <h1 className="ml-4 text-2xl font-semibold text-pink-800">
                                Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="mt-8 bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900">Welcome to your Dashboard</h2>
                        <p className="mt-2 text-gray-600">
                            This is your personal dashboard where you can manage your breast cancer detection records and appointments.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


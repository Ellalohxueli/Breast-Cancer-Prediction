import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { FiCalendar, FiUsers, FiMessageSquare, FiFileText, FiLogOut, FiGrid } from "react-icons/fi";
import useCheckCookies from "@/controller/UseCheckCookie";
import UseRemoveLocalStorage from "@/controller/UseRemoveLocalStorage";

export default function DoctorNavBar() {
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useCheckCookies();

    const handleLogout = async () => {
        try {
            const response = await axios.get("/api/users/logout");

            // Use the hook here after the logout action
            UseRemoveLocalStorage();

            window.location.href = "/login";
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            {/* Top section with logo and navigation */}
            <div className="flex-1">
                <div className="p-6">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-4">
                            <div className={`p-1 rounded-xl w-[56px] h-[56px] flex items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-pink-100"}`}>
                                <Image src="/logo.png" alt="PinkPath Logo" width={64} height={64} className="object-contain rounded-lg" />
                            </div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-pink-800"}`}>PinkPath</h2>
                        </div>
                    </div>
                </div>
                <nav className="mt-6">
                    <div className="px-4 space-y-2">
                        {[
                            { href: "/doctordashboard", icon: <FiGrid className="w-5 h-5 mr-4" />, text: "Dashboard" },
                            {
                                href: "/doctordashboard/appointments",
                                icon: <FiCalendar className="w-5 h-5 mr-4" />,
                                text: "Appointments",
                                badge: 2,
                            },
                            { href: "/doctordashboard/patients", icon: <FiUsers className="w-5 h-5 mr-4" />, text: "Patients" },
                            {
                                href: "/doctordashboard/messages",
                                icon: <FiMessageSquare className="w-5 h-5 mr-4" />,
                                text: "Messages",
                                badge: 5,
                            },
                            { href: "/doctordashboard/reports", icon: <FiFileText className="w-5 h-5 mr-4" />, text: "Reports" },
                        ].map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors relative ${
                                    pathname === item.href
                                        ? isDarkMode
                                            ? "text-pink-400"
                                            : "text-pink-800"
                                        : isDarkMode
                                        ? "text-gray-200 hover:bg-gray-700"
                                        : "text-gray-700 hover:bg-pink-100"
                                }`}
                            >
                                {pathname === item.href && <div className={`absolute right-0 top-0 h-full w-1 ${isDarkMode ? "bg-pink-400" : "bg-pink-800"}`}></div>}
                                {item.icon}
                                <span className="flex-1">{item.text}</span>
                                {item.badge && (
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDarkMode ? "bg-pink-400/20 text-pink-400" : "bg-pink-100 text-pink-800"}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </nav>
            </div>

            {/* Bottom section with logout button */}
            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isDarkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-pink-100"
                    }`}
                >
                    <FiLogOut className="w-5 h-5 mr-4" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

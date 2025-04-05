import Image from "next/image";
import Link from "next/link";
import { BiMessageRounded } from "react-icons/bi";
import React, { useState, useEffect } from "react";
import { FaRegUser, FaRegBell } from "react-icons/fa";
import axios from "axios";
import UseRemoveLocalStorage from "@/controller/UseRemoveLocalStorage";
import { useRouter } from "next/navigation";
import useCheckCookies from "@/controller/UseCheckCookie";
import { StreamChat } from "stream-chat";
import { DevToken } from "stream-chat";

type NotificationData = {
    _id: string;
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    appointmentDay: string;
    appointmentTime: string;
    status: "cancelled" | "rescheduled";
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function NavBar() {
    const [messageCount, setMessageCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [currentPath, setCurrentPath] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [chatClient, setChatClient] = useState<any>(null);
    const [channels, setChannels] = useState<any[]>([]);

    useCheckCookies();

    const loadChatClient = async () => {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
            throw new Error("Stream API key is missing");
        }

        const client = new StreamChat(apiKey, {
            enableWSFallback: true,
        });

        const username = localStorage.getItem("firstname")?.replace(/[\s.]+/g, "_") || "defaultUser";

        const user = {
            id: username,
            role: "user",
        };

        try {
            await client.connectUser(user, DevToken(user.id));
        } catch (error) {
            console.error("Error connecting user:", error);
        }

        setChatClient(client);

        return client;
    };

    const handleProfileIconClick = () => {
        setShowProfileMenu((prev) => !prev);
    };

    const handleProfileClick = () => {
        setShowProfileMenu(false);
    };

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");

            // Use the hook here after the logout action
            UseRemoveLocalStorage();

            window.location.href = "/login";
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const fetchChannels = async (client: any) => {
        const filter = { type: "messaging" };
        const sort = [{ last_message_at: -1 }];

        const channels = await client.queryChannels(filter, sort, {});

        const filteredChannels = channels
            .filter((channel: any) => channel.id.includes(userId))
            .filter((channel: any) => channel.state.messages && channel.state.messages.length > 0);

        const doctorsData = await Promise.all(
            filteredChannels.map(async (channel: any) => {
                const doctorId = channel.id.split("-")[0];

                const response = await fetch(`/api/doctors/${doctorId}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch doctor data");
                }

                const doctorData = await response.json();

                return {
                    doctorData: doctorData.doctorData[0],
                };
            })
        );

        setChannels(filteredChannels);
    };

    const updateUnreadCount = () => {
        chatClient?.queryChannels({ type: "messaging" }, { last_message_at: -1 }, {}).then((channels: any) => {
            const unreadCount = channels
                .filter((channel: any) => channel.id.includes(userId))
                .filter((channel: any) => channel.state.messages && channel.state.messages.length > 0)
                .filter((channel: any) => !channel.data.isUserRead).length;

            setMessageCount(unreadCount);
        });
    };

    useEffect(() => {
        const currentPath = window.location.pathname;
        setCurrentPath(currentPath);
    }, [currentPath]);

    useEffect(() => {
        if (chatClient) {
            updateUnreadCount();

            const interval = setInterval(() => {
                updateUnreadCount();
            }, 20000);
            return () => clearInterval(interval);
        }
    }, [channels]);

    useEffect(() => {
        setUserId(localStorage.getItem("userId") || "");

        const channelClient = loadChatClient();

        channelClient.then((client) => {
            fetchChannels(client);
        });
    }, [userId]);

    return (
        <div className="w-full bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Image src="/logo.png" alt="Breast Cancer Detection Logo" width={50} height={50} className="w-auto h-auto" />
                    </div>

                    <nav className="flex-1">
                        <ul className="flex items-center justify-end space-x-6">
                            <li>
                                <Link href="/dashboard" className={`font-medium ${currentPath === "/dashboard" ? "text-pink-600" : "text-gray-600"} hover:text-pink-600`}>
                                    HHHome
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard/services"
                                    className={`font-medium ${currentPath === "/dashboard/services" ? "text-pink-600" : "text-gray-600"} hover:text-pink-600`}
                                >
                                    Services
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard/ourteams"
                                    className={`font-medium ${currentPath === "/dashboard/ourteams" ? "text-pink-600" : "text-gray-600"} hover:text-pink-600`}
                                >
                                    Our Team
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard/resources"
                                    className={`font-medium ${currentPath === "/dashboard/resources" ? "text-pink-600" : "text-gray-600"} hover:text-pink-600`}
                                >
                                    Patient Resources
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard/appointments"
                                    className={`font-medium ${currentPath === "/dashboard/appointments" ? "text-pink-600" : "text-gray-600"} hover:text-pink-600`}
                                >
                                    Appointments
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/messages" className="text-gray-600 hover:text-pink-600 relative">
                                    <div className="relative">
                                        <BiMessageRounded className="h-6 w-6" fill={currentPath === "/dashboard/messages" ? "#db2777" : "currentColor"} />
                                        {messageCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                {messageCount}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                            <li>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="text-gray-600 hover:text-pink-600 relative p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <FaRegBell className="h-6 w-6" aria-label="Notifications" fill={isDropdownOpen ? "#db2777" : "currentColor"} />
                                        {notificationCount > 0 && (
                                            <span className="absolute top-0 right-0 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                            <div className="px-4 py-2 border-b border-gray-200">
                                                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                            </div>

                                            <div className="max-h-96 overflow-y-auto">{/* Notification list goes here */}</div>
                                        </div>
                                    )}
                                </div>
                            </li>
                            <li className="relative">
                                <button className="text-gray-600 hover:text-pink-600 focus:outline-none p-2 rounded-full hover:bg-gray-100" onClick={handleProfileIconClick}>
                                    <FaRegUser className="h-6 w-6" aria-label="Profile" fill={showProfileMenu ? "#db2777" : "currentColor"} />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                        <button onClick={handleProfileClick} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <FaRegUser className="h-4 w-4 mr-3" />
                                            Profile
                                        </button>
                                        <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                            <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </li>
                            <li>
                                <a
                                    href="/dashboard/ourteams"
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
    );
}

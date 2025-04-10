"use client";

import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { DevToken } from "stream-chat";
import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import { Trash2, X } from "lucide-react";
import { FaRegUser } from "react-icons/fa";
import LiveChat from "@/components/LiveChat";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FiHome, FiUsers, FiCalendar, FiSettings, FiFileText, FiUserPlus, FiSun, FiMoon, FiBell, FiSearch, FiMessageCircle, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { FaUserDoctor } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import useCheckCookies from "@/controller/UseCheckCookie";
import useCheckAdminUnreadMss from "@/controller/UseCheckAdminUnreadMss";

import axios from "axios";
import { set } from "mongoose";

interface Doctor {
    _id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    specialization?: string;
    operatingHours?: string;
    bio?: string;
    image?: string;
}

interface Appointment {
    _id: string;
    patientName: string;
    doctorName: string;
    dateRange: {
        startDate: string;
    };
    timeSlot: {
        startTime: string;
    };
    status: string;
    reason: string;
}

// First, add a type definition for your navigation items
type NavigationItem = {
    href: string;
    icon: React.ReactNode;
    text: string;
    custom?: boolean;
    component?: React.ReactNode;
};

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

export default function Messages() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [currentDate, setCurrentDate] = useState("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const pathname = usePathname();
    const [showInfoDropdown, setShowInfoDropdown] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);
    const [chatClient, setChatClient] = useState<any>(null);
    const [messageText, setMessageText] = useState("");
    const [userChannelIds, setUserChannelIds] = useState<string[]>([]);
    const [userRole, setUserRole] = useState<"adminToUser" | "adminToDoctor">("adminToUser");
    const [channelsMessageData, setChannelsMessageData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string>("");
    const [chatName, setChatName] = useState<string>("");
    const [urlType, setUrlType] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useCheckCookies();

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
                            pathname.includes("/admindashboard/manage-services") || pathname.includes("/admindashboard/manage-resources")
                                ? isDarkMode
                                    ? "text-pink-400"
                                    : "text-pink-800"
                                : isDarkMode
                                ? "text-gray-200 hover:bg-gray-700"
                                : "text-gray-700 hover:bg-pink-100"
                        }`}
                    >
                        <FiFileText className="w-5 h-5 mr-4" />
                        <span>Information</span>
                        <FiChevronRight className={`w-4 h-4 ml-auto transition-transform ${showInfoDropdown ? "transform rotate-90" : ""}`} />
                    </div>

                    {showInfoDropdown && (
                        <div className={`absolute left-full top-0 ml-2 w-48 rounded-md shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} py-1 z-50`}>
                            <Link
                                href="/admindashboard/manage-services"
                                className={`block px-4 py-2 text-sm ${isDarkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-pink-50"}`}
                            >
                                Manage Services
                            </Link>
                            <Link
                                href="/admindashboard/manage-resources"
                                className={`block px-4 py-2 text-sm ${isDarkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-pink-50"}`}
                            >
                                Manage Resources
                            </Link>
                        </div>
                    )}
                </div>
            ),
        },
    ];

    // Read query parameter using useSearchParams (client side)
    useEffect(() => {
        // This hook runs only on the client
        const typeParam = searchParams.get("type");
        setUrlType(typeParam || "all");
    }, [searchParams]);

    // Load chat client and fetch channels when userId or urlType changes
    useEffect(() => {
        setIsLoading(true);

        setUserId(localStorage.getItem("userId") || "");

        const channelClientPromise = loadChatClient();
        channelClientPromise.then((client) => {
            fetchChannels(client, urlType);
        });
    }, [userId, urlType]);

    const loadChatClient = async () => {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
            throw new Error("Stream API key is missing");
        }

        const client = new StreamChat(apiKey, {
            enableWSFallback: true,
        });

        const user = {
            id: "Admin",
            role: userRole,
        };

        try {
            await client.connectUser(user, DevToken(user.id));
        } catch (error) {
            console.error("Error connecting user:", error);
        }

        setChatClient(client);

        return client;
    };

    const fetchChannels = async (client: any, type: string | null) => {
        const filter = { type: "messaging" };
        const sort = [{ last_message_at: -1 }];

        const channels = await client.queryChannels(filter, sort, {});

        let filChannels = channels.filter((channel: any) => channel.state.messages && channel.state.messages.length > 0).filter((channel: any) => channel.id.includes("admin"));

        if (type === "user") {
            filChannels = filChannels.filter((channel: any) => channel.id.split("-")[0] === "admin");
        }

        if (type === "doctor") {
            filChannels = filChannels.filter((channel: any) => channel.id.split("-")[0] !== "admin");
        }

        setUserChannelIds(filChannels.map((channel: any) => channel.id));

        const messagesData = await Promise.all(
            filChannels.map(async (channel: any) => {
                const messageId = channel.id.split("-")[0];

                if (messageId === "admin") {
                    const userId = channel.id.split("-")[1];

                    const response = await fetch(`/api/users/${userId}`);

                    if (!response.ok) {
                        throw new Error("Failed to fetch user data");
                    }

                    const userData = await response.json();

                    return {
                        userData: userData.userData[0],
                    };
                } else {
                    const response = await fetch(`/api/doctors/${messageId}`);

                    if (!response.ok) {
                        throw new Error("Failed to fetch doctor data");
                    }

                    const doctorData = await response.json();

                    return {
                        doctorData: doctorData.doctorData[0],
                    };
                }
            })
        );

        setChannelsMessageData(messagesData);
        setChannels(filChannels);
        setIsLoading(false);
    };

    useEffect(() => {
        setUserId(localStorage.getItem("userId") || "");

        const channelClient = loadChatClient();

        channelClient.then((client) => {
            fetchChannels(client, urlType);
        });
    }, [userId]);

    const handleChannelSelection = async (channel: any, dex: any) => {
        toast.dismiss();

        setIsLoading(false);

        try {
            await channel.updatePartial({ set: { isAdminRead: true } });

            fetchChannels(chatClient, urlType);

            const updatedChannel = channels.find((c) => c.id === channel.id);

            if (updatedChannel) {
                setSelectedChannel(updatedChannel);

                if (channel.id.split("-")[0] === "admin") {
                    setUserRole("adminToUser");
                    setChatName(channelsMessageData[dex]?.userData?.firstname + " " + channelsMessageData[dex]?.userData?.lastname);
                } else {
                    setUserRole("adminToDoctor");
                    setChatName(channelsMessageData[dex]?.doctorData?.name);
                }
            }
        } catch (error) {
            toast.error("Error selecting the channel");
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);

        toast.dismiss();

        try {
            if (selectedChannel) {
                await selectedChannel.delete();
                setSelectedChannel(null);
                setChatName("");
                setMessageText("");
                setChannels([]);

                toast.success("Channel deleted successfully");

                location.reload();
            } else {
                toast.error("Channel not found");
            }
        } catch (error) {
            toast.error("Error deleting the channel");
        }
    };

    const convertTime = (timestamp: string) => {
        const date = new Date(timestamp);

        const day = date.getDate().toString().padStart(2, "0");
        const month = date.toLocaleString("default", { month: "short" });
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";

        const hours12 = hours % 12 || 12;

        return `${day} ${month} ${hours12}:${minutes} ${ampm}`;
    };

    const userLastMessage = (channel: any) => {
        const lastMessage = channel.state.messages[channel.state.messages.length - 1];
        const lastMessageText = lastMessage ? lastMessage.text : "";
        const lastMessageSender = lastMessage ? lastMessage.user.id : "";

        return (
            <div className="flex-shrink-0 text-sm text-gray-500">
                {lastMessageSender === "Admin" ? (
                    <span>You: {lastMessageText}</span>
                ) : (
                    <span className={`${!channel.data.isAdminRead && `font-bold text-black`}`}>{lastMessageText}</span>
                )}
            </div>
        );
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (chatClient) {
                fetchChannels(chatClient, urlType);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [chatClient]);

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");
            localStorage.removeItem("firstname");
            window.location.href = "/login";
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    useEffect(() => {
        const checkUnreadMessages = async () => {
            try {
                const unreadCount: any = await useCheckAdminUnreadMss();
                setUnreadCount(unreadCount);
            } catch (error) {
                console.error("Error checking unread messages:", error);
            }
        };

        checkUnreadMessages();
        const intervalId = setInterval(checkUnreadMessages, 20000);

        return () => clearInterval(intervalId);
    }, []);

    const roleType = (channel: any) => {
        return (
            <span
                className={`px-[6px] py-[2px] rounded-full text-[12px]
                    ${channel.id.split("-")[0] === "admin" ? "bg-green-100 text-green-700" : "bg-purple-200 text-purple-700"}
                `}
            >
                {channel.id.split("-")[0] === "admin" ? "User" : "Doctor"}
            </span>
        );
    };

    return (
        <div className={`flex min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            {/* Sidebar - Fixed */}
            <div className={`w-64 shadow-lg flex flex-col justify-between fixed left-0 top-0 h-screen ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <div>
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
                            {navigationItems.map((item, index) =>
                                item.custom ? (
                                    <div key={index}>{item.component}</div>
                                ) : (
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
                                        <span>{item.text}</span>
                                    </Link>
                                )
                            )}
                        </div>
                    </nav>
                </div>
            </div>

            <div className="flex-1 flex flex-col ml-64">
                {/* Top Menu Bar - Fixed */}
                <div className={`px-8 py-4 flex items-center justify-between fixed top-0 right-0 left-64 z-10 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} shadow-sm`}>
                    {/* Welcome Message */}
                    <div className="flex-shrink-0">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Messages</h1>
                        <p className={`text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{currentDate}</p>
                    </div>

                    {/* Right Side Icons
                    <div className="flex items-center space-x-6">
                        Messages
                        <button className="relative">
                            <FiMessageCircle className={`w-5 h-5 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                            )}
                        </button>

                        Notifications
                        <button className="relative">
                            <FiBell className={`w-5 h-5 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                        </button>

                       Vertical Divider 
                        <div className={`h-6 w-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>

                        <div className="flex items-center space-x-3">
                             Profile 
                            <div className="flex items-center space-x-3 relative">
                                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-3 focus:outline-none">
                                    <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center">
                                        <span className={`text-sm font-medium ${isDarkMode ? "text-gray-800" : "text-pink-800"}`}>{firstName.charAt(0)}</span>
                                    </div>
                                    <div className={`flex items-center space-x-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                        <p className="text-sm font-medium">{firstName}</p>
                                        <FiChevronDown
                                            className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-400/70"} transition-transform ${
                                                isProfileOpen ? "transform rotate-180" : ""
                                            }`}
                                        />
                                    </div>
                                </button>

                                Dropdown Menu 
                                {isProfileOpen && (
                                    <div
                                        className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg py-1 ${
                                            isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
                                        }`}
                                    >
                                        <button
                                            onClick={handleLogout}
                                            className={`w-full text-left px-4 py-2 text-sm ${
                                                isDarkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
                                            } transition-colors flex items-center space-x-2`}
                                        >
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div> */}
                </div>

                <div className="flex p-4 pt-14 overflow-y-auto h-[100vh]">
                    <div className="w-2/5 bg-white p-4 border-r h-full overflow-y-auto">
                        <div className="flex gap-4 mb-4">
                            <Button
                                onClick={() => {
                                    router.push("/admindashboard/messages?type=all");
                                }}
                                className={`${urlType === "all" ? "bg-pink-600 text-white hover:bg-pink-600" : "bg-gray-200 text-gray-800 hover:bg-pink-300"}`}
                            >
                                All
                            </Button>
                            <Button
                                onClick={() => {
                                    router.push("/admindashboard/messages?type=user");
                                }}
                                className={`${urlType === "user" ? "bg-pink-600 text-white hover:bg-pink-600" : "bg-gray-200 text-gray-800 hover:bg-pink-300"}`}
                            >
                                User
                            </Button>
                            <Button
                                onClick={() => {
                                    router.push("/admindashboard/messages?type=doctor");
                                }}
                                className={`${urlType === "doctor" ? "bg-pink-600 text-white hover:bg-pink-600" : "bg-gray-200 text-gray-800 hover:bg-pink-300"}`}
                            >
                                Doctor
                            </Button>
                        </div>

                        <ul className="space-y-2">
                            {!isLoading && channels.map((channel, index) => (
                                <li key={index} className="flex space-x-4 mt-5">
                                    <Button
                                        onClick={() => handleChannelSelection(channel, index)}
                                        className={`flex flex-col w-full text-left bg-white text-black p-3 rounded-md hover:bg-pink-300 shadow-ring hover:shadow-md transition duration-200 ease-in-out 
                                        ${channel.id === selectedChannel?.id ? "bg-gray-300" : ""}
                                        ${channel.id !== selectedChannel?.id ? "h-[120px]" : "h-[90px]"}
                                        ${channel.id !== selectedChannel?.id && "pt-0"}
                                        ${
                                            channel.id.split("-")[0] === "admin"
                                                ? channel.id !== selectedChannel?.id
                                                    ? "h-[100px]"
                                                    : "h-[50px]"
                                                : channel.id !== selectedChannel?.id
                                                ? "h-[120px]"
                                                : "h-[90px]"
                                        }
                                    `}
                                    >
                                        <div className="flex items-center w-full h-full gap-5 text-[16px]">
                                            <div className="flex-shrink-0">
                                                {channelsMessageData[index]?.doctorData?.image ? (
                                                    <Image
                                                        src={channelsMessageData[index]?.doctorData?.image}
                                                        alt="Doctor Profile"
                                                        width={60}
                                                        height={60}
                                                        className="w-16 h-16 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <FaRegUser className="w-24 h-24 rounded-full" />
                                                )}
                                            </div>

                                            <div className="flex flex-grow text-left gap-2">
                                                <span>
                                                    {channel.id.split("-")[0] === "admin"
                                                        ? channelsMessageData[index]?.userData?.firstname + " " + channelsMessageData[index]?.userData?.lastname
                                                        : channelsMessageData[index]?.doctorData?.name}
                                                </span>
                                                {roleType(channel)}
                                            </div>

                                            <div className="flex-shrink-0 text-sm text-gray-500">
                                                <span>{convertTime(channel.data.last_message_at)}</span>
                                            </div>
                                        </div>

                                        {/* User's Last Message */}
                                        {channel.id !== selectedChannel?.id && (
                                            <div className="flex gap-6 text-sm text-gray-500 mr-auto w-full justify-between">
                                                {userLastMessage(channel)}
                                                {!channel.data.isAdminRead && <span className="bg-pink-500 text-white px-2 py-1 rounded-full">New</span>}
                                            </div>
                                        )}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right side: Chat window */}
                    <div className="flex flex-col w-3/5 h-full bg-white p-5 border rounded-md shadow-md">
                        {!isLoading && selectedChannel ? (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                    <div className="flex items-center space-x-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            {chatName}
                                            {roleType(selectedChannel)}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button variant="outline" onClick={handleDelete} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                            <Trash2 height={60} />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedChannel(null);
                                                setChatName("");
                                                setMessageText("");
                                            }}
                                            className="bg-red-500 text-white hover:bg-red-600"
                                        >
                                            <X height={60} />
                                        </Button>
                                    </div>
                                </div>

                                <LiveChat channel={selectedChannel} chatClient={chatClient} userRole={userRole} messageText={messageText} setMessageText={setMessageText} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p>Select a channel to start chatting.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

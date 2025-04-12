import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { FiCalendar, FiUsers, FiMessageSquare, FiFileText, FiLogOut, FiGrid } from "react-icons/fi";
import useCheckCookies from "@/controller/UseCheckCookie";
import UseRemoveLocalStorage from "@/controller/UseRemoveLocalStorage";
import { StreamChat } from "stream-chat";
import { DevToken } from "stream-chat";

export default function DoctorNavBar() {
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [userChannelIds, setUserChannelIds] = useState<string[]>([]);
    const [doctorId, setDoctorId] = useState<string>("");
    const [channelsUserData, setChannelsUserData] = useState<any[]>([]);
    const [chatClient, setChatClient] = useState<any>(null);
    const [userRole, setUserRole] = useState<"doctor" | "user">("user");
    const [unreadCount, setUnreadCount] = useState(0);
    const [remainingAppointments, setRemainingAppointments] = useState(0);

    useCheckCookies();

    const loadChatClient = async () => {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) {
            throw new Error("Stream API key is missing");
        }

        const client = new StreamChat(apiKey, {
            enableWSFallback: true,
        });

        const username = localStorage.getItem("name")?.replace(/[\s.]+/g, "_") || "defaultUser";

        const user = {
            id: username,
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

    const fetchChannels = async (client: any) => {
        const filter = { type: "messaging" };
        const sort = [{ last_message_at: -1 }];

        const channels = await client.queryChannels(filter, sort, {});

        const filteredChannels = channels
            .filter((channel: any) => channel.id.includes(doctorId))
            .filter((channel: any) => !channel.id.includes("admin"))
            .filter((channel: any) => channel.state.messages && channel.state.messages.length > 0);

        setUserChannelIds(filteredChannels.map((channel: any) => channel.id));

        const usersData = await Promise.all(
            filteredChannels.map(async (channel: any) => {
                const userId = channel.id.split("-")[1];

                const response = await fetch(`/api/users/${userId}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const userData = await response.json();

                return {
                    userData: userData.userData[0],
                };
            })
        );

        setChannelsUserData(usersData);

        setChannels(filteredChannels);
    };

    const updateUnreadCount = () => {
        chatClient?.queryChannels({ type: "messaging" }, { last_message_at: -1 }, {}).then((channels: any) => {
            const unreadCount = channels
                .filter((channel: any) => channel.id.includes(doctorId))
                .filter((channel: any) => channel.state.messages && channel.state.messages.length > 0)
                .filter((channel: any) => !channel.data.isDoctorRead);

            setUnreadCount(unreadCount.length);
        });
    };

    useEffect(() => {
        if (chatClient) {
            updateUnreadCount();

            const interval = setInterval(() => {
                updateUnreadCount();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [channels]);

    useEffect(() => {
        const storedDoctorId = localStorage.getItem("doctorId");
        setDoctorId(storedDoctorId || "");

        const channelClient = loadChatClient();

        channelClient.then((client) => {
            fetchChannels(client);
        });
    }, [doctorId]);

    useEffect(() => {
        const fetchRemainingAppointments = async () => {
            try {
                const response = await axios.get("/api/doctors/appointment");
                if (response.data.success) {
                    const appointments = response.data.appointments;
                    const today = new Date();
                    const remaining = appointments.filter((appointment: any) => {
                        const appointmentDate = new Date(appointment.dateRange.startDate);
                        return appointmentDate.toDateString() === today.toDateString() && (appointment.status === "Booked" || appointment.status === "Ongoing");
                    }).length;
                    setRemainingAppointments(remaining);
                }
            } catch (error) {
                console.error("Error fetching remaining appointments:", error);
            }
        };

        fetchRemainingAppointments();
        const interval = setInterval(fetchRemainingAppointments, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

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
                                badge: remainingAppointments > 0 ? remainingAppointments : null,
                            },
                            { href: "/doctordashboard/patients", icon: <FiUsers className="w-5 h-5 mr-4" />, text: "Patients" },
                            {
                                href: "/doctordashboard/messages",
                                icon: <FiMessageSquare className="w-5 h-5 mr-4" />,
                                text: "Messages",
                                badge: unreadCount > 0 ? unreadCount : null,
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

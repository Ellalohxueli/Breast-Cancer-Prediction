"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DevToken, StreamChat } from "stream-chat";
import { Button } from "@/components/ui/button";
import { generateUsername } from "unique-username-generator";
import useCheckCookies from "@/controller/UseCheckCookie";
import { Poppins } from "next/font/google";
import NavBar from "@/components/UserNavBar";
import { Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import LiveChat from "@/components/LiveChat";
import { set } from "mongoose";
import axios from "axios";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

interface Doctor {
    _id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    operatingHours: string;
    bio: string;
    image: string;
}

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

export default function DoctorChat() {
    const router = useRouter();
    const { doctorId } = useParams();
    const [channel, setChannel] = useState<null>(null);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [messageText, setMessageText] = useState("");
    const [userRole, setUserRole] = useState<"doctor" | "user">("user");
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

    useCheckCookies();

    useEffect(() => {
        const storedUserType = localStorage.getItem("userType");

        if (storedUserType === "doctor" || storedUserType === "user") {
            setUserRole(storedUserType as "doctor" | "user");
        }

        async function fetchAppointmentData() {
            toast.dismiss();

            try {
                const response = await fetch(`/api/users/appointment/${window.location.pathname.split("/")[2]}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch appointment data");
                }
                const data = await response.json();

                if (!data.doctor) {
                    toast.error("Doctor not found");
                    router.push("/dashboard/ourteams");
                }

                setDoctor(data.doctor);
                setIsLoading(false);
            } catch (error: any) {
                toast.error("Somthing went wrong, please try again later");
                router.push("/dashboard/ourteams");
            }
        }

        fetchAppointmentData();
    }, []);

    const doctorIdString = Array.isArray(doctorId) ? doctorId[0] : doctorId;

    const loadChatClient = async () => {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

        if (!apiKey) {
            throw new Error("Stream API key is missing");
        }

        const newChatClient = new StreamChat(apiKey, {
            enableWSFallback: true,
        });

        const userId = localStorage.getItem("userId");
        const localUser = localStorage.getItem("firstname");
        const id = (localUser || generateUsername()) + "_User";
        const userToConnect = {
            id,
            userId: userId,
            doctorId: doctorIdString,
            role: userRole,
        };

        try {
            await newChatClient.connectUser(userToConnect, DevToken(userToConnect.id));
        } catch (error) {
            toast.error("Error connecting user to chat client");
        }

        const channelId = doctorIdString + "-" + userId;

        const channelInstance = newChatClient.channel("messaging", channelId, {
            isDoctorRead: false,
            isUserRead: true,
        });

        try {
            await channelInstance.watch();
            setChannel(channelInstance);
        } catch (error) {
            toast.error("Error joining the channel");
        }

        setChatClient(newChatClient);
    };

    useEffect(() => {
        if (doctorIdString) {
            loadChatClient();
        }
    }, [doctorIdString]);

    const handleDelete = async () => {
        setIsLoading(true);

        toast.dismiss();

        try {
            if (channel) {
                await channel.delete();

                toast.success("Channel deleted successfully");

                router.push("/dashboard/ourteams");
            } else {
                toast.error("Channel not found");
            }
        } catch (error) {
            toast.error("Error deleting the channel");
        }
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setShowProfileMenu(false);
    };

    const handleNotificationClick = async (notification: NotificationData) => {
        try {
            if (!notification.isRead) {
                const response = await axios.put("/api/notifications/read", {
                    notificationId: notification._id,
                });

                if (response.data.success) {
                    setNotifications((prevNotifications) => prevNotifications.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
                    setNotificationCount((prev) => Math.max(0, prev - 1));
                }
            }

            setSelectedNotification(notification);
            setIsNotificationModalOpen(true);
        } catch (error) {
            console.error("Error updating notification read status:", error);
        }
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            <NavBar onProfileClick={handleProfileClick} onNotificationClick={handleNotificationClick} />

            <div className="flex h-full p-15 gap-20">
                {/* Left Section - Doctor Details */}
                <div className="flex flex-col w-2/4 bg-white p-4 border rounded-md shadow-md h-full">
                    <div className="flex items-center space-x-6 mb-6">
                        <img src={doctor?.image} alt="Doctor Image" className="w-32 h-32 object-cover rounded-full" />
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doctor?.name}</h3>
                            <p className="text-gray-600">{doctor?.specialization}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <p>
                            <strong>Email:</strong>
                            <br />
                            {doctor?.email}
                        </p>
                        <p>
                            <strong>Phone:</strong>
                            <br />
                            {doctor?.phone}
                        </p>
                        <p>
                            <strong>Operating Hours:</strong>
                            <br />
                            {doctor?.operatingHours}
                        </p>
                        <p>
                            <strong>Bio:</strong>
                            <br />
                            {doctor?.bio}
                        </p>
                    </div>

                    <div className="flex justify-center mt-6">
                        <Button onClick={() => router.push(`/appointment/${doctor?._id}`)} className="bg-pink-600 text-white hover:bg-pink-700">
                            View Appointments
                        </Button>
                    </div>
                </div>

                {/* Right Section - Chat */}
                <div className="flex flex-col w-2/4 h-[80vh] bg-white p-5 border rounded-md shadow-md">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <div className="flex items-center space-x-4">
                                <img src={doctor?.image} alt="Doctor Image" className="w-12 h-12 object-cover rounded-full" />
                                <h3 className="text-lg font-semibold text-gray-900">{doctor?.name}</h3>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button variant="outline" onClick={handleDelete} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                    <Trash2 height={60} />
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        router.push("/dashboard/ourteams");
                                    }}
                                    className="bg-red-500 text-white hover:bg-red-600"
                                >
                                    <X height={60} />
                                </Button>
                            </div>
                        </div>

                        {!isLoading && doctor && channel && chatClient && (
                            <LiveChat channel={channel} chatClient={chatClient} userRole={"user"} messageText={messageText} setMessageText={setMessageText} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

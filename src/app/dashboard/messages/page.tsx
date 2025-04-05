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
import { useRouter } from "next/navigation";
import NavBar from "@/components/UserNavBar";
import Image from "next/image";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

export default function Messages() {
    const router = useRouter();
    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);
    const [chatClient, setChatClient] = useState<any>(null);
    const [messageText, setMessageText] = useState("");
    const [userChannelIds, setUserChannelIds] = useState<string[]>([]);
    const [userRole, setUserRole] = useState<"doctor" | "user">("user");
    const [channelsDoctorData, setChannelsDoctorData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string>("");

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

    const fetchChannels = async (client: any) => {
        const filter = { type: "messaging" };
        const sort = [{ last_message_at: -1 }];

        const channels = await client.queryChannels(filter, sort, {});

        const filteredChannels = channels
            .filter((channel: any) => channel.id.includes(userId))
            .filter((channel: any) => channel.state.messages && channel.state.messages.length > 0);

        setUserChannelIds(filteredChannels.map((channel: any) => channel.id));

        const doctorsData = await Promise.all(
            filteredChannels.map(async (channel: any) => {
                const doctorId = channel.id.split("-")[0];

                const response = await fetch(`/api/doctors/${doctorId}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const doctorData = await response.json();

                return {
                    doctorData: doctorData.doctorData[0],
                };
            })
        );

        setChannelsDoctorData(doctorsData);

        setChannels(filteredChannels);
    };

    useEffect(() => {
        setUserId(localStorage.getItem("userId") || "");

        const channelClient = loadChatClient();

        channelClient.then((client) => {
            fetchChannels(client);
        });
    }, [userId]);

    const handleChannelSelection = async (channel: any) => {
        setIsLoading(false);

        try {
            await channel.updatePartial({ set: { isUserRead: true } });

            fetchChannels(chatClient);

            const updatedChannel = channels.find((c) => c.id === channel.id);

            if (updatedChannel) {
                setSelectedChannel(updatedChannel);
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
                fetchChannels(chatClient);
                toast.success("Channel deleted successfully");
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
                {lastMessageSender === channel.data.created_by.id ? <span>You: {lastMessageText}</span> : <span>{lastMessageText}</span>}
            </div>
        );
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (chatClient) {
                fetchChannels(chatClient);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [chatClient]);

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            <NavBar />

            <div className="flex h-[93vh]">
                <div className="w-2/5 bg-white p-4 border-r h-full overflow-y-auto">
                    <h2 className="text-xl font-semibold">Messages</h2>
                    <ul className="space-y-2">
                        {channels.map((channel, index) => (
                            <li key={index} className="flex space-x-4 mt-5">
                                <Button
                                    onClick={() => handleChannelSelection(channel)}
                                    className={`flex flex-col w-full text-left bg-white text-black p-3 pt-0 rounded-md hover:bg-pink-300 shadow-ring hover:shadow-md transition duration-200 ease-in-out 
                                        ${channel.id === selectedChannel?.id ? "bg-gray-300" : ""}
                                        ${channel.id !== selectedChannel?.id ? "h-[120px]" : "h-[90px]"}
                                    `}
                                >
                                    <div className="flex items-center w-full h-full gap-5 text-[16px]">
                                        <div className="flex-shrink-0">
                                            {channelsDoctorData[index]?.doctorData?.image ? (
                                                <Image
                                                    src={channelsDoctorData[index]?.doctorData?.image}
                                                    alt="Doctor Profile"
                                                    width={60}
                                                    height={60}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                            ) : (
                                                <FaRegUser className="w-24 h-24 rounded-full" />
                                            )}
                                        </div>

                                        <div className="flex-grow text-left">
                                            <span>{channelsDoctorData[index]?.doctorData?.name}</span>
                                        </div>

                                        <div className="flex-shrink-0 text-sm text-gray-500">
                                            <span>{convertTime(channel.data.last_message_at)}</span>
                                        </div>
                                    </div>

                                    {/* User's Last Message */}
                                    {channel.id !== selectedChannel?.id && (
                                        <div className="flex gap-6 text-sm text-gray-500 mr-auto w-full justify-between">
                                            {userLastMessage(channel)}
                                            {!channel.data.isUserRead && <span className="bg-pink-500 text-white px-2 py-1 rounded-full">New</span>}
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
                                    <h3 className="text-lg font-semibold text-gray-900">{selectedChannel.data.created_by.id}</h3>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button variant="outline" onClick={handleDelete} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                        <Trash2 height={60} />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedChannel(null);
                                        }}
                                        className="bg-red-500 text-white hover:bg-red-600"
                                    >
                                        <X height={60} />
                                    </Button>
                                </div>
                            </div>

                            <LiveChat channel={selectedChannel} chatClient={chatClient} userRole={"doctor"} messageText={messageText} setMessageText={setMessageText} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p>Select a channel to start chatting.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

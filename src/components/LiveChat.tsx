"use client";
import { Channel, Chat } from "stream-chat-react";
import Messages from "@/components/ui/Messages";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StreamChat, Message } from "stream-chat";

interface LiveChatProps {
    channel: Channel;
    chatClient: StreamChat;
    userRole: "doctor" | "user" | "userToAdmin" | "adminToUser" | "doctorToAdmin" | "adminToDoctor";
    messageText: string;
    setMessageText: React.Dispatch<React.SetStateAction<string>>;
}

export default function LiveChat({ channel, chatClient, userRole, messageText, setMessageText }: LiveChatProps) {
    const handleSendMessage = async () => {
        let updateType: string;

        if (userRole === "doctor" || userRole === "adminToUser") {
            updateType = "isUserRead";
        } else if (userRole === "user" || userRole === "adminToDoctor") {
            updateType = "isDoctorRead";
        } else if (userRole === "userToAdmin" || userRole === "doctorToAdmin") {
            updateType = "isAdminRead";
        } else {
            console.error("Invalid user role:", userRole);
            return;
        }

        if (channel && messageText.trim()) {
            await channel.sendMessage({ text: messageText });

            await channel.updatePartial({
                set: {
                    [updateType]: false,
                },
            });

            setMessageText("");
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto">
                {channel && chatClient && (
                    <Chat client={chatClient}>
                        <Channel channel={channel}>
                            <Messages />
                        </Channel>
                    </Chat>
                )}
            </div>

            <Textarea id="message_text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message..." className="min-h-[100px] w-full" />

            <Button className="w-full px-4 py-2 mt-4 bg-pink-600 text-white rounded-md hover:bg-pink-700" onClick={handleSendMessage}>
                Send Message
            </Button>
        </>
    );
}

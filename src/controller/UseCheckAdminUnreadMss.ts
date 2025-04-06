import { DevToken, StreamChat } from "stream-chat";

const checkAdminUnreadMss = async () => {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
        throw new Error("Stream API key is missing");
    }

    const client = new StreamChat(apiKey, {
        enableWSFallback: true,
    });

    const user = {
        id: "Admin",
        role: "user",
    };

    try {
        await client.connectUser(user, DevToken(user.id));
    } catch (error) {
        console.error("Error connecting user:", error);
    }

    const userId = localStorage.getItem("userId");

    if (!userId) {
        console.error("User ID not found in local storage");
        return;
    }

    try {
        const channels = await client.queryChannels({ type: "messaging" }, { last_message_at: -1 }, {});

        if (channels.length === 0) {
            console.log("No channels found");
            return 0;
        }

        const unreadCount = channels
            .filter((channel: any) => channel.id.includes("admin"))
            .filter((channel: any) => channel.state.messages && channel.state.messages.length > 0)
            .filter((channel: any) => !channel.data.isAdminRead).length;

        return unreadCount;
    } catch (error) {
        console.error("Error fetching channels");
        return 0;
    }
};

export default checkAdminUnreadMss;

import UseRemoveLocalStorage from "@/controller/UseRemoveLocalStorage";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function SessionOut() {
    const [session, setSession] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            const storedCount = localStorage.getItem("count");
            const newCount = storedCount ? parseInt(storedCount) + 1 : 1;
            localStorage.setItem("count", newCount.toString());

            // 10 minutes
            if (newCount >= 120) {
                setSession(false);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        localStorage.setItem("count", (0).toString());
    }, []);

    const handleRefresh = () => {
        setSession(true);
        window.location.reload();
    };

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");

            UseRemoveLocalStorage();

            router.push("/login");
        } catch (error: any) {
            UseRemoveLocalStorage();

            router.push("/login");
        }
    };

    return (
        <>
            {!session && (
                <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur bg-black/50">
                    <div className="bg-white rounded-lg p-8 shadow-lg text-center">
                        <h2 className="text-2xl font-bold mb-4">Session Timeout</h2>
                        <p className="text-lg mb-5">Please refresh the page or log out.</p>
                        <div className="mt-5 flex gap-2 justify-center">
                            <button onClick={handleRefresh} className="px-4 py-2 rounded text-white bg-blue-500 hover:bg-blue-600">
                                Refresh
                            </button>
                            <button onClick={handleLogout} className="px-4 py-2 rounded text-white bg-gray-600 hover:bg-gray-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

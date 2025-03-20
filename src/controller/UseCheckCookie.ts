import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

const useCheckCookies  = () => {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                await axios.get("/api/users/check-cookies");
            } catch (error: any) {
                toast.dismiss();
                toast.error("Login Session Expired. Please login again.");
                router.push("/login");
            }
        };

        checkSession();
    }, [router]);
};

export default useCheckCookies ;

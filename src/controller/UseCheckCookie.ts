import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const useCheckCookies  = () => {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                await axios.get("/api/users/check-cookies");
            } catch (error: any) {
                router.push("/login");
            }
        };

        checkSession();
    }, [router]);
};

export default useCheckCookies ;

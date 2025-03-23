"use client";

import { useEffect, useState } from "react";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BiMessageRounded } from "react-icons/bi";
import { FaRegBell, FaRegUser } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

interface AppointmentSlot {
    _id: string;
    startTime: string;
    endTime: string;
}

interface WeeklySchedule {
    [key: string]: {
        isAvailable: boolean;
        timeSlots: AppointmentSlot[];
        _id: string;
    };
}

interface Appointment {
    _id: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    weeklySchedule: WeeklySchedule;
}

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

export default function AppointmentPage() {
    const router = useRouter();
    const [messageCount, setMessageCount] = useState(3);
    const [notificationCount, setNotificationCount] = useState(5);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [appointments, setAppointments] = useState<Appointment[] | null>(null);
    const [selectedSlots, setSelectedSlots] = useState<{ [key: string]: string }>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAppointmentData() {
            try {
                const response = await fetch(`/api/users/appointment/${window.location.pathname.split("/")[2]}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch appointment data");
                }

                const data = await response.json();

                setDoctor(data.doctor);
                setAppointments(data.appointments);
            } catch (error: any) {
                setError(error.message);
            }
        }

        fetchAppointmentData();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.get("/api/users/logout");

            localStorage.removeItem("firstname");
            localStorage.removeItem("userId");

            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleSubmit = async () => {
        toast.dismiss();

        const doctorId = doctor?._id;

        if (doctorId && selectedSlots[doctorId]) {
            const selectedSlotId = selectedSlots[doctorId];

            const selectedAppointment = appointments?.find((appointment) =>
                Object.keys(appointment.weeklySchedule).some((day) => appointment.weeklySchedule[day].timeSlots.some((slot) => slot._id === selectedSlotId))
            );

            if (selectedAppointment) {
                const { startDate, endDate } = selectedAppointment.dateRange;

                let selectedDay: string | undefined;
                let selectedTimeSlot: AppointmentSlot | undefined;

                Object.keys(selectedAppointment.weeklySchedule).forEach((day) => {
                    const schedule = selectedAppointment.weeklySchedule[day];
                    const slot = schedule.timeSlots.find((slot) => slot._id === selectedSlotId);
                    if (slot) {
                        selectedDay = day;
                        selectedTimeSlot = slot;
                    }
                });

                if (selectedDay && selectedTimeSlot) {
                    const data = {
                        doctorId,
                        patientId: localStorage.getItem("userId"),
                        dateRange: {
                            startDate,
                            endDate,
                        },
                        day: selectedDay,
                        timeSlot: {
                            id: selectedTimeSlot._id,
                            startTime: selectedTimeSlot.startTime,
                            endTime: selectedTimeSlot.endTime,
                        },
                    };

                    try {
                        const response = await axios.post("/api/bookAppointment", data);

                        if (response.status === 201) {
                            toast.success("Appointment booked successfully!");

                            setTimeout(() => {
                                router.push("/dashboard/ourteams");
                            }, 1000);
                        } else {
                            toast.error("Failed to book appointment. Please try again.");
                        }
                    } catch (error) {
                        toast.error("Failed to book appointment. Please try again.");
                    }
                } else {
                    toast.error("Failed to book appointment. Please try again.");
                }
            } else {
                toast.error("Failed to book appointment. Please try again.");
            }
        } else {
            toast.error("Please select a time slot to book an appointment.");
        }
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${poppins.className}`}>
            <div className="w-full bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Image src="/logo.png" alt="Breast Cancer Detection Logo" width={50} height={50} className="w-auto h-auto" />
                        </div>

                        <nav className="flex-1">
                            <ul className="flex items-center justify-end space-x-6">
                                <li>
                                    <Link href="/dashboard" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/services" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Services
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard/ourteams" className="text-pink-600 hover:text-pink-600 font-medium">
                                        Our Team
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-gray-600 hover:text-pink-600 font-medium">
                                        Patient Resources
                                    </Link>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-600 hover:text-pink-600 relative">
                                        <div className="relative">
                                            <BiMessageRounded className="h-6 w-6" />
                                            {messageCount > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                    {messageCount}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-600 hover:text-pink-600 relative">
                                        <FaRegBell className="h-6 w-6" aria-label="Notifications" />
                                        {notificationCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </a>
                                </li>
                                <li className="relative">
                                    <button
                                        className="text-gray-600 hover:text-pink-600 focus:outline-none p-2 rounded-full hover:bg-gray-100"
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    >
                                        <FaRegUser className="h-6 w-6" aria-label="Profile" />
                                    </button>

                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                            <button onClick={() => router.push("/profile")} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                <FaRegUser className="h-4 w-4 mr-3" />
                                                View Profile
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
                                        href="#"
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

            {/* Doctor Details Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-500">
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">Doctor Information</h2>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-6 mb-6">
                        <img src={doctor?.image} alt="Doctor Image" className="w-32 h-32 object-cover rounded-full" />
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{doctor?.name}</h3>
                            <p className="text-gray-600">{doctor?.specialization}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <p>
                            <strong>Email:</strong> {doctor?.email}
                        </p>
                        <p>
                            <strong>Phone:</strong> {doctor?.phone}
                        </p>
                        <p>
                            <strong>Operating Hours:</strong> {doctor?.operatingHours}
                        </p>
                        <p>
                            <strong>Bio:</strong> {doctor?.bio}
                        </p>
                    </div>
                </div>
            </div>

            {/* Appointment Details Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-500">
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">Appointments</h2>
                {appointments?.length === 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                        <h3 className="px-4 py-2 text-left text-gray-600">No appointments available</h3>
                    </div>
                )}
                {appointments?.length !== 0 &&
                    appointments?.map((appointment: any) => (
                        <div key={appointment._id} className="bg-white p-6 rounded-lg shadow-lg mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Date Range</h3>
                            <p>
                                {new Date(appointment.dateRange.startDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}{" "}
                                -{" "}
                                {new Date(appointment.dateRange.endDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                            <div className="mt-6">
                                <h4 className="text-lg font-medium text-gray-800 mb-4">Weekly Schedule</h4>
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-gray-600">Day</th>
                                            <th className="px-4 py-2 text-left text-gray-600">Time Slots</th>
                                            <th className="px-4 py-2 text-left text-gray-600">Select</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(appointment.weeklySchedule).map((day) => {
                                            const schedule = appointment.weeklySchedule[day];
                                            return schedule.isAvailable && schedule.timeSlots.length > 0 ? (
                                                <tr key={schedule._id}>
                                                    <td className="px-4 py-2">{day}</td>
                                                    <td className="px-4 py-2">
                                                        {schedule.timeSlots.map((slot: any) => (
                                                            <div key={slot._id}>
                                                                {slot.startTime} - {slot.endTime}
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {schedule.timeSlots.map((slot: any) => (
                                                            <div key={slot._id}>
                                                                <input
                                                                    type="checkbox"
                                                                    value={slot._id}
                                                                    name={day}
                                                                    checked={selectedSlots[doctor ? doctor._id : window.location.pathname.split("/")[2]] === slot._id} // Check if this slot is already selected
                                                                    onChange={(e) => {
                                                                        const slotId = e.target.value;

                                                                        if (e.target.checked) {
                                                                            setSelectedSlots((prev) => ({
                                                                                ...prev,
                                                                                [doctor ? doctor._id : window.location.pathname.split("/")[2]]: slotId,
                                                                            }));
                                                                        } else {
                                                                            setSelectedSlots((prev) => {
                                                                                const updatedSlots = { ...prev };
                                                                                delete updatedSlots[doctor ? doctor._id : window.location.pathname.split("/")[2]];
                                                                                return updatedSlots;
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ) : null;
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Submit Button */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
                <button
                    onClick={handleSubmit}
                    className="px-6 py-3 text-white bg-pink-600 rounded-full hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                    Submit Appointment
                </button>
            </div>
        </div>
    );
}

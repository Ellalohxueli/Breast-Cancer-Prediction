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
import { start } from "repl";

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
    excludedDates: {
        startDate: string;
        endDate: string;
        type: string;
    }[];
    dateRange: {
        startDate: string;
        endDate: string;
    };
    weeklySchedule: WeeklySchedule;
}

interface BookedAppointment {
    _id: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    day: string;
    timeSlot: {
        startTime: string;
        endTime: string;
    };
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
    const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<{ [key: string]: string }>({});
    const [error, setError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedDateDay, setSelectedDateDay] = useState<string>("");
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

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
                setBookedAppointments(data.bookedAppointments);
                setFilteredAppointments(data.appointments);

                console.log("APP DATA", data.appointments);
                console.log("BOOKED APPOINTMENTS", data.bookedAppointments);
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
                            startDate: selectedDate,
                            endDate: selectedDate,
                        },
                        day: selectedDay,
                        timeSlot: {
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

    useEffect(() => {
        const handleDateChange = async (date: string) => {
            // Convert the selected date string into a Date object.
            const selectedDateObj = new Date(date);
            // Get the day in short format (e.g., "MON", "TUE") and convert to uppercase.
            const selectedDateDay = selectedDateObj.toLocaleString("en-US", { weekday: "short" }).toUpperCase();

            // Save the selected day in state (useful for UI or further logic).
            setSelectedDateDay(selectedDateDay);

            // If there are no appointments, exit early.
            if (!appointments) return;

            // Filter appointments based on the following:
            // 1. The selected date must fall within the appointment's date range.
            // 2. The selected date should not be an excluded date.
            // 3. The appointment must be available for the selected day.
            const validAppointments = appointments.filter((appointment) => {
                const startDate = new Date(appointment.dateRange.startDate);
                const endDate = new Date(appointment.dateRange.endDate);

                // Check for any excluded dates.
                const excludeDates = appointment.excludedDates || [];
                const isExcluded = excludeDates.some((exclude) => {
                    const excludeStart = new Date(exclude.startDate);
                    const excludeEnd = exclude.endDate ? new Date(exclude.endDate) : excludeStart;

                    if (exclude.type === "single") {
                        return selectedDateObj.toDateString() === excludeStart.toDateString();
                    } else if (exclude.type === "range") {
                        return selectedDateObj >= excludeStart && selectedDateObj <= excludeEnd;
                    }
                    return false;
                });

                // Get the schedule for the selected day (e.g., "MON") from weeklySchedule.
                const scheduleForSelectedDay = appointment.weeklySchedule[selectedDateDay];
                const isAvailableForSelectedDay = scheduleForSelectedDay && scheduleForSelectedDay.isAvailable;

                return selectedDateObj >= startDate && selectedDateObj <= endDate && !isExcluded && isAvailableForSelectedDay;
            });

            // For each valid appointment, update the weeklySchedule so that only the selected day is kept.
            // Then filter out the time slots that are booked for that day if the selected date equals booked appointment's dateRange.startDate.
            const updatedAppointments = validAppointments.map((appointment) => {
                // Get the schedule for the selected day.
                const scheduleForSelectedDay = appointment.weeklySchedule[selectedDateDay];

                // Filter out any time slot that is already booked on the selected date.
                const filteredTimeSlots = scheduleForSelectedDay.timeSlots.filter((slot: any) => {
                    // Check if any booked appointment exists for this time slot on the selected date.
                    const isBooked = bookedAppointments.some((booked) => {
                        const bookedDate = new Date(booked.dateRange.startDate);
                        // Compare the booked date with the selected date.
                        const isSameDate = bookedDate.toDateString() === selectedDateObj.toDateString();
                        // Check if the booked appointment is for the same day (e.g., "MON").
                        const isSameDay = booked.day === selectedDateDay;
                        // Verify that the time slot matches.
                        const isSameTimeSlot = booked.timeSlot.startTime === slot.startTime && booked.timeSlot.endTime === slot.endTime;
                        return isSameDate && isSameDay && isSameTimeSlot;
                    });
                    // Only keep the slot if it is not booked.
                    return !isBooked;
                });

                // Return a new appointment object with an updated weeklySchedule
                // that only contains the selected day's schedule and its filtered time slots.
                return {
                    ...appointment,
                    weeklySchedule: {
                        [selectedDateDay]: {
                            ...scheduleForSelectedDay,
                            timeSlots: filteredTimeSlots,
                        },
                    },
                };
            });

            console.log("Filtered & Updated Appointments:", updatedAppointments);
            setFilteredAppointments(updatedAppointments);
        };

        handleDateChange(selectedDate);
    }, [selectedDate, appointments, bookedAppointments]);

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
                {/* Calendar to select a date */}
                <div className="mb-6">
                    <label htmlFor="appointment-date" className="block text-lg font-medium text-gray-800 mb-2">
                        Select a Date
                    </label>
                    <input
                        type="date"
                        id="appointment-date"
                        className="border border-gray-300 rounded-md p-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>

                {filteredAppointments?.length === 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                        <h3 className="px-4 py-2 text-left text-gray-600">No appointments available</h3>
                    </div>
                )}

                {selectedDate != "" &&
                    filteredAppointments?.length !== 0 &&
                    filteredAppointments?.map((appointment: any) => (
                        <div key={appointment._id} className="bg-white p-6 rounded-lg shadow-lg mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Date</h3>
                            <p>
                                {new Date(selectedDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}{" "}
                                {selectedDateDay}
                            </p>
                            <div className="mt-6">
                                <h4 className="text-lg font-medium text-gray-800 mb-4">Weekly Schedule</h4>
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr>
                                            {/* <th className="px-4 py-2 text-left text-gray-600">Day</th> */}
                                            <th className="px-4 py-2 text-center text-gray-600">Time Slots</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(appointment.weeklySchedule).map((day) => {
                                            const schedule = appointment.weeklySchedule[day];
                                            return schedule.isAvailable && schedule.timeSlots.length > 0 ? (
                                                <tr key={schedule._id}>
                                                    {/* <td className="px-4 py-2">{day}</td> */}
                                                    <td className="px-4 py-2 ">
                                                        {schedule.timeSlots.map((slot: any) => (
                                                            <div
                                                                key={slot._id}
                                                                className={`inline-block lg:w-1/6 md:w-1/4 sm:1/3 p-1 m-1 border rounded-md text-center cursor-pointer ${
                                                                    selectedSlots[doctor ? doctor._id : window.location.pathname.split("/")[2]] === slot._id
                                                                        ? "bg-pink-600 text-white"
                                                                        : ""
                                                                }`}
                                                                onClick={() => {
                                                                    const slotId = slot._id;
                                                                    const isSelected = selectedSlots[doctor ? doctor._id : window.location.pathname.split("/")[2]] === slotId;
                                                                    if (!isSelected) {
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
                                                            >
                                                                {slot.startTime} - {slot.endTime}
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
            {selectedDate != "" && filteredAppointments?.length !== 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 text-white bg-pink-600 rounded-full hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                        Submit Appointment
                    </button>
                </div>
            )}
        </div>
    );
}

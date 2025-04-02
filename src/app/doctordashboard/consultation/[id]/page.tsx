'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiUpload, FiFileText, FiPlus } from 'react-icons/fi';
import { Poppins } from 'next/font/google';
import axios from 'axios';

const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
});

interface ConsultationData {
    mammogram: {
        image: string | null;
        uploadDate: string | null;
    };
    report: {
        description: string;
        medications: string[];
    };
}

export default function ConsultationPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [doctorName, setDoctorName] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [consultationData, setConsultationData] = useState<ConsultationData>({
        mammogram: {
            image: null,
            uploadDate: null
        },
        report: {
            description: '',
            medications: []
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appointmentStartTime, setAppointmentStartTime] = useState<string | null>(null);
    const [appointmentStartDate, setAppointmentStartDate] = useState<string | null>(null);
    const [appointmentDay, setAppointmentDay] = useState<string | null>(null);

    useEffect(() => {
        const storedName = localStorage.getItem('name');
        if (storedName) {
            setDoctorName(storedName);
            // Fetch doctor ID by name
            fetchDoctorIdByName(storedName);
        }

        // Fetch appointment details
        const fetchAppointmentDetails = async () => {
            try {
                const response = await fetch(`/api/doctors/appointment/${patientId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch appointment details');
                }
                const data = await response.json();
                if (data.success && data.appointment) {
                    setAppointmentStartTime(data.appointment.timeSlot.startTime);
                    setAppointmentStartDate(data.appointment.dateRange.startDate);
                    setAppointmentDay(data.appointment.day);
                }
            } catch (error) {
                console.error('Error fetching appointment details:', error);
                setError('Failed to fetch appointment details');
            }
        };

        fetchAppointmentDetails();
    }, [patientId]);

    const fetchDoctorIdByName = async (name: string) => {
        try {
            const response = await axios.get('/api/doctors/by-name', {
                params: { name }
            });
            
            if (response.data && response.data.doctorId) {
                setDoctorId(response.data.doctorId);
                console.log('Doctor ID fetched:', response.data.doctorId);
            }
        } catch (error) {
            console.error('Error fetching doctor ID:', error);
        }
    };

    const handleMammogramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Here you would typically upload the file to your server
            // For now, we'll just create a local URL
            const imageUrl = URL.createObjectURL(file);
            setConsultationData(prev => ({
                ...prev,
                mammogram: {
                    image: imageUrl,
                    uploadDate: new Date().toISOString()
                }
            }));
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConsultationData(prev => ({
            ...prev,
            report: {
                ...prev.report,
                description: e.target.value
            }
        }));
    };

    const handleAddMedication = () => {
        setConsultationData(prev => ({
            ...prev,
            report: {
                ...prev.report,
                medications: [...prev.report.medications, '']
            }
        }));
    };

    const handleMedicationChange = (index: number, value: string) => {
        setConsultationData(prev => ({
            ...prev,
            report: {
                ...prev.report,
                medications: prev.report.medications.map((med, i) => 
                    i === index ? value : med
                )
            }
        }));
    };

    const handleRemoveMedication = (index: number) => {
        setConsultationData(prev => ({
            ...prev,
            report: {
                ...prev.report,
                medications: prev.report.medications.filter((_, i) => i !== index)
            }
        }));
    };

    const handleDone = async () => {
        if (!consultationData.report.description.trim()) {
            setError('Please fill in the description before proceeding');
            return;
        }
        
        if (!doctorId) {
            setError('Doctor ID is missing. Please try again.');
            return;
        }
        
        if (!patientId) {
            setError('Patient ID is missing. Please try again.');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Calculate Malaysia time (UTC+8)
            const malaysiaOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
            const malaysiaTime = new Date(Date.now() + malaysiaOffset);
            
            // Prepare the data to be saved
            const dataToSave = {
                patientId: patientId,
                appointments: [{
                    doctorId: doctorId,
                    appointmentId: patientId,
                    dateRange: {
                        startDate: appointmentStartDate || new Date().toISOString(),
                        day: appointmentDay || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                        timeSlot: {
                            startTime: appointmentStartTime || new Date().toLocaleTimeString()
                        }
                    },
                    appointmentType: "consultation"
                }],
                mammograms: consultationData.mammogram.image ? [{
                    image: consultationData.mammogram.image,
                    predictionResult: "pending"
                }] : [],
                description: consultationData.report.description,
                medications: consultationData.report.medications.filter(med => med.trim() !== ''),
                createdAt: malaysiaTime.toISOString(),
                updatedAt: malaysiaTime.toISOString()
            };

            // Log the data being saved
            console.log('Data being saved to database:', JSON.stringify(dataToSave, null, 2));
            console.log('Doctor ID being used:', doctorId);
            console.log('Patient ID being used:', patientId);
            console.log('Malaysia time being used:', malaysiaTime.toISOString());

            // Save the consultation data to the patient report database
            const response = await fetch('/api/patient-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server response error:', errorData);
                throw new Error(`Failed to save consultation: ${response.status} ${response.statusText}`);
            }

            // Log successful save
            console.log('Successfully saved to database');

            // Update the appointment status to "Completed"
            try {
                const completeResponse = await fetch('/api/doctors/appointment/complete', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        appointmentId: patientId,
                        updatedAt: malaysiaTime.toISOString()
                    })
                });

                if (!completeResponse.ok) {
                    console.error('Failed to update appointment status to Completed');
                } else {
                    console.log('Successfully updated appointment status to Completed');
                }
            } catch (completeError) {
                console.error('Error updating appointment status:', completeError);
                // Continue with navigation even if status update fails
            }

            router.push('/doctordashboard');
        } catch (err) {
            console.error('Error saving to database:', err);
            setError(`Failed to save consultation: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} ${poppins.className}`}>
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        New Consultation
                    </h1>
                    <button
                        onClick={() => router.push('/doctordashboard')}
                        className={`px-4 py-2 rounded-lg ${
                            isDarkMode 
                                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                : 'bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Back
                    </button>
                </div>

                {/* Mammogram Section */}
                <div className={`rounded-xl shadow-sm p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Mammogram
                    </h2>
                    <div className="space-y-4">
                        {consultationData.mammogram.image ? (
                            <div className="relative">
                                <img
                                    src={consultationData.mammogram.image}
                                    alt="Mammogram"
                                    className="w-full h-64 object-contain rounded-lg"
                                />
                                <button
                                    onClick={() => setConsultationData(prev => ({
                                        ...prev,
                                        mammogram: { image: null, uploadDate: null }
                                    }))}
                                    className={`absolute top-2 right-2 p-2 rounded-full ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                            : 'bg-white text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
                                isDarkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}>
                                <FiUpload className={`w-12 h-12 mx-auto mb-4 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    No mammogram uploaded yet
                                </p>
                                <label className={`inline-block px-4 py-2 rounded-lg cursor-pointer ${
                                    isDarkMode 
                                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                        : 'bg-pink-600 text-white hover:bg-pink-700'
                                }`}>
                                    Upload Mammogram
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleMammogramUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Report Section */}
                <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Report
                    </h2>
                    <div className="space-y-6">
                        {/* Description */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Description
                            </label>
                            <textarea
                                value={consultationData.report.description}
                                onChange={handleDescriptionChange}
                                rows={4}
                                className={`w-full rounded-lg p-3 ${
                                    isDarkMode 
                                        ? 'bg-gray-700 text-white border-gray-600' 
                                        : 'bg-white text-gray-900 border-gray-300'
                                } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                                placeholder="Enter consultation description..."
                            />
                        </div>

                        {/* Medications */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className={`block text-sm font-medium ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Medications
                                </label>
                                <button
                                    onClick={handleAddMedication}
                                    className={`flex items-center px-3 py-1 rounded-lg text-sm ${
                                        isDarkMode 
                                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                            : 'bg-pink-600 text-white hover:bg-pink-700'
                                    }`}
                                >
                                    <FiPlus className="w-4 h-4 mr-2" />
                                    Add Medication
                                </button>
                            </div>
                            <div className="space-y-2">
                                {consultationData.report.medications.map((medication, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={medication}
                                            onChange={(e) => handleMedicationChange(index, e.target.value)}
                                            className={`flex-1 rounded-lg p-2 ${
                                                isDarkMode 
                                                    ? 'bg-gray-700 text-white border-gray-600' 
                                                    : 'bg-white text-gray-900 border-gray-300'
                                            } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                                            placeholder="Enter medication..."
                                        />
                                        <button
                                            onClick={() => handleRemoveMedication(index)}
                                            className={`p-2 rounded-lg ${
                                                isDarkMode 
                                                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                            }`}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Done Button */}
            <div className="flex justify-center mt-8 mb-6">
                {error && (
                    <div className="text-red-500 mb-4 text-center">
                        {error}
                    </div>
                )}
                <button
                    onClick={handleDone}
                    disabled={isSubmitting || !consultationData.report.description.trim()}
                    className={`px-8 py-3 rounded-lg text-lg font-medium ${
                        isSubmitting || !consultationData.report.description.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isDarkMode 
                                ? 'bg-pink-600 text-white hover:bg-pink-700' 
                                : 'bg-pink-600 text-white hover:bg-pink-700'
                    }`}
                >
                    {isSubmitting ? 'Saving...' : 'Done'}
                </button>
            </div>
        </div>
    );
} 
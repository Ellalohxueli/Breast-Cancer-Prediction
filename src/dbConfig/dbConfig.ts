import mongoose from 'mongoose';

export async function connectToMongoDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(uri);
        console.log('Connected to MongoDB successfully');
        return mongoose.connection;
    } catch (error) {
        console.error('MongoDB connection error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            details: error
        });
        throw new Error('Failed to connect to database. Please check server logs.');
    }
}
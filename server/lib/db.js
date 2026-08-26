import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        
        if (!uri) {
            throw new Error('MONGODB_URI is not defined');
        }

        console.log('📡 Connecting to MongoDB...');
        console.log(`📊 URI: ${uri.replace(/\/\/.*@/, '//****:****@')}`);
        
        // ✅ Connect with timeout options
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,  // Increase timeout to 30 seconds
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
        });

        console.log('✅ Database Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        return true;
    } catch (error) {
        console.error('❌ Database Connection Failed:');
        console.error(`   Error: ${error.message}`);
        process.exit(1);
    }
};

// Handle application termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
    process.exit(0);
});
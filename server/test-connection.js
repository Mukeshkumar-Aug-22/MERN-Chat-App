import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

console.log('📡 Testing MongoDB connection...');
console.log(`🔗 URI: ${uri.replace(/\/\/.*@/, '//****:****@')}`);

try {
    // ✅ No options - Mongoose 9 works with just the URI
    await mongoose.connect(`${uri}/chat-app`);
    
    console.log('✅ Connection successful!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
    await mongoose.disconnect();
    console.log('✅ Test completed!');
    
} catch (error) {
    console.error('❌ Connection failed:', error.message);
}
import mongoose from 'mongoose';

const connectionDB = async () => {
    await mongoose.connect(process.env.URI)
        .then(() => {
        console.log('MongoDB connected...');
        })
    .catch((err) => {
        console.error(`MongoDB connection error: ${err.message}`);
    
    });
}

export default connectionDB;
import mongoose from 'mongoose';

async function run() {
    await mongoose.connect('mongodb://localhost:27017/linkaroo');
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema);
    const user = await User.findOne({ email: 'monparadhvanit@gmail.com' });
    console.log("User:", user);
    process.exit(0);
}

run();

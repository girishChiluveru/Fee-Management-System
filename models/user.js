const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    class: String,
    dept: String,
    rollno: String,
    fee: Number,
    image: String,
    password: String
    // ...existing code...
});

module.exports = mongoose.model('User', userSchema);

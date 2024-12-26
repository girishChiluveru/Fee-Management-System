const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

mongoose.connect('mongodb://localhost:27017/feeManagement', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    password: String,
    name: String,
    class: String,
    dept: String,
    rollno: String,
    fee: Number,
    image: String // Add image field
});

const User = mongoose.model('User', userSchema);

const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});

const Admin = mongoose.model('Admin', adminSchema);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Middleware to check JWT token
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = user;
        next();
    });
}

app.use((req, res, next) => {
    res.locals.token = req.cookies.token;
    next();
});

// Route to render the navigation bar
app.get("/navbar", (req, res) => {
    res.render('navbar');
});

app.get("/", (req, res) => {
    const token = req.cookies.token;
    res.render('index', { token });
});

app.get("/users", authenticateToken, async (req, res) => {
    const users = await User.find();
    res.render('users', { users });
});

app.get("/register", authenticateToken, (req, res) => {
    res.render('register');
});

app.post("/users", upload.single('image'), async (req, res) => {
    const { password, name, class: userClass, dept, rollno, fee } = req.body;
    const image = req.file ? req.file.filename : '';
    
    // Check if roll number already exists
    const existingUser = await User.findOne({ rollno });
    if (existingUser) {
        return res.render('register', { error: 'Roll number already exists' });
    }

    console.log('Registering user with password:', password); // Debugging line

    const newUser = new User({ password, name, class: userClass, dept, rollno, fee, image });
    await newUser.save();
    console.log('User registered:', newUser); // Debugging line
    res.redirect('/users');
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt with username:', username, 'and password:', password); // Debugging line
    try {
        const admin = await Admin.findOne({ username, password });
        if (admin) {
            console.log('Admin found:', admin); // Debugging line
            const token = jwt.sign({ adminId: admin._id }, 'your_jwt_secret', { expiresIn: '1h' });
            console.log('Generated token:', token); // Debugging line
            res.cookie('token', token, { httpOnly: true });
            res.redirect('/users'); // Redirect to users page
        } else {
            console.log('Admin not found'); // Debugging line
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during login:', error); // Debugging line
        res.redirect('/login');
    }
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/logout", (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

app.listen(5000, () => {
    console.log('listening on : 5000');
});
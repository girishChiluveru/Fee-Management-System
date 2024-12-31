const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const dotenv = require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

mongoose.connect("mongodb://localhost:27017/feeManagement", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB successfully"))
.catch((err) => console.error("Error connecting to MongoDB:", err.message));

const userSchema = new mongoose.Schema({
  password: String,
  name: String,
  class: String,
  dept: String,
  rollno: String,
  fee: Number,
  image: String,
});

const User = mongoose.model("User", userSchema);

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Admin = mongoose.model("Admin", adminSchema);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Middleware to check JWT token
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) {
      return res.redirect("/login");
    }
    req.user = user;
    next();
  });
}

app.use((req, res, next) => {
  res.locals.token = req.cookies.token;
  next();
});

app.get("/", (req, res) => {
  const token = req.cookies.token;
  res.render("index", { token });
});

app.get("/users", authenticateToken, async (req, res) => {
  const users = await User.find();
  res.render("users", { users });
});

app.get("/register", authenticateToken, (req, res) => {
  res.render("register");
});

app.post("/users", upload.single("image"), async (req, res) => {
  const { password, name, class: userClass, dept, rollno, fee } = req.body;
  const image = req.file ? req.file.filename : "";

  const existingUser = await User.findOne({ rollno });
  if (existingUser) {
    return res.render("register", { error: "Roll number already exists" });
  }

  const newUser = new User({
    password,
    name,
    class: userClass,
    dept,
    rollno,
    fee,
    image,
  });
  await newUser.save();
  res.redirect("/users");
});

app.get("/users/edit/:id", authenticateToken, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).send("User not found");
  }
  res.render("editUser", { user });
});

app.post(
  "/users/edit/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { fee } = req.body;
      await User.findByIdAndUpdate(req.params.id, { fee });
      res.json({ success: true, message: "User fee updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to update user fee" });
    }
  }
);

app.post("/users/delete/:id", authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username, password });
    if (admin) {
      const token = jwt.sign({ adminId: admin._id }, "your_jwt_secret", {
        expiresIn: "1h",
      });
      res.cookie("token", token, { httpOnly: true });
      res.redirect("/users");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// Middleware to handle 404 errors
app.use((req, res, next) => {
  res
    .status(404)
    .render("404", { message: "Sorry, we could not find that resource!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500", { message: "Something went wrong!" });
});

app.listen(5000, () => {
  console.log("listening on : 5000");
});

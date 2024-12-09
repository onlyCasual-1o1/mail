require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');

// Create an Express application
const app = express();
const port = 3000;

// Configure MySQL connection
const db = mysql.createConnection({
    host: 'srv1415.hstgr.io',
    user: 'u227551606_docadmin',
    password: 'Doccaresservices123',
    database: 'u227551606_doc_caresroom'
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',  // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set `secure: true` if you're using HTTPS
}));

// Store OTP temporarily in memory (for demonstration purposes)
let currentOtp = null;
let otpExpiration = null;
let userEmail = null;  // Store email temporarily

// Generate OTP
function generateOtp() {
    return crypto.randomBytes(3).toString('hex'); // Generates a 6-digit OTP
}

// Configure Nodemailer to use Gmail's SMTP service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Use Gmail address from .env file
        pass: process.env.EMAIL_PASS   // Use App Password from .env file
    },
    tls: {
        rejectUnauthorized: false  // Disable SSL certificate validation
    }
});

// Function to send OTP to the user's email
function sendOtpEmail(toEmail, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USER,  // From address should be your Gmail address
        to: toEmail,                  // To address will be the user's email
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    };

    // Send email using Nodemailer
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error occurred:', error);  // Log any error that occurs
        } else {
            console.log('Email sent:', info.response);  // Log the email sent confirmation
        }
    });
}

// Route to serve the OTP form (signup.html)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/signup.html');  // Serve the signup.html page
});

// Route to handle sending OTP to the email
app.post('/send-otp', (req, res) => {
    userEmail = req.body.email;  // Save the email address temporarily
    currentOtp = generateOtp();  // Generate a new OTP
    otpExpiration = Date.now() + 300000;  // OTP expires in 5 minutes

    // Send OTP email to the user
    sendOtpEmail(userEmail, currentOtp);

    // After sending OTP, redirect to the verification page
    res.redirect('/verify');
});

// Route to serve the OTP verification form (verify.html)
app.get('/verify', (req, res) => {
    res.sendFile(__dirname + '/verify.html');  // Serve the verify.html page
});

// Route to verify the OTP entered by the user
app.post('/verify-otp', (req, res) => {
    const enteredOtp = req.body.otp;

    // Check if OTP has expired
    if (Date.now() > otpExpiration) {
        return res.send('<h2>Your OTP has expired. Please request a new one.</h2>');
    }

    // Check if the entered OTP is correct
    if (enteredOtp === currentOtp) {
        // Store the email in the session after successful OTP verification
        req.session.userEmail = userEmail;

        // Redirect to the fillup.php page without email in the URL
        res.redirect('https://cs-devops.com/DocCares/fillup.php');
    } else {
        res.sendFile(__dirname + '/reverify.html');
    }
});

// Endpoint to get the email from the session
app.get('/get-email', (req, res) => {
    // Check if the email exists in the session
    if (req.session.userEmail) {
        // Send the email in the response
        res.json({ email: req.session.userEmail });
    } else {
        // If no email found, return an empty response or an error
        res.json({ email: null });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Keep-alive ping for Render deployment

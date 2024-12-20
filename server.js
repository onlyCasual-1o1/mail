require('dotenv').config();  // Load environment variables from .env file
const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');

function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

const encrypt = generateRandomCode(10);

// Set up session middleware
const app = express();
const port = 3000;
app.use(session({
    secret: 'encrypt',  // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set `secure: true` if you're using HTTPS
}));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Store OTP temporarily in memory (for demonstration purposes)
let currentOtp = null;
let otpExpiration = null;
let userEmail = null; // Store email temporarily

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
        text: `Your OTP code is: ${otp}. Never share your OTP.`
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

// Route to serve the OTP form (index.html)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/signup.html');  // Serve the index.html page
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

    if (Date.now() > otpExpiration) {
        return res.send('<h2>Your OTP has expired. Please request a new one.</h2>');
    }

    if (enteredOtp === currentOtp) {
        // Encrypt (Base64 encode) the email
        const encodedEmail = Buffer.from(userEmail).toString('base64');
        
        // Store the email in the session after successful OTP verification
        req.session.userEmail = userEmail;

        // Redirect to the fillup.php page with encoded email in the URL
        res.redirect(`https://cs-devops.com/DocCares/fillup.php?email=${encodedEmail}`);
    } else {
        res.sendFile(__dirname + '/reverify.html');
    }
});

// Route to get the email stored in the session
app.get('/get-email', (req, res) => {
    const userEmail = req.session.userEmail;
    if (userEmail) {
        res.json({ email: userEmail }); // Return email as JSON
    } else {
        res.json({ email: null });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Keep-alive ping for Render deployment
setInterval(() => {
    axios.get(`https://your-app-name.onrender.com`)  // Use the Render URL for your app
        .then(response => {
            console.log("Keep-alive ping successful!");
        })
        .catch(error => {
            console.log("Error during keep-alive ping:", error);
        });
}, 300000); // Every 5 minutes



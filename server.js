require('dotenv').config();  // Load environment variables from .env file
const mysql = require('mysql');

// Configure MySQL connection
const db = mysql.createConnection({
    host: 'srv1415.hstgr.io' ,
    user: 'u227551606_docadmin',
    password: 'Doccaresservices123',
    database: '227551606_doc_caresroom'
});

const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');

// Create an Express application
const app = express();
const port = 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

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

    // Check if OTP has expired
    if (Date.now() > otpExpiration) {
        return res.send('<h2>Your OTP has expired. Please request a new one.</h2>');
    }

    // Check if the entered OTP is correct
    if (enteredOtp === currentOtp) {
        // Insert email into the database
        const sql = 'INSERT INTO patient_info (Email) VALUES (?)';
        db.query(sql, [userEmail], (err, result) => {
            if (err) {
                return res.send('<h2>There was an error saving your email. Please try again.</h2>');
            }
            res.redirect('https://cs-devops.com/DocCares/welcome.html');
        });
    } else {
        res.sendFile(__dirname + '/reverify.html');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

setInterval(() => {
    axios.get(`http://localhost:${port}`)
        .then(response => {
            console.log("Keep-alive ping successful!");
        })
        .catch(error => {
            console.log("Error during keep-alive ping:", error);
        });
}, 300000);

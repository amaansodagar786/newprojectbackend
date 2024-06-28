const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
    }
});

const upload = multer({ storage });

mongoose
    .connect(
        "mongodb+srv://sodagaramaan786:HbiVzsmAJNAm4kg4@cluster0.576stzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Schema for HR Contact Data
const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    service: { type: String, required: true },
    message: { type: String, required: true },
  });
  
  const User = mongoose.model("HRContactData", ContactSchema);

// Schema for Career Application
const ApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    position: { type: String, required: true },
    message: { type: String },
    resume: { type: String, required: true }
});

const Application = mongoose.model("CareerApplication", ApplicationSchema);

// Routes
app.post("/contact", async (req, res) => {
    const { name, email, mobile, service, message } = req.body;
    console.log(name + email + mobile + service + message )
  
    try {
      const result = await User.create({ name, email, mobile, service, message });
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to HR web',
        html: `
          <p>Hello ${name}</p>
          <p>Thank you for contacting us</p>
          <p>Best regards,</p>
          <p>Team NAOH</p>
        `,
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
  
      res.json({ success: true, message: 'Added to contact list' });
    } catch (error) {
      console.error('Error adding to contact list:', error);
      res.status(500).json({ success: false, error: 'Failed to add to contact list' });
    }
  });

app.post("/career", upload.single('resume'), async (req, res) => {
    const { name, phone, email, position, message } = req.body;
    const resume = req.file.filename;

    try {
        const result = await Application.create({ name, phone, email, position, message, resume });

        // Sending email confirmation
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Application Received',
            html: `
                <p>Hello ${name},</p>
                <p>Thank you for applying for the ${position} position. We have received your application and will get back to you soon.</p>
                <p>Best regards,<br>Team NAOH</p>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);

        res.json({ success: true, message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit application' });
    }
});

// GET endpoint to fetch all applicants
app.get('/applicants', async (req, res) => {
    try {
        const applicants = await Application.find({});
        res.json(applicants);
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch applicants' });
    }
});

// GET endpoint to download resume
app.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File not found:', err);
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        // Provide the file for download
        res.download(filePath, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ success: false, error: 'Unable to download file' });
            }
        });
    });
});

app.get('/hello', (req, res) => {
    res.send('Hello World!')
    })

app.listen(3035, () => {
    console.log('Server connected');
});

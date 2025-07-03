const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config(); // Load .env file

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB error:'));
db.once('open', () => console.log('✅ MongoDB connected'));


const contactSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  city: String,
  pincode: String,
});

const Contact = mongoose.model('user-detail', contactSchema);

// Serve your HTML form (if it's static)
app.use(express.static(path.join(__dirname, 'public'))); // Optional if using static HTML

app.get('/test', (req, res) => {
  res.send('Server is working!');
});

app.post('/send-message', async (req, res) => {
  const { name, mobile, email, city, pincode, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or use smtp.mail.yahoo.com for Yahoo
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `📩 New Contact Form Submission from ${name}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #004080;">📬 New Message Received</h2>
        <p style="font-size: 16px;">You have received a new message from your contact form:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr><td style="padding: 8px; font-weight: bold;">👤 Name</td><td style="padding: 8px;">${name}</td></tr>
          <tr style="background-color: #f1f1f1;"><td style="padding: 8px; font-weight: bold;">📱 Mobile</td><td style="padding: 8px;">${mobile}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">📧 Email</td><td style="padding: 8px;">${email}</td></tr>
          <tr style="background-color: #f1f1f1;"><td style="padding: 8px; font-weight: bold;">🏙️ City</td><td style="padding: 8px;">${city}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">📮 Pincode</td><td style="padding: 8px;">${pincode}</td></tr>
        </table>
        <div style="margin-top: 30px;">
          <h3 style="margin-bottom: 10px;">📝 Message</h3>
          <p style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 1px solid #ccc; font-size: 15px;">
            ${message}
          </p>
        </div>
        <p style="font-size: 14px; color: #888; margin-top: 30px; text-align: center;">This message was sent from your website contact form.</p>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.redirect('/pages-files/contact.html?submitted=true');
  } catch (error) {
    console.error('Email sending failed:', error);
    res.redirect('/pages-files/contact.html?submitted=false');
  }


  try {
    const { name, mobile, email, city, pincode } = req.body;

    const newContact = new Contact({ name, mobile, email, city, pincode });
    await newContact.save();

    res.status(200).json({ message: '✅ Contact saved successfully' });
  } catch (error) {
    console.error('❌ Error saving contact:', error);
    res.status(500).json({ error: 'Server error' });
  }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});

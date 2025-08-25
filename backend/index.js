const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

// Allow requests from your frontend domain
app.use(cors({
  origin: 'https://bulkmail-frontend1-five.vercel.app/' // no trailing slash
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

// Define the credential model
const credential = mongoose.model("credential", {}, "bulkmail");

// Health check route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Email sending route
app.post("/sendMail", async (req, res) => {
  const { msg, emailList } = req.body;

  try {
    const data = await credential.find();
    if (!data || data.length === 0) {
      return res.status(500).json({ error: "No credentials found in DB" });
    }

    const { user, pass } = data[0].toJSON();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    for (let email of emailList) {
      await transporter.sendMail({
        from: user,
        to: email,
        subject: "A message from Bulk Mail App",
        text: msg,
      });
      console.log("📧 Email sent to:", email);
    }

    res.send(true);
  } catch (error) {
    console.error("❌ Error sending emails:", error);
    res.send(false);
  }
});

// Export the app for Vercel
module.exports = app;

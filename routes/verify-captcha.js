const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/", async (req, res) => {
  const { captchaToken } = req.body;
  if (!captchaToken) {
    return res.status(400).json({ message: "Captcha token is missing" });
  }

  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY, // Use your actual secret key
          response: captchaToken,
        },
      }
    );

    if (response.data.success) {
      return res.json({ success: true, message: "Captcha verified" });
    } else {
      return res.status(400).json({ success: false, message: "Captcha verification failed" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Captcha verification error", error });
  }
});

module.exports = router;

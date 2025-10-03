import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import twilio from 'twilio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

// Check if API keys are loaded
if (!process.env.BREVO_API_KEY) {
  console.error('❌ ERROR: BREVO_API_KEY not found in .env file!');
}
if (!process.env.TWILIO_ACCOUNT_SID) {
  console.error('❌ ERROR: TWILIO_ACCOUNT_SID not found in .env file!');
}

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    brevoConfigured: !!process.env.BREVO_API_KEY,
    twilioConfigured: !!process.env.TWILIO_ACCOUNT_SID
  });
});

// =====================================================
// EMAIL SENDING - BREVO API
// =====================================================
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, name, certificateBase64, eventName } = req.body;

    console.log(`📧 Attempting to send email to: ${to}`);

    if (!process.env.BREVO_API_KEY) {
      throw new Error('Brevo API key not configured');
    }

    if (!to || !name || !certificateBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields (to, name, or certificate)' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error(`❌ Invalid email format: ${to}`);
      return res.status(400).json({ 
        success: false, 
        error: `Invalid email format: ${to}`,
        status: 'bounced'
      });
    }

    const base64Data = certificateBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // ⭐⭐⭐ CHANGE THIS EMAIL TO YOUR VERIFIED EMAIL ⭐⭐⭐
    const SENDER_EMAIL = 'rudragopal.mukkala@gmail.com';  // 👈 CHANGE THIS!
    const SENDER_NAME = 'Certificate Team';                 // 👈 CHANGE THIS (optional)
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: [{ email: to, name: name }],
        subject: `🎉 Your Certificate - ${eventName}`,
        htmlContent: `
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; }
                .content { background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { color: #1e40af; font-size: 28px; margin-bottom: 20px; }
                .message { font-size: 16px; color: #333; line-height: 1.6; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="content">
                  <h2 class="header">Congratulations ${name}! 🎉</h2>
                  <p class="message">
                    Your certificate for <strong>${eventName}</strong> is ready and attached to this email!
                  </p>
                  <p class="message">
                    Thank you for participating. We hope you enjoyed the event!
                  </p>
                  <div class="footer">
                    <p>
                      Best regards,<br>
                      ${SENDER_NAME}
                    </p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
        attachment: [{
          content: base64Data,
          name: `certificate_${name.replace(/\s+/g, '_')}.png`
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Email sent successfully to ${to}`);
      console.log(`   Message ID: ${data.messageId}`);
      res.json({ 
        success: true, 
        messageId: data.messageId,
        status: 'delivered'
      });
    } else {
      console.error(`❌ Brevo error for ${to}:`, data);
      res.status(400).json({ 
        success: false, 
        error: data.message || JSON.stringify(data),
        status: 'bounced'
      });
    }
  } catch (error) {
    console.error('❌ Email error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      status: 'bounced'
    });
  }
});

// =====================================================
// WHATSAPP SENDING - TWILIO API
// =====================================================
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, name, eventName } = req.body;

    console.log(`📱 Original phone number received: ${to}`);

    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error('Twilio credentials not configured');
    }

    if (!to || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields (to or name)' 
      });
    }

    // Clean and format phone number
    let cleanNumber = to.toString().trim();
    
    // Remove all non-digit characters (spaces, dashes, brackets)
    cleanNumber = cleanNumber.replace(/\D/g, '');
    
    // Remove leading zeros
    cleanNumber = cleanNumber.replace(/^0+/, '');
    
    // Remove country code if present
    if (cleanNumber.startsWith('91') && cleanNumber.length > 10) {
      cleanNumber = cleanNumber.substring(2);
    }
    
    // Ensure it's exactly 10 digits
    if (cleanNumber.length !== 10) {
      console.error(`❌ Invalid phone number: ${to} → Cleaned: ${cleanNumber} (${cleanNumber.length} digits)`);
      return res.status(400).json({
        success: false,
        error: `Phone number must be 10 digits. Got ${cleanNumber.length} digits: ${cleanNumber}`,
        status: 'bounced'
      });
    }
    
    // Add country code for India
    const whatsappNumber = `whatsapp:+91${cleanNumber}`;
    
    console.log(`📱 Formatted WhatsApp number: ${whatsappNumber}`);
    console.log(`⚠️  REMINDER: +91${cleanNumber} must join Twilio sandbox first!`);
    console.log(`   Instructions: Send "join <code>" to +1 415 523 8886`);

    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: whatsappNumber,
      body: `🎉 Congratulations ${name}!\n\nYour certificate for "${eventName}" is ready!\n\nPlease check your email for the certificate download.\n\nThank you for participating!`
    });

    console.log(`✅ WhatsApp message queued successfully`);
    console.log(`   To: +91${cleanNumber}`);
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    
    res.json({ 
      success: true, 
      messageSid: message.sid,
      status: 'delivered'
    });

  } catch (error) {
    console.error('❌ WhatsApp error:', error.message);
    console.error('   Error code:', error.code);
    
    let errorMessage = error.message;
    let helpText = '';
    
    if (error.code === 21212) {
      errorMessage = 'Phone number not registered in Twilio sandbox';
      helpText = 'Recipient must send "join <code>" to +1 415 523 8886 via WhatsApp first!';
      console.error(`   💡 Solution: ${helpText}`);
    } else if (error.code === 21211) {
      errorMessage = 'Invalid phone number format';
      helpText = 'Check phone number is 10 digits';
    } else if (error.code === 21408) {
      errorMessage = 'Permission to send to this number has not been enabled';
      helpText = 'Number must join Twilio sandbox first';
    }
    
    res.status(400).json({ 
      success: false, 
      error: errorMessage,
      help: helpText,
      errorCode: error.code,
      status: 'bounced'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Certificate Automation Server`);
  console.log(`=`.repeat(60));
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📧 Brevo Email: ${process.env.BREVO_API_KEY ? '✅ Configured' : '❌ Missing - Add to .env'}`);
  console.log(`📱 Twilio WhatsApp: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing - Add to .env'}`);
  console.log(`=`.repeat(60));
  console.log(`\n💡 Test health check: http://localhost:${PORT}/api/health\n`);
});
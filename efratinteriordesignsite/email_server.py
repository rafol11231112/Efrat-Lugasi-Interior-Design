from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "refaellugasi10@gmail.com"
SENDER_PASSWORD = "xhpy nded imfp ygtc"

# HTML Email Template
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #dc0000 0%, #850000 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
        }
        .content {
            padding: 20px;
            color: #333;
        }
        .verification-code {
            background: #f8f8f8;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            border-radius: 5px;
            border: 2px dashed #dc0000;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #dc0000;
            letter-spacing: 5px;
        }
        .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 12px;
        }
        .social-links {
            margin: 20px 0;
            text-align: center;
        }
        .social-links a {
            color: #dc0000;
            text-decoration: none;
            margin: 0 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #dc0000;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to Your.store</h1>
        </div>
        <div class="content">
            <h2>Hello {fullname}!</h2>
            <p>Thank you for registering with Your.store. To complete your registration, please use the verification code below:</p>
            
            <div class="verification-code">
                <p>Your Verification Code:</p>
                <div class="code">{code}</div>
            </div>
            
            <p>This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
            
            <div class="social-links">
                <p>Join our community:</p>
                <a href="https://t.me/YOURSTORE">Telegram</a> |
                <a href="https://discord.gg/Wj7mVvZnzT">Discord</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2024 Your.store. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return "Email server is running!"

@app.route('/send-verification-email', methods=['POST'])
def send_verification_email():
    try:
        data = request.json
        logger.info(f"Received request: {data}")
        
        recipient_email = data.get('email')
        fullname = data.get('fullname')
        code = data.get('code')
        
        if not all([recipient_email, fullname, code]):
            logger.warning("Missing required fields")
            return jsonify({
                "success": False, 
                "message": "Missing required fields"
            }), 400
        
        # Create email content
        msg = MIMEMultipart('alternative')
        msg['From'] = f"Your Store <{SENDER_EMAIL}>"
        msg['To'] = recipient_email
        msg['Subject'] = "Welcome to Your.store - Verify Your Email"
        
        # Fill template with user data
        html_content = EMAIL_TEMPLATE.format(
            fullname=fullname,
            code=code
        )
        
        msg.attach(MIMEText(html_content, 'html'))
        
        try:
            # Connect to SMTP server
            logger.info(f"Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}")
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                logger.info(f"Logging in as {SENDER_EMAIL}")
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                
                logger.info(f"Sending email to {recipient_email}")
                server.send_message(msg)
                
            logger.info("Email sent successfully!")
            return jsonify({"success": True, "message": "Email sent successfully"})
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Email authentication failed. Check email credentials."
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    try:
        print("\n✨ Email server starting...")
        print("📧 Server URL: http://localhost:8081")
        print("\n⚡ Press Ctrl+C to stop the server\n")
        app.run(host='localhost', port=8081, debug=True)
    except Exception as e:
        print(f"\n❌ Failed to start server: {str(e)}")
        input("\nPress Enter to exit...") 
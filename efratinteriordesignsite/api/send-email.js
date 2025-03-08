const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }

    try {
        const { name, email, service, message } = req.body;

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'refaellugasi10@gmail.com',
                pass: 'xhpy nded imfp ygtc'
            }
        });

        // Create email HTML
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2a2a72; border-bottom: 2px solid #009ffd; padding-bottom: 10px;">
                        New Design Inquiry
                    </h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="color: #2a2a72; margin-bottom: 15px;">Client Details:</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Service:</strong> ${service}</p>
                    </div>
                    <div style="background: #fff; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
                        <h3 style="color: #2a2a72; margin-bottom: 15px;">Message:</h3>
                        <p style="white-space: pre-line;">${message}</p>
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
                        <p>This email was sent from your website's contact form.</p>
                    </div>
                </div>
            </div>
        `;

        // Email options
        const mailOptions = {
            from: 'refaellugasi10@gmail.com',
            to: 'efratlugazy@gmail.com',
            subject: `New Design Inquiry from ${name}`,
            html: html
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Return success response
        res.status(200).json({ status: 'success', message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
} 
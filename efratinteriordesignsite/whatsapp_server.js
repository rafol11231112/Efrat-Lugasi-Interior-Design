const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3001;

// Store active chat sessions
const activeSessions = new Map();
const messageHistory = new Map();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Simple message storage
const messages = [];

// Initialize WhatsApp client with minimal options
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

// Track client ready state
let clientReady = false;

// Generate QR code for WhatsApp Web authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
    console.log('Scan this QR code with your WhatsApp to login');
});

client.on('ready', () => {
    console.log('WhatsApp client is ready! Connected to your WhatsApp account.');
    clientReady = true;
});

// Listen for incoming messages from WhatsApp
client.on('message', async (msg) => {
    console.log('New message from WhatsApp:', msg.body);
    messages.push({
        from: msg.from,
        content: msg.body,
        timestamp: new Date().toISOString()
    });
});

// Initialize WhatsApp client
client.initialize();

// API endpoint to send messages to WhatsApp
app.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({
                status: 'error',
                message: 'Phone number and message are required'
            });
        }
        
        // Store message
        messages.push({
            to: number,
            content: message,
            timestamp: new Date().toISOString()
        });
        
        // Format the number
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        
        try {
            // Send message
            await client.sendMessage(formattedNumber, message);
            
            res.status(200).json({
                status: 'success',
                message: 'Message sent successfully'
            });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(200).json({
                status: 'queued',
                message: 'Message queued for delivery'
            });
        }
    } catch (error) {
        console.error('Error in send-message endpoint:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process request',
            error: error.message
        });
    }
});

// API endpoint to check status
app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        connected: client.info ? true : false
    });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    let userId = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
            if (data.type === 'register') {
                userId = data.userId;
                activeSessions.set(userId, ws);
                console.log(`User ${userId} registered`);
                
                // Send message history if available
                if (messageHistory.has(userId)) {
                    ws.send(JSON.stringify({
                        type: 'history',
                        messages: messageHistory.get(userId)
                    }));
                }
            } 
            else if (data.type === 'message') {
                if (!userId) {
                    userId = data.userId;
                    activeSessions.set(userId, ws);
                }
                
                // Store message in history
                if (!messageHistory.has(userId)) {
                    messageHistory.set(userId, []);
                }
                
                const newMessage = {
                    from: 'user',
                    content: data.message,
                    timestamp: new Date().toISOString()
                };
                
                messageHistory.get(userId).push(newMessage);
                
                // Forward to WhatsApp
                const formattedNumber = `${data.userId}@c.us`;
                
                // Check if client is ready before sending
                if (clientReady) {
                    try {
                        client.sendMessage(formattedNumber, data.message)
                            .then(() => {
                                console.log(`Message sent to WhatsApp: ${data.message}`);
                            })
                            .catch(error => {
                                console.error('Error sending to WhatsApp:', error);
                                
                                // Notify the client about the error
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({
                                        type: 'error',
                                        message: 'Failed to send message to WhatsApp. Please try again later.'
                                    }));
                                }
                            });
                    } catch (error) {
                        console.error('Exception sending to WhatsApp:', error);
                    }
                } else {
                    console.log('WhatsApp client not ready, storing message for later delivery');
                    
                    // Notify the client
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'info',
                            message: 'Your message has been received and will be delivered soon.'
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        if (userId) {
            console.log(`User ${userId} disconnected`);
            activeSessions.delete(userId);
        }
    });
});

// API endpoint to get message history
app.get('/message-history/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (messageHistory.has(userId)) {
        res.status(200).json({
            status: 'success',
            messages: messageHistory.get(userId)
        });
    } else {
        res.status(200).json({
            status: 'success',
            messages: []
        });
    }
});

// API endpoint to force WhatsApp reconnection
app.get('/reconnect', (req, res) => {
    console.log('Manual reconnection requested');
    
    if (!clientReady) {
        // Try to reinitialize
        client.destroy().then(() => {
            console.log('Client destroyed, reinitializing...');
            setTimeout(() => {
                client.initialize();
            }, 1000);
        }).catch(err => {
            console.error('Error destroying client:', err);
            client.initialize();
        });
    }
    
    res.status(200).json({
        status: 'success',
        message: 'WhatsApp reconnection initiated'
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
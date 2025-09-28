import nodemailer from 'nodemailer';
import type { Participant, GameRound } from '../shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface ReceiptData {
  participant: Participant;
  gameRound: GameRound;
  totalAmount: number;
  squareNumbers: number[];
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.GMAIL_FROM_EMAIL || '';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.warn('Gmail credentials not configured. Email service disabled.');
      return;
    }

    const config: EmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    };

    this.transporter = nodemailer.createTransport(config);
    this.fromEmail = gmailUser;
  }

  private generateReceiptHTML(data: ReceiptData): string {
    const { participant, gameRound, totalAmount, squareNumbers } = data;
    const formattedAmount = (totalAmount / 100).toFixed(2);
    const squaresList = squareNumbers.map(num => `#${num}`).join(', ');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chicken Poop Bingo Receipt</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4a90e2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
        }
        .footer {
            background-color: #f1f1f1;
            padding: 15px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 12px;
            color: #666;
        }
        .receipt-details {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4a90e2;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
            text-align: center;
            margin: 15px 0;
        }
        .squares {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
        }
        .detail-label {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐔 Chicken Poop Bingo</h1>
        <h2>Payment Receipt</h2>
    </div>
    
    <div class="content">
        <p>Dear ${participant.name},</p>
        
        <p>Thank you for your participation in our Chicken Poop Bingo fundraiser! This email serves as your official receipt.</p>
        
        <div class="receipt-details">
            <div class="detail-row">
                <span class="detail-label">Participant:</span>
                <span>${participant.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${participant.email}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span>${participant.phone || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Game Round:</span>
                <span>Round ${gameRound.roundNumber}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
        </div>

        <div class="squares">
            <h3>Your Squares</h3>
            <p><strong>Selected Squares:</strong> ${squaresList}</p>
            <p><strong>Number of Squares:</strong> ${squareNumbers.length}</p>
            <p><strong>Price per Square:</strong> $${(gameRound.pricePerSquare / 100).toFixed(2)}</p>
        </div>

        <div class="amount">
            <p>Total Amount: $${formattedAmount}</p>
        </div>

        <p><strong>Important:</strong> Please keep this receipt for your records. If you have any questions about your participation or the game, please contact the event organizers.</p>
        
        <p>Good luck and thank you for supporting our cause!</p>
    </div>
    
    <div class="footer">
        <p>This is an automated receipt from Chicken Poop Bingo</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
    `;
  }

  async sendReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not initialized. Cannot send receipt.');
      return false;
    }

    try {
      const htmlContent = this.generateReceiptHTML(data);
      const totalAmount = (data.totalAmount / 100).toFixed(2);

      const mailOptions = {
        from: {
          name: 'Chicken Poop Bingo',
          address: this.fromEmail,
        },
        to: data.participant.email,
        subject: `Chicken Poop Bingo Receipt - $${totalAmount}`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Receipt email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send receipt email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Gmail SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('Gmail SMTP connection failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const emailService = new EmailService();
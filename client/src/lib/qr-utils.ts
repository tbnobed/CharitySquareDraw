import QRCode from 'qrcode';

export async function generateVenmoQR(amount: number, note: string, username?: string): Promise<string> {
  const venmoUsername = username || import.meta.env.VITE_VENMO_USERNAME || 'nonprofitname';
  // Convert cents to dollars for Venmo (amount is stored in cents)
  const dollarAmount = (amount / 100).toFixed(2);
  const venmoUrl = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${dollarAmount}&note=${encodeURIComponent(note)}`;
  try {
    return await QRCode.toDataURL(venmoUrl);
  } catch (error) {
    console.error('Error generating Venmo QR code:', error);
    return '';
  }
}

export async function generatePayPalQR(amount: number, memo: string, username?: string): Promise<string> {
  const paypalUsername = username || import.meta.env.VITE_PAYPAL_ME_USERNAME || 'nonprofitname';
  // PayPal.me URL format: https://paypal.me/username/amount
  const paypalUrl = `https://paypal.me/${paypalUsername}/${(amount / 100).toFixed(2)}`;
  try {
    return await QRCode.toDataURL(paypalUrl);
  } catch (error) {
    console.error('Error generating PayPal QR code:', error);
    return '';
  }
}

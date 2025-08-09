import QRCode from 'qrcode';

export async function generateVenmoQR(amount: number, note: string, username: string = 'nonprofitname'): Promise<string> {
  const venmoUrl = `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount}&note=${encodeURIComponent(note)}`;
  try {
    return await QRCode.toDataURL(venmoUrl);
  } catch (error) {
    console.error('Error generating Venmo QR code:', error);
    return '';
  }
}

export async function generateZelleQR(amount: number, email: string = 'nonprofit@email.com', memo: string): Promise<string> {
  // Zelle doesn't have a standard URL scheme, so we'll create a generic payment QR
  const zelleData = `mailto:${email}?subject=Zelle Payment Request&body=Amount: $${amount}%0AMemo: ${encodeURIComponent(memo)}`;
  try {
    return await QRCode.toDataURL(zelleData);
  } catch (error) {
    console.error('Error generating Zelle QR code:', error);
    return '';
  }
}

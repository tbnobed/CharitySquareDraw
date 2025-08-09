import QRCode from 'qrcode';

export async function generateVenmoQR(amount: number, note: string, username?: string): Promise<string> {
  const venmoUsername = username || import.meta.env.VITE_VENMO_USERNAME || 'nonprofitname';
  const venmoUrl = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${amount}&note=${encodeURIComponent(note)}`;
  try {
    return await QRCode.toDataURL(venmoUrl);
  } catch (error) {
    console.error('Error generating Venmo QR code:', error);
    return '';
  }
}

export async function generateZelleQR(amount: number, memo: string, email?: string): Promise<string> {
  const zelleEmail = email || import.meta.env.VITE_ZELLE_EMAIL || 'nonprofit@email.com';
  // Zelle doesn't have a standard URL scheme, so we'll create a generic payment QR
  const zelleData = `mailto:${zelleEmail}?subject=Zelle Payment Request&body=Amount: $${amount}%0AMemo: ${encodeURIComponent(memo)}`;
  try {
    return await QRCode.toDataURL(zelleData);
  } catch (error) {
    console.error('Error generating Zelle QR code:', error);
    return '';
  }
}

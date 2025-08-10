import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, QrCode, X } from "lucide-react";
import { generateVenmoQR, generateZelleQR } from "@/lib/qr-utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  squares: number[];
  participantName: string;
  onPaymentConfirm: () => void;
  isConfirming?: boolean;
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  squares, 
  participantName,
  onPaymentConfirm,
  isConfirming 
}: PaymentModalProps) {
  const [venmoQR, setVenmoQR] = useState<string>("");
  const [zelleQR, setZelleQR] = useState<string>("");

  const handleGenerateVenmoQR = async () => {
    const qr = await generateVenmoQR(amount, `Square Game - ${squares.join(", ")}`);
    setVenmoQR(qr);
  };

  const handleGenerateZelleQR = async () => {
    const qr = await generateZelleQR(amount, `Square Game - ${squares.join(", ")}`);
    setZelleQR(qr);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md mx-3 max-h-[90vh] overflow-y-auto" data-testid="payment-modal">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-base sm:text-lg">
            Complete Payment
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 sm:h-8 sm:w-8" data-testid="button-close-payment">
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Choose your preferred payment method
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Payment Summary - Mobile Optimized */}
          <div className="text-center">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Amount Due</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900" data-testid="payment-amount">${(amount / 100).toFixed(2)}</p>
              <p className="text-xs sm:text-sm text-gray-600">
                For {participantName} - Squares: {squares.map(s => `#${s}`).join(", ")}
              </p>
            </div>
          </div>
          
          {/* Payment Options - Mobile Responsive */}
          <div className="space-y-3 sm:space-y-4">
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                    <span className="text-blue-600 font-bold text-xs sm:text-sm">V</span>
                  </div>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">Venmo</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateVenmoQR}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                  data-testid="button-venmo-qr"
                >
                  <QrCode className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Generate QR
                </Button>
              </div>
              
              {venmoQR && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center" data-testid="venmo-qr">
                  <img src={venmoQR} alt="Venmo QR Code" className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-600">Scan to pay with Venmo</p>
                  <p className="text-xs text-gray-500 mt-1">@{import.meta.env.VITE_VENMO_USERNAME || 'venmo-username'}</p>
                </div>
              )}
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                    <span className="text-green-600 font-bold text-xs sm:text-sm">Z</span>
                  </div>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">Zelle</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateZelleQR}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                  data-testid="button-zelle-qr"
                >
                  <QrCode className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Generate QR
                </Button>
              </div>
              
              {zelleQR && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center" data-testid="zelle-qr">
                  <img src={zelleQR} alt="Zelle QR Code" className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-600">Scan to pay with Zelle</p>
                  <p className="text-xs text-gray-500 mt-1">{import.meta.env.VITE_ZELLE_EMAIL || 'zelle@email.com'}</p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                    <span className="text-gray-600 font-bold text-xs sm:text-sm">$</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Cash</span>
                    <p className="text-xs text-gray-500">In-person payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${(amount / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Ready to collect</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Confirmation - Mobile Optimized */}
          <div className="border-t border-gray-200 pt-3 sm:pt-4">
            <Button
              onClick={onPaymentConfirm}
              disabled={isConfirming}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
              data-testid="button-confirm-payment"
            >
              <Check className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {isConfirming ? "Confirming..." : "Confirm Payment Received"}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Click after payment is verified
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

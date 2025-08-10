import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Download, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface QRReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
  squares: number[];
  totalAmount: number;
}

export function QRReceiptModal({ 
  isOpen, 
  onClose, 
  participantId, 
  participantName, 
  squares, 
  totalAmount 
}: QRReceiptModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const { toast } = useToast();

  // Generate the receipt URL
  const receiptUrl = `${window.location.origin}/receipt?id=${participantId}`;

  useEffect(() => {
    if (isOpen) {
      // Generate QR code as both canvas and data URL for reliability
      Promise.all([
        // Generate data URL for fallback image display
        QRCode.toDataURL(receiptUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        }),
        // Generate canvas if available
        canvasRef.current ? QRCode.toCanvas(canvasRef.current, receiptUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        }).catch(() => null) : Promise.resolve(null)
      ]).then(([dataUrl]) => {
        setQrDataUrl(dataUrl);
      }).catch(console.error);
    }
  }, [isOpen, receiptUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(receiptUrl);
      toast({
        title: "Link Copied!",
        description: "Receipt link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Square Game Receipt",
          text: `Your receipt for squares ${squares.join(", ")} - Total: $${(totalAmount / 100).toFixed(2)}`,
          url: receiptUrl,
        });
      } catch (error) {
        // User cancelled share or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    // Use the generated data URL or fall back to canvas
    const dataUrl = qrDataUrl || (canvasRef.current ? canvasRef.current.toDataURL() : '');
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `receipt-qr-${participantId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md mx-3 max-h-[90vh] overflow-y-auto" data-testid="qr-receipt-modal">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl font-bold">
            Your Receipt QR Code
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-600">
            Save and share your purchase receipt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 text-center">
          {/* Purchase Summary - Mobile Optimized */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2">
                <p className="font-medium text-gray-900 text-sm sm:text-base" data-testid="qr-participant-name">
                  {participantName}
                </p>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Squares:</span>
                  <span className="font-medium" data-testid="qr-squares">
                    {squares.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm pt-2 border-t">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-green-600" data-testid="qr-total">
                    ${(totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code - Mobile Responsive */}
          <div className="flex justify-center">
            <div className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Receipt QR Code"
                  className="mx-auto w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52"
                  data-testid="receipt-qr-code"
                />
              ) : (
                <canvas 
                  ref={canvasRef}
                  className="mx-auto w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52"
                  data-testid="receipt-qr-code"
                />
              )}
              {!qrDataUrl && !canvasRef.current && (
                <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52 bg-gray-100 flex items-center justify-center mx-auto">
                  <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Instructions - Mobile Optimized */}
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                  Save Your Receipt
                </p>
                <p className="text-xs text-blue-700">
                  Scan this QR code with your phone to access your receipt anytime. 
                  You can also share the link or download the QR code image.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Responsive */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShare}
              className="text-xs sm:text-sm px-2 sm:px-4"
              data-testid="button-share-receipt"
            >
              <Share2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownloadQR}
              className="text-xs sm:text-sm px-2 sm:px-4"
              data-testid="button-download-qr"
            >
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Download QR
            </Button>
          </div>

          {/* Manual Link - Mobile Optimized */}
          <div className="border-t pt-3 sm:pt-4">
            <p className="text-xs text-gray-600 mb-2">Or copy the link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={receiptUrl}
                readOnly
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs bg-gray-50 border rounded-md text-gray-700"
                data-testid="receipt-url-input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="px-2 sm:px-3"
                data-testid="button-copy-link"
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full text-sm sm:text-base"
            data-testid="button-close-qr-modal"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
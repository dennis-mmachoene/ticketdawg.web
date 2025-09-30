import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Scan,
  Clock
} from 'lucide-react';

const ScanTicket = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastScannedTicket, setLastScannedTicket] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrcodeRef.current && isScanning) {
        html5QrcodeRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setError('');
      setHasPermission(null);
      
      // Check camera permissions first
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
        setError('Camera permission denied. Please enable camera access and try again.');
        return;
      }

      // Set scanning state first to render the qr-reader element
      setIsScanning(true);

      // Wait a moment for the DOM to update
      setTimeout(async () => {
        try {
          // Check if element exists
          const qrReaderElement = document.getElementById("qr-reader");
          if (!qrReaderElement) {
            throw new Error('QR reader element not found in DOM');
          }

          const html5QrCode = new Html5Qrcode("qr-reader");
          html5QrcodeRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.777778,
            rememberLastUsedCamera: true,
            supportedScanTypes: []
          };

          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
          );

        } catch (err) {
          console.error("Failed to start scanning:", err);
          setError(`Failed to start camera: ${err.message}`);
          setIsScanning(false);
        }
      }, 100);

    } catch (err) {
      console.error("Failed to initialize scanning:", err);
      setError('Failed to initialize scanner. Please try again.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrcodeRef.current && isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanning:", err);
        // Force stop scanning even if there's an error
        setIsScanning(false);
        html5QrcodeRef.current = null;
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (isValidating) return;

    // Stop scanning immediately to prevent re-scans
    setIsValidating(true);
    await stopScanning();
    
    setScanResult(null);
    setError('');

    try {
      const response = await api.validateTicket(decodedText);
      setLastScannedTicket(response.data);
      setScanResult({
        type: 'success',
        title: 'Ticket Validated! ✅',
        message: `Ticket ${response.data.ticketID} for ${response.data.email} has been successfully validated.`
      });
      
    } catch (error) {
      let resultType = 'error';
      let resultTitle = 'Validation Error';
      let resultMessage = 'Failed to validate ticket';

      if (error.message.includes('Invalid QR code')) {
        resultMessage = 'This QR code is not a valid ticket.';
        resultTitle = 'Invalid Ticket ❌';
      } else if (error.message.includes('Ticket not assigned')) {
        resultMessage = 'This ticket has not been assigned to anyone yet.';
        resultTitle = 'Unassigned Ticket ⚠️';
        resultType = 'warning';
      } else if (error.message.includes('already used')) {
        resultMessage = 'This ticket has already been used for entry.';
        resultTitle = 'Already Used ❌';
      }

      setScanResult({
        type: resultType,
        title: resultTitle,
        message: resultMessage
      });
    } finally {
      setIsValidating(false);
    }
  };

  const onScanFailure = (error) => {
    // Ignore scan failures as they're expected when no QR code is in view
  };

  const resetScanner = async () => {
    setScanResult(null);
    setLastScannedTicket(null);
    setError('');
    
    // If currently scanning, restart it
    if (isScanning) {
      await stopScanning();
      setTimeout(() => {
        startScanning();
      }, 500);
    }
  };

  const getScanResultIcon = () => {
    switch (scanResult?.type) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
      case 'error':
      default:
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getScanResultBgColor = () => {
    switch (scanResult?.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="section-padding">
      <div className="container-custom max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Scan QR Code</h1>
          <p className="text-secondary-600">
            Validate tickets at the entrance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="text-center">
                {!isScanning ? (
                  <div className="space-y-6">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                      <Scan className="h-10 w-10 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                        Ready to Scan
                      </h3>
                      <p className="text-secondary-600 mb-6">
                        Click the button below to start scanning QR codes on tickets
                      </p>
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={startScanning}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Camera size={16} />
                      <span>Start Scanner</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                      <div id="qr-reader" className="w-full h-full"></div>
                      
                      {isValidating && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                          <div className="bg-white rounded-lg p-6 text-center">
                            <div className="loading-spinner mx-auto mb-2"></div>
                            <p className="text-secondary-700">Validating ticket...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={stopScanning}
                        disabled={isValidating}
                        className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                      >
                        <CameraOff size={16} />
                        <span>Stop Scanner</span>
                      </button>
                      
                      <button
                        onClick={resetScanner}
                        disabled={isValidating}
                        className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                      >
                        <RotateCcw size={16} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div className={`card border ${getScanResultBgColor()}`}>
                <div className="flex items-start space-x-4">
                  {getScanResultIcon()}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                      {scanResult.title}
                    </h3>
                    <p className="text-secondary-700">
                      {scanResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Last Scanned Ticket Info */}
            {lastScannedTicket && (
              <div className="card bg-green-50 border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  Last Validated Ticket
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-green-200 last:border-b-0">
                    <span className="font-medium text-green-800">Ticket ID:</span>
                    <span className="text-green-700 font-mono">{lastScannedTicket.ticketID}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200 last:border-b-0">
                    <span className="font-medium text-green-800">Email:</span>
                    <span className="text-green-700">{lastScannedTicket.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200 last:border-b-0">
                    <span className="font-medium text-green-800">Validated At:</span>
                    <span className="text-green-700 flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{new Date(lastScannedTicket.usedAt).toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-green-800">Issued By:</span>
                    <span className="text-green-700">{lastScannedTicket.issuedBy}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructions */}
            <div className="card border-l-4 border-l-primary-500">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                How to Scan
              </h3>
              <ul className="space-y-3 text-sm text-secondary-600">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Ask the student to show their PDF ticket</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Point the camera at the QR code</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>The system will automatically validate</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Allow entry if validation is successful</span>
                </li>
              </ul>
            </div>

            {/* Status Indicators */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Validation Status
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-secondary-700">Valid - Allow Entry</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <span className="text-secondary-700">Warning - Check Manual</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle size={16} className="text-red-600" />
                  <span className="text-secondary-700">Invalid - Deny Entry</span>
                </div>
              </div>
            </div>

            {/* Camera Note */}
            <div className="card bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                📱 Camera Access Required
              </h4>
              <p className="text-blue-700 text-sm">
                This feature requires camera access to scan QR codes. 
                Please allow camera permissions when prompted.
              </p>
            </div>

            {/* Troubleshooting */}
            <div className="card bg-gray-50 border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                🔧 Troubleshooting
              </h4>
              <ul className="text-gray-700 text-xs space-y-1">
                <li>• Ensure good lighting</li>
                <li>• Hold camera steady</li>
                <li>• Try refreshing the page</li>
                <li>• Check browser permissions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanTicket;
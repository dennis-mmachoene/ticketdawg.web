import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RotateCcw, CheckCircle, XCircle, AlertTriangle, Scan, Clock } from 'lucide-react';

const ScanTicket = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastScannedTicket, setLastScannedTicket] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  const html5QrcodeRef = useRef(null);
  // Synchronous locks (refs) so the camera's rapid re-fires cannot double-submit.
  const isValidatingRef = useRef(false);
  const lastScanRef = useRef({ code: null, at: 0 });
  const isScanningRef = useRef(false);

  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current && isScanningRef.current) {
        html5QrcodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setScanResult(null);
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        setError('Camera permission denied. Please enable camera access and try again.');
        return;
      }

      setIsScanning(true);
      isScanningRef.current = true;

      setTimeout(async () => {
        try {
          const el = document.getElementById('qr-reader');
          if (!el) throw new Error('QR reader element not found in DOM');

          const html5QrCode = new Html5Qrcode('qr-reader');
          html5QrcodeRef.current = html5QrCode;

          const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.777778 };
          await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, onScanFailure);
        } catch (err) {
          setError(`Failed to start camera: ${err.message}`);
          setIsScanning(false);
          isScanningRef.current = false;
        }
      }, 100);
    } catch (err) {
      setError('Failed to initialize scanner. Please try again.');
      setIsScanning(false);
      isScanningRef.current = false;
    }
  };

  const stopScanning = async () => {
    const instance = html5QrcodeRef.current;
    html5QrcodeRef.current = null;
    isScanningRef.current = false;
    setIsScanning(false);
    if (instance) {
      try {
        await instance.stop();
        await instance.clear();
      } catch (err) {
        // already stopped, ignore
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    const now = Date.now();
    // Hard guards against the burst of duplicate reads from the camera.
    if (isValidatingRef.current) return;
    if (decodedText === lastScanRef.current.code && now - lastScanRef.current.at < 6000) return;

    isValidatingRef.current = true;
    lastScanRef.current = { code: decodedText, at: now };
    setIsValidating(true);
    await stopScanning();
    setScanResult(null);
    setError('');

    try {
      const response = await api.validateTicket(decodedText);
      setLastScannedTicket(response.data);
      setScanResult({
        type: 'success',
        title: 'Ticket Validated ✅',
        message: `${response.data.email || response.data.ticketID} is checked in.`,
      });
    } catch (err) {
      let resultType = 'error';
      let resultTitle = 'Validation Error';
      let resultMessage = 'Failed to validate ticket';
      if (err.message.includes('Invalid QR code')) {
        resultTitle = 'Invalid Ticket ❌';
        resultMessage = 'This QR code is not a valid ticket.';
      } else if (err.message.includes('not assigned')) {
        resultTitle = 'Unassigned Ticket ⚠️';
        resultMessage = 'This ticket has not been issued to anyone yet.';
        resultType = 'warning';
      } else if (err.message.includes('already used')) {
        resultTitle = 'Already Used ❌';
        resultMessage = 'This ticket has already been used for entry.';
      } else if (err.message) {
        resultMessage = err.message;
      }
      setScanResult({ type: resultType, title: resultTitle, message: resultMessage });
    } finally {
      setIsValidating(false);
      isValidatingRef.current = false;
    }
  };

  const onScanFailure = () => {
    // No QR in view yet; ignore.
  };

  const scanNext = async () => {
    setScanResult(null);
    setLastScannedTicket(null);
    setError('');
    // Allow the same code to be scanned again on a fresh, deliberate scan.
    lastScanRef.current = { code: null, at: 0 };
    await startScanning();
  };

  const getScanResultIcon = () => {
    switch (scanResult?.type) {
      case 'success': return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
      default: return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getScanResultBgColor = () => {
    switch (scanResult?.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="section-padding">
      <div className="container-custom max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Scan QR Code</h1>
          <p className="text-secondary-600">Validate tickets at the Pool Party entrance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="text-center">
                {!isScanning ? (
                  <div className="space-y-6">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                      <Scan className="h-10 w-10 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-secondary-900 mb-2">Ready to Scan</h3>
                      <p className="text-secondary-600 mb-6">Tap below to start the camera and scan a ticket QR code</p>
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}
                    <button onClick={scanResult ? scanNext : startScanning} className="btn-primary flex items-center space-x-2 mx-auto">
                      <Camera size={16} />
                      <span>{scanResult ? 'Scan Next Ticket' : 'Start Scanner'}</span>
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
                      <button onClick={stopScanning} disabled={isValidating} className="btn-secondary flex items-center space-x-2 disabled:opacity-50">
                        <CameraOff size={16} /><span>Stop Scanner</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {scanResult && (
              <div className={`card border ${getScanResultBgColor()}`}>
                <div className="flex items-start space-x-4">
                  {getScanResultIcon()}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">{scanResult.title}</h3>
                    <p className="text-secondary-700">{scanResult.message}</p>
                    <button onClick={scanNext} className="btn-primary mt-4 flex items-center space-x-2">
                      <RotateCcw size={16} /><span>Scan Next Ticket</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {lastScannedTicket && (
              <div className="card bg-green-50 border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Last Validated Ticket</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-800">Ticket ID:</span>
                    <span className="text-green-700 font-mono">{lastScannedTicket.ticketID}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium text-green-800">Email:</span>
                    <span className="text-green-700">{lastScannedTicket.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-green-800">Validated At:</span>
                    <span className="text-green-700 flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{lastScannedTicket.usedAt ? new Date(lastScannedTicket.usedAt).toLocaleString() : ''}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card border-l-4 border-l-primary-500">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">How to Scan</h3>
              <ul className="space-y-3 text-sm text-secondary-600">
                <li className="flex items-start space-x-2"><span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span><span>Ask the student to show their ticket QR</span></li>
                <li className="flex items-start space-x-2"><span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span><span>Point the camera at the QR code</span></li>
                <li className="flex items-start space-x-2"><span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span><span>Wait for the green result, then tap Scan Next</span></li>
              </ul>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Validation Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2"><CheckCircle size={16} className="text-green-600" /><span className="text-secondary-700">Valid - Allow Entry</span></div>
                <div className="flex items-center space-x-2"><AlertTriangle size={16} className="text-yellow-600" /><span className="text-secondary-700">Warning - Check Manually</span></div>
                <div className="flex items-center space-x-2"><XCircle size={16} className="text-red-600" /><span className="text-secondary-700">Invalid or Used - Deny Entry</span></div>
              </div>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📱 Camera Access Required</h4>
              <p className="text-blue-700 text-sm">This uses your camera to scan QR codes. Please allow camera access when asked. The site must be opened over https for the camera to work.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanTicket;

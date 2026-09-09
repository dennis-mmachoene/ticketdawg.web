import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RotateCcw, CheckCircle, XCircle, AlertTriangle, Scan, Clock, Keyboard } from 'lucide-react';

const ScanTicket = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastScannedTicket, setLastScannedTicket] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [manualId, setManualId] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  const html5QrcodeRef = useRef(null);
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

  const applySuccess = (data) => {
    setLastScannedTicket(data);
    setScanResult({ type: 'success', title: 'Ticket Validated ✅', message: `${data.email || data.ticketID} is checked in.` });
  };

  const applyError = (err) => {
    let type = 'error';
    let title = 'Validation Error';
    let message = err.message || 'Failed to validate ticket';
    const m = err.message || '';
    if (m.includes('Invalid')) { title = 'Invalid Ticket ❌'; message = 'This is not a valid ticket.'; }
    else if (m.includes('not assigned')) { type = 'warning'; title = 'Unassigned Ticket ⚠️'; message = 'This ticket has not been issued to anyone yet.'; }
    else if (m.includes('already used')) {
      title = 'Already Used ❌';
      const when = err.data?.usedAt ? ` at ${new Date(err.data.usedAt).toLocaleTimeString()}` : '';
      const who = err.data?.usedBy ? ` by ${err.data.usedBy}` : '';
      message = `This ticket was already used${when}${who}.`;
    }
    setScanResult({ type, title, message });
  };

  const startScanning = async () => {
    try {
      setError('');
      setScanResult(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop()); // release immediately; html5-qrcode opens its own
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
          await html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.777778 }, onScanSuccess, () => {});
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
      try { await instance.stop(); await instance.clear(); } catch (err) { /* already stopped */ }
    }
  };

  const onScanSuccess = async (decodedText) => {
    const now = Date.now();
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
      applySuccess(response.data);
    } catch (err) {
      applyError(err);
    } finally {
      setIsValidating(false);
      isValidatingRef.current = false;
    }
  };

  const onManualCheckin = async (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setManualBusy(true);
    setScanResult(null);
    setError('');
    try {
      const r = await api.checkInByTicketId(manualId.trim());
      applySuccess(r.data);
      setManualId('');
    } catch (err) {
      applyError(err);
    } finally {
      setManualBusy(false);
    }
  };

  const scanNext = async () => {
    setScanResult(null);
    setLastScannedTicket(null);
    setError('');
    lastScanRef.current = { code: null, at: 0 };
    await startScanning();
  };

  const getScanResultIcon = () => {
    if (scanResult?.type === 'success') return <CheckCircle className="h-8 w-8 text-green-600" />;
    if (scanResult?.type === 'warning') return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    return <XCircle className="h-8 w-8 text-red-600" />;
  };
  const getScanResultBgColor = () => {
    if (scanResult?.type === 'success') return 'bg-green-50 border-green-200';
    if (scanResult?.type === 'warning') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
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
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto"><Scan className="h-10 w-10 text-primary-600" /></div>
                    <div>
                      <h3 className="text-xl font-semibold text-secondary-900 mb-2">Ready to Scan</h3>
                      <p className="text-secondary-600 mb-6">Tap below to start the camera and scan a ticket QR code</p>
                    </div>
                    {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}
                    <button onClick={scanResult ? scanNext : startScanning} className="btn-primary flex items-center space-x-2 mx-auto">
                      <Camera size={16} /><span>{scanResult ? 'Scan Next Ticket' : 'Start Scanner'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                      <div id="qr-reader" className="w-full h-full"></div>
                      {isValidating && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                          <div className="bg-white rounded-lg p-6 text-center"><div className="loading-spinner mx-auto mb-2"></div><p className="text-secondary-700">Validating ticket...</p></div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center space-x-4">
                      <button onClick={stopScanning} disabled={isValidating} className="btn-secondary flex items-center space-x-2 disabled:opacity-50"><CameraOff size={16} /><span>Stop Scanner</span></button>
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
                    <button onClick={scanNext} className="btn-primary mt-4 flex items-center space-x-2"><RotateCcw size={16} /><span>Scan Next Ticket</span></button>
                  </div>
                </div>
              </div>
            )}

            {lastScannedTicket && (
              <div className="card bg-green-50 border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Last Validated Ticket</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-green-200"><span className="font-medium text-green-800">Ticket ID:</span><span className="text-green-700 font-mono">{lastScannedTicket.ticketID}</span></div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200"><span className="font-medium text-green-800">Email:</span><span className="text-green-700">{lastScannedTicket.email}</span></div>
                  <div className="flex justify-between items-center py-2"><span className="font-medium text-green-800">Validated At:</span><span className="text-green-700 flex items-center space-x-1"><Clock size={12} /><span>{lastScannedTicket.usedAt ? new Date(lastScannedTicket.usedAt).toLocaleString() : ''}</span></span></div>
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

            <div className="card border-l-4 border-l-blue-500">
              <h3 className="text-lg font-semibold text-secondary-900 mb-2 flex items-center space-x-2"><Keyboard size={18} /><span>Manual check-in</span></h3>
              <p className="text-sm text-secondary-600">Camera won't scan? Type the Ticket ID printed on the PDF.</p>
              <form onSubmit={onManualCheckin} className="mt-3 space-y-3">
                <input value={manualId} onChange={(e) => setManualId(e.target.value)} className="input" placeholder="e.g. ASAMTT3M3TREAXU0" />
                <button type="submit" disabled={manualBusy} className="btn-primary w-full disabled:opacity-50">{manualBusy ? 'Checking...' : 'Check in by ID'}</button>
              </form>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📱 Camera Access</h4>
              <p className="text-blue-700 text-sm">This uses your camera to scan QR codes. Allow camera access when asked. The site must be opened over https for the camera to work.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanTicket;

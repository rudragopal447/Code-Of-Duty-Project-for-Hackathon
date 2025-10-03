import React, { useState } from 'react';
import { Upload, Mail, MessageSquare, CheckCircle, XCircle, Clock, Download, Eye, AlertCircle, Loader } from 'lucide-react';

const CertificateAutomationSystem = () => {
  const [participants, setParticipants] = useState([]);
  const [eventDetails, setEventDetails] = useState({
    eventName: '',
    date: '',
    organizer: '',
    template: 'modern'
  });
  const [currentView, setCurrentView] = useState('upload');
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [selectedCert, setSelectedCert] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const templates = {
    modern: { bg: '#1e40af', accent: '#3b82f6', font: 'Arial' },
    elegant: { bg: '#7c3aed', accent: '#a78bfa', font: 'Georgia' },
    classic: { bg: '#059669', accent: '#10b981', font: 'Times New Roman' }
  };

  const verifyName = (name) => {
    const issues = [];
    
    if (/\d/.test(name)) issues.push('Contains numbers');
    if (/[^a-zA-Z\s\-\.]/.test(name)) issues.push('Special characters detected');
    if (name.length < 2) issues.push('Name too short');
    if (!/^[A-Z]/.test(name.trim())) issues.push('Should start with capital');
    if (/\s{2,}/.test(name)) issues.push('Multiple spaces');
    
    let fixed = name.trim().replace(/\s+/g, ' ');
    fixed = fixed.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    return { original: name, fixed, issues, isValid: issues.length === 0 };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      const parsed = lines.slice(1).map((line, idx) => {
        const [name, email, phone] = line.split(',').map(s => s.trim());
        const verification = verifyName(name || '');
        return {
          id: idx,
          name: verification.fixed,
          originalName: verification.original,
          email: email || '',
          phone: phone || '',
          verification,
          status: 'pending'
        };
      });
      
      setParticipants(parsed);
      setCurrentView('verify');
    };
    reader.readAsText(file);
  };

  const generateCertificate = (participant) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    const template = templates[eventDetails.template];
    
    ctx.fillStyle = template.bg;
    ctx.fillRect(0, 0, 1200, 800);
    
    ctx.strokeStyle = template.accent;
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, 1120, 720);
    
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, 1080, 680);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px ' + template.font;
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE', 600, 150);
    ctx.fillText('OF ACHIEVEMENT', 600, 220);
    
    ctx.font = '24px ' + template.font;
    ctx.fillText('This is to certify that', 600, 300);
    
    ctx.font = 'bold 48px ' + template.font;
    ctx.fillStyle = template.accent;
    ctx.fillText(participant.name.toUpperCase(), 600, 380);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px ' + template.font;
    ctx.fillText('has successfully participated in', 600, 450);
    
    ctx.font = 'bold 32px ' + template.font;
    ctx.fillText(eventDetails.eventName, 600, 510);
    
    ctx.font = '20px ' + template.font;
    ctx.fillText(`Date: ${eventDetails.date}`, 600, 600);
    
    ctx.font = 'italic 22px ' + template.font;
    ctx.fillText(eventDetails.organizer, 600, 680);
    ctx.fillText('Organizer', 600, 710);
    
    return canvas.toDataURL('image/png');
  };

  const handleSendCertificates = async (method) => {
    if (!eventDetails.eventName || !eventDetails.date || !eventDetails.organizer) {
      alert('Please fill in all event details first!');
      return;
    }

    setSending(true);
    setSendingProgress({ current: 0, total: participants.length });
    const newStatus = {};

    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      setSendingProgress({ current: i + 1, total: participants.length });

      try {
        const certificateData = generateCertificate(participant);

        if (method === 'email') {
          const response = await fetch(`${API_URL}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: participant.email,
              name: participant.name,
              certificateBase64: certificateData,
              eventName: eventDetails.eventName
            })
          });

          const result = await response.json();
          newStatus[participant.id] = {
            status: result.success ? 'delivered' : 'bounced',
            method: 'email',
            timestamp: new Date(),
            error: result.error
          };

        } else if (method === 'whatsapp') {
          const response = await fetch(`${API_URL}/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: participant.phone,
              name: participant.name,
              eventName: eventDetails.eventName
            })
          });

          const result = await response.json();
          newStatus[participant.id] = {
            status: result.success ? 'delivered' : 'bounced',
            method: 'whatsapp',
            timestamp: new Date(),
            error: result.error
          };
        }

      } catch (error) {
        console.error(`Error sending to ${participant.name}:`, error);
        newStatus[participant.id] = {
          status: 'bounced',
          method,
          timestamp: new Date(),
          error: error.message
        };
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setDeliveryStatus(newStatus);
    setSending(false);
    setCurrentView('dashboard');
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="text-green-500" size={20} />;
      case 'bounced': return <XCircle className="text-red-500" size={20} />;
      case 'pending': return <Clock className="text-yellow-500" size={20} />;
      default: return <Clock className="text-gray-400" size={20} />;
    }
  };

  const previewCertificate = (participant) => {
    const certData = generateCertificate(participant);
    setSelectedCert({ participant, data: certData });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎓 Certificate Automation System</h1>
          <p className="text-gray-600">AI-powered certificate generation and delivery</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setCurrentView('upload')}
            className={`px-4 py-2 rounded-lg font-medium ${currentView === 'upload' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            1. Upload Data
          </button>
          <button
            onClick={() => setCurrentView('verify')}
            disabled={participants.length === 0}
            className={`px-4 py-2 rounded-lg font-medium ${currentView === 'verify' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} disabled:opacity-50`}
          >
            2. Verify & Generate
          </button>
          <button
            onClick={() => setCurrentView('send')}
            disabled={participants.length === 0}
            className={`px-4 py-2 rounded-lg font-medium ${currentView === 'send' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} disabled:opacity-50`}
          >
            3. Send
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            4. Dashboard
          </button>
        </div>

        {currentView === 'upload' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Event Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <input
                type="text"
                placeholder="Event Name"
                value={eventDetails.eventName}
                onChange={(e) => setEventDetails({...eventDetails, eventName: e.target.value})}
                className="p-3 border rounded-lg"
              />
              <input
                type="date"
                value={eventDetails.date}
                onChange={(e) => setEventDetails({...eventDetails, date: e.target.value})}
                className="p-3 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Organizer Name"
                value={eventDetails.organizer}
                onChange={(e) => setEventDetails({...eventDetails, organizer: e.target.value})}
                className="p-3 border rounded-lg"
              />
              <select
                value={eventDetails.template}
                onChange={(e) => setEventDetails({...eventDetails, template: e.target.value})}
                className="p-3 border rounded-lg"
              >
                <option value="modern">Modern Template</option>
                <option value="elegant">Elegant Template</option>
                <option value="classic">Classic Template</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-semibold mb-2">Upload Participant Data</h3>
              <p className="text-gray-600 mb-4">CSV format: name, email, phone</p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="fileUpload"
              />
              <label
                htmlFor="fileUpload"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700"
              >
                Choose File
              </label>
            </div>
          </div>
        )}

        {currentView === 'verify' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">AI Name Verification</h2>
            <div className="space-y-3">
              {participants.map(p => (
                <div key={p.id} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {p.verification.isValid ? 
                        <CheckCircle className="text-green-500 flex-shrink-0" size={20} /> : 
                        <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
                      }
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    {!p.verification.isValid && (
                      <div className="text-sm text-gray-600 ml-7">
                        <span className="text-red-600">Original: {p.originalName}</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-600">Fixed: {p.name}</span>
                        <div className="text-xs text-yellow-600 mt-1">
                          Issues: {p.verification.issues.join(', ')}
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-gray-500 ml-7">
                      {p.email} | {p.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => previewCertificate(p)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'send' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Send Certificates</h2>
            
            {sending && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Loader className="animate-spin text-blue-600" size={24} />
                  <span className="font-semibold">Sending certificates...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(sendingProgress.current / sendingProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {sendingProgress.current} of {sendingProgress.total} sent
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleSendCertificates('email')}
                disabled={sending}
                className="bg-blue-600 text-white p-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-4"
              >
                <Mail size={48} />
                <div>
                  <div className="text-xl font-bold">Send via Email</div>
                  <div className="text-sm">Bulk email to all participants</div>
                </div>
              </button>
              <button
                onClick={() => handleSendCertificates('whatsapp')}
                disabled={sending}
                className="bg-green-600 text-white p-8 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-4"
              >
                <MessageSquare size={48} />
                <div>
                  <div className="text-xl font-bold">Send via WhatsApp</div>
                  <div className="text-sm">Bulk WhatsApp to all participants</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Delivery Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {Object.values(deliveryStatus).filter(s => s.status === 'delivered').length}
                </div>
                <div className="text-sm text-gray-600">Delivered</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">
                  {Object.values(deliveryStatus).filter(s => s.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {Object.values(deliveryStatus).filter(s => s.status === 'bounced').length}
                </div>
                <div className="text-sm text-gray-600">Bounced</div>
              </div>
            </div>

            <div className="space-y-2">
              {participants.map(p => (
                <div key={p.id} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(deliveryStatus[p.id]?.status)}
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-gray-500">{p.email}</div>
                      {deliveryStatus[p.id]?.error && (
                        <div className="text-xs text-red-500 mt-1">
                          Error: {deliveryStatus[p.id].error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium capitalize">
                      {deliveryStatus[p.id]?.status || 'Not sent'}
                    </div>
                    <div className="text-xs text-gray-500">
                      via {deliveryStatus[p.id]?.method || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-screen overflow-auto">
              <h3 className="text-xl font-bold mb-4">Certificate Preview - {selectedCert.participant.name}</h3>
              <img src={selectedCert.data} alt="Certificate" className="w-full rounded-lg shadow-lg" />
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setSelectedCert(null)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
                <a
                  href={selectedCert.data}
                  download={`certificate_${selectedCert.participant.name}.png`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateAutomationSystem;
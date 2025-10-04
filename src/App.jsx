import React, { useState } from 'react';
import { Upload, Mail, MessageSquare, CheckCircle, XCircle, Clock, Download, Eye, AlertCircle, Loader, Send } from 'lucide-react';

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
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [livePreview, setLivePreview] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const templates = {
    // FORMAL TEMPLATES
    classic: {
      name: 'Classic Formal',
      bg: '#ffffff',
      accent: '#1a1a2e',
      secondary: '#8b7355',
      font: 'Georgia',
      style: 'classic',
      category: 'formal'
    },
    prestigious: {
      name: 'Prestigious Gold',
      bg: '#0a0a0a',
      accent: '#d4af37',
      secondary: '#c9a961',
      font: 'Georgia',
      style: 'prestigious',
      category: 'formal'
    },
    royal: {
      name: 'Royal Certificate',
      bg: '#1a1a4e',
      accent: '#ffd700',
      secondary: '#c0c0c0',
      font: 'Georgia',
      style: 'royal',
      category: 'formal'
    },
    // INFORMAL TEMPLATES
    modern: {
      name: 'Modern Casual',
      bg: '#6366f1',
      accent: '#fbbf24',
      secondary: '#f59e0b',
      font: 'Arial',
      style: 'modern',
      category: 'informal'
    },
    vibrant: {
      name: 'Vibrant Fun',
      bg: '#ec4899',
      accent: '#8b5cf6',
      secondary: '#f97316',
      font: 'Arial',
      style: 'vibrant',
      category: 'informal'
    },
    creative: {
      name: 'Creative Burst',
      bg: '#14b8a6',
      accent: '#fb923c',
      secondary: '#fbbf24',
      font: 'Arial',
      style: 'creative',
      category: 'informal'
    }
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
    canvas.width = 1400;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    
    const template = templates[eventDetails.template];
    
    const drawGradientBg = () => {
      const gradient = ctx.createLinearGradient(0, 0, 1400, 1000);
      gradient.addColorStop(0, template.bg);
      gradient.addColorStop(1, template.accent + '40');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1400, 1000);
    };
    
    const drawCorners = () => {
      ctx.strokeStyle = template.accent;
      ctx.lineWidth = 4;
      
      ctx.beginPath();
      ctx.moveTo(80, 120);
      ctx.lineTo(80, 80);
      ctx.lineTo(120, 80);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(1280, 80);
      ctx.lineTo(1320, 80);
      ctx.lineTo(1320, 120);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(120, 920);
      ctx.lineTo(80, 920);
      ctx.lineTo(80, 880);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(1320, 880);
      ctx.lineTo(1320, 920);
      ctx.lineTo(1280, 920);
      ctx.stroke();
    };
    
    const drawFormalBorder = () => {
      // Triple border design
      ctx.strokeStyle = template.accent;
      ctx.lineWidth = 12;
      ctx.strokeRect(60, 60, 1280, 880);
      
      ctx.strokeStyle = template.secondary;
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 80, 1240, 840);
      
      ctx.strokeStyle = template.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(95, 95, 1210, 810);
      
      // Corner ornaments
      const drawOrnament = (x, y, flip = 1) => {
        ctx.strokeStyle = template.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (40 * flip), y);
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 40);
        ctx.stroke();
        
        // Small decorative circle
        ctx.fillStyle = template.accent;
        ctx.beginPath();
        ctx.arc(x + (15 * flip), y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
      };
      
      drawOrnament(120, 120, 1);
      drawOrnament(1280, 120, -1);
      drawOrnament(120, 880, 1);
      drawOrnament(1280, 880, -1);
    };
    
    // Apply template-specific styling
    if (template.style === 'classic') {
      // Classic Formal - White with black borders
      ctx.fillStyle = template.bg;
      ctx.fillRect(0, 0, 1400, 1000);
      
      drawFormalBorder();
      
      // Elegant header pattern
      ctx.strokeStyle = template.secondary;
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.moveTo(200 + i * 35, 110);
        ctx.lineTo(220 + i * 35, 130);
        ctx.stroke();
      }
      
    } else if (template.style === 'prestigious') {
      // Prestigious Gold - Black with gold
      ctx.fillStyle = template.bg;
      ctx.fillRect(0, 0, 1400, 1000);
      
      // Gold gradient border
      const goldGradient = ctx.createLinearGradient(0, 0, 1400, 0);
      goldGradient.addColorStop(0, template.accent);
      goldGradient.addColorStop(0.5, template.secondary);
      goldGradient.addColorStop(1, template.accent);
      
      ctx.strokeStyle = goldGradient;
      ctx.lineWidth = 15;
      ctx.strokeRect(50, 50, 1300, 900);
      
      ctx.strokeStyle = template.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(75, 75, 1250, 850);
      
      // Ornate corner designs
      const drawPrestigiousCorner = (x, y, rotation) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.strokeStyle = template.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(30, 10, 50, 0);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, 30, 0, 50);
        ctx.stroke();
        ctx.restore();
      };
      
      drawPrestigiousCorner(100, 100, 0);
      drawPrestigiousCorner(1300, 100, Math.PI / 2);
      drawPrestigiousCorner(1300, 900, Math.PI);
      drawPrestigiousCorner(100, 900, (3 * Math.PI) / 2);
      
    } else if (template.style === 'royal') {
      // Royal - Navy with gold accents
      ctx.fillStyle = template.bg;
      ctx.fillRect(0, 0, 1400, 1000);
      
      // Royal pattern background
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 15; j++) {
          ctx.fillStyle = template.accent;
          ctx.beginPath();
          ctx.moveTo(i * 70 + 35, j * 70);
          ctx.lineTo(i * 70 + 50, j * 70 + 25);
          ctx.lineTo(i * 70 + 35, j * 70 + 50);
          ctx.lineTo(i * 70 + 20, j * 70 + 25);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      
      // Double frame
      ctx.strokeStyle = template.accent;
      ctx.lineWidth = 10;
      ctx.strokeRect(70, 70, 1260, 860);
      
      ctx.strokeStyle = template.secondary;
      ctx.lineWidth = 6;
      ctx.strokeRect(90, 90, 1220, 820);
      
    } else if (template.style === 'modern') {
      // Modern Casual - Colorful gradient
      const gradient = ctx.createLinearGradient(0, 0, 1400, 1000);
      gradient.addColorStop(0, template.bg);
      gradient.addColorStop(1, template.accent);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1400, 1000);
      
      // Playful circles
      ctx.globalAlpha = 0.2;
      const drawCircle = (x, y, r, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      
      drawCircle(200, 200, 150, template.secondary);
      drawCircle(1200, 300, 120, template.accent);
      drawCircle(300, 800, 180, template.secondary);
      drawCircle(1100, 700, 140, template.accent);
      ctx.globalAlpha = 1;
      
      // Modern border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.setLineDash([20, 10]);
      ctx.strokeRect(80, 80, 1240, 840);
      ctx.setLineDash([]);
      
    } else if (template.style === 'vibrant') {
      // Vibrant Fun - Multi-color gradient
      const gradient = ctx.createLinearGradient(0, 0, 1400, 1000);
      gradient.addColorStop(0, template.bg);
      gradient.addColorStop(0.33, template.accent);
      gradient.addColorStop(0.66, template.secondary);
      gradient.addColorStop(1, template.bg);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1400, 1000);
      
      // Wavy patterns
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let x = 0; x < 1400; x += 10) {
          const y = 150 + i * 100 + Math.sin((x + i * 50) * 0.02) * 40;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      
      // Fun border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeRect(70, 70, 1260, 860);
      
    } else if (template.style === 'creative') {
      // Creative Burst - Teal with orange
      const gradient = ctx.createRadialGradient(700, 500, 100, 700, 500, 800);
      gradient.addColorStop(0, template.accent);
      gradient.addColorStop(0.5, template.bg);
      gradient.addColorStop(1, template.secondary);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1400, 1000);
      
      // Burst pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24;
        ctx.beginPath();
        ctx.moveTo(700, 500);
        ctx.lineTo(700 + Math.cos(angle) * 600, 500 + Math.sin(angle) * 450);
        ctx.stroke();
      }
      
      // Creative border with dots
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(80, 80, 1240, 840);
      
      // Dotted inner border
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(100 + i * 25, 100, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(100 + i * 25, 900, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 35; i++) {
        ctx.beginPath();
        ctx.arc(100, 100 + i * 23, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(1300, 100 + i * 23, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Set text color based on background
    const textColor = (template.style === 'classic') ? template.accent : '#ffffff';
    const isFormal = template.category === 'formal';
    
    // Main Title
    ctx.fillStyle = textColor;
    ctx.font = `${isFormal ? 'normal' : 'bold'} ${isFormal ? '70px' : '80px'} ${template.font}`;
    ctx.textAlign = 'center';
    
    if (isFormal) {
      ctx.fillText('CERTIFICATE', 700, 200);
      ctx.font = `${isFormal ? 'italic' : 'bold'} 40px ${template.font}`;
      ctx.fillText('of Achievement', 700, 260);
    } else {
      ctx.fillText('CERTIFICATE', 700, 200);
      ctx.font = `bold 50px ${template.font}`;
      ctx.fillText('OF ACHIEVEMENT', 700, 270);
    }
    
    // Decorative line under title
    if (!isFormal) {
      ctx.strokeStyle = template.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(450, 290);
      ctx.lineTo(950, 290);
      ctx.stroke();
    }
    
    // "This is to certify that"
    ctx.fillStyle = (template.style === 'classic') ? template.secondary : 
                    (isFormal ? template.secondary : '#ffffff');
    ctx.font = `${isFormal ? 'italic' : 'normal'} ${isFormal ? '26px' : '28px'} ${template.font}`;
    ctx.fillText(isFormal ? 'This is to certify that' : 'This certificate is proudly presented to', 700, 370);
    
    // Participant Name (Highlighted)
    ctx.font = `bold ${isFormal ? '60px' : '65px'} ${template.font}`;
    
    // Name background highlight (informal only)
    if (!isFormal && template.style !== 'classic') {
      ctx.fillStyle = template.accent + '30';
      const nameWidth = ctx.measureText(participant.name.toUpperCase()).width;
      ctx.fillRect(700 - nameWidth/2 - 30, 400, nameWidth + 60, 80);
    }
    
    // Name styling
    if (isFormal) {
      ctx.fillStyle = template.accent;
      // Add underline for formal
      const nameWidth = ctx.measureText(participant.name.toUpperCase()).width;
      ctx.fillText(participant.name.toUpperCase(), 700, 460);
      ctx.strokeStyle = template.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(700 - nameWidth/2, 475);
      ctx.lineTo(700 + nameWidth/2, 475);
      ctx.stroke();
    } else {
      const nameGradient = ctx.createLinearGradient(0, 430, 1400, 430);
      nameGradient.addColorStop(0, template.accent);
      nameGradient.addColorStop(0.5, template.secondary);
      nameGradient.addColorStop(1, template.accent);
      ctx.fillStyle = nameGradient;
      ctx.fillText(participant.name.toUpperCase(), 700, 460);
    }
    
    // "for participating in"
    ctx.fillStyle = (template.style === 'classic') ? template.secondary : 
                    (isFormal ? template.secondary : '#ffffff');
    ctx.font = `${isFormal ? 'normal' : 'normal'} ${isFormal ? '24px' : '26px'} ${template.font}`;
    ctx.fillText(isFormal ? 'for outstanding achievement in' : 'for successfully participating in', 700, 550);
    
    // Event Name
    ctx.fillStyle = textColor;
    ctx.font = `bold ${isFormal ? '38px' : '42px'} ${template.font}`;
    ctx.fillText(eventDetails.eventName, 700, 620);
    
    // Date
    ctx.fillStyle = (template.style === 'classic') ? template.secondary : 
                    (isFormal ? template.secondary : '#ffffff');
    ctx.font = `${isFormal ? 'italic' : 'normal'} ${isFormal ? '22px' : '24px'} ${template.font}`;
    ctx.fillText(`${isFormal ? 'Awarded on ' : 'Date: '}${eventDetails.date}`, 700, 720);
    
    // Bottom section - Organizer
    ctx.fillStyle = textColor;
    ctx.font = `${isFormal ? 'normal' : 'italic'} ${isFormal ? '26px' : '28px'} ${template.font}`;
    ctx.fillText(eventDetails.organizer, 700, 820);
    
    ctx.font = `${isFormal ? 'italic' : 'normal'} ${isFormal ? '18px' : '20px'} ${template.font}`;
    ctx.fillStyle = (template.style === 'classic') ? template.secondary : 
                    (isFormal ? template.secondary : '#ffffff');
    ctx.fillText(isFormal ? 'Authorized Signatory' : 'Organizer', 700, 850);
    
    // Signature line
    ctx.strokeStyle = template.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(550, 810);
    ctx.lineTo(850, 810);
    ctx.stroke();
    
    const sealX = 1150;
    const sealY = 800;
    const sealRadius = 60;
    
    const sealGradient = ctx.createRadialGradient(sealX, sealY, 0, sealX, sealY, sealRadius);
    sealGradient.addColorStop(0, template.accent);
    sealGradient.addColorStop(1, template.accent + '80');
    ctx.fillStyle = sealGradient;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = template.secondary;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = sealX + Math.cos(angle) * 40;
      const y = sealY + Math.sin(angle) * 40;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = template.accent;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('★', sealX, sealY + 6);
    
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

      const certificateData = generateCertificate(participant);
      
      // Initialize status for this participant
      newStatus[participant.id] = {
        emailStatus: 'pending',
        whatsappStatus: 'pending',
        emailError: null,
        whatsappError: null,
        timestamp: new Date()
      };

      try {
        if (method === 'email' || method === 'both') {
          try {
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
            newStatus[participant.id].emailStatus = result.success ? 'delivered' : 'bounced';
            newStatus[participant.id].emailError = result.error || null;
          } catch (error) {
            newStatus[participant.id].emailStatus = 'bounced';
            newStatus[participant.id].emailError = error.message;
          }
        }

        if (method === 'whatsapp' || method === 'both') {
          try {
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
            newStatus[participant.id].whatsappStatus = result.success ? 'delivered' : 'bounced';
            newStatus[participant.id].whatsappError = result.error || null;
          } catch (error) {
            newStatus[participant.id].whatsappStatus = 'bounced';
            newStatus[participant.id].whatsappError = error.message;
          }
        }

      } catch (error) {
        console.error(`Error sending to ${participant.name}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setDeliveryStatus(newStatus);
    setSending(false);
    setCurrentView('dashboard');
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="text-green-500" size={16} />;
      case 'bounced': return <XCircle className="text-red-500" size={16} />;
      case 'pending': return <Clock className="text-yellow-500" size={16} />;
      default: return <Clock className="text-gray-400" size={16} />;
    }
  };

  const previewCertificate = (participant) => {
    const certData = generateCertificate(participant);
    setSelectedCert({ participant, data: certData });
  };

  const previewTemplate = () => {
    const sampleParticipant = {
      name: 'John Doe',
      email: 'sample@email.com',
      phone: '9876543210'
    };
    const certData = generateCertificate(sampleParticipant);
    setShowTemplatePreview(certData);
  };

  // Generate live preview whenever template or event details change
  const updateLivePreview = () => {
    const sampleParticipant = {
      name: 'John Doe',
      email: 'sample@email.com',
      phone: '9876543210'
    };
    const certData = generateCertificate(sampleParticipant);
    setLivePreview(certData);
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left side - Form */}
              <div>
                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="Event Name (e.g., Web Development Workshop)"
                    value={eventDetails.eventName}
                    onChange={(e) => {
                      setEventDetails({...eventDetails, eventName: e.target.value});
                      setTimeout(updateLivePreview, 100);
                    }}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="date"
                    value={eventDetails.date}
                    onChange={(e) => {
                      setEventDetails({...eventDetails, date: e.target.value});
                      setTimeout(updateLivePreview, 100);
                    }}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Organizer Name"
                    value={eventDetails.organizer}
                    onChange={(e) => {
                      setEventDetails({...eventDetails, organizer: e.target.value});
                      setTimeout(updateLivePreview, 100);
                    }}
                    className="w-full p-3 border rounded-lg"
                  />
                  <select
                    value={eventDetails.template}
                    onChange={(e) => {
                      setEventDetails({...eventDetails, template: e.target.value});
                      setTimeout(updateLivePreview, 100);
                    }}
                    className="w-full p-3 border rounded-lg"
                  >
                    <optgroup label="📜 Formal Templates">
                      <option value="classic">Classic Formal - White & Black</option>
                      <option value="prestigious">Prestigious Gold - Black & Gold</option>
                      <option value="royal">Royal Certificate - Navy & Gold</option>
                    </optgroup>
                    <optgroup label="🎨 Informal Templates">
                      <option value="modern">Modern Casual - Indigo & Yellow</option>
                      <option value="vibrant">Vibrant Fun - Pink & Purple</option>
                      <option value="creative">Creative Burst - Teal & Orange</option>
                    </optgroup>
                  </select>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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

              {/* Right side - Live Preview */}
              <div>
                <div className="sticky top-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">📋 Live Preview</h3>
                    <button
                      onClick={updateLivePreview}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Eye size={16} />
                      Refresh
                    </button>
                  </div>
                  
                  <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                    {livePreview ? (
                      <div className="relative">
                        <img 
                          src={livePreview} 
                          alt="Live Preview" 
                          className="w-full rounded shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                          onClick={() => setShowTemplatePreview(livePreview)}
                        />
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Click to enlarge
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[7/5] bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Eye size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Fill in details to see preview</p>
                        </div>
                      </div>
                    )}
                    
                    {livePreview && (
                      <div className="mt-3 text-xs text-gray-600 space-y-1">
                        <p>✓ Template: <strong>{templates[eventDetails.template].name}</strong></p>
                        {eventDetails.eventName && <p>✓ Event: {eventDetails.eventName}</p>}
                        {eventDetails.date && <p>✓ Date: {eventDetails.date}</p>}
                        {eventDetails.organizer && <p>✓ Organizer: {eventDetails.organizer}</p>}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Preview updates automatically as you type
                  </p>
                </div>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => handleSendCertificates('email')}
                disabled={sending}
                className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
              >
                <Mail size={40} />
                <div>
                  <div className="text-lg font-bold">Email Only</div>
                  <div className="text-xs">Send via email</div>
                </div>
              </button>
              
              <button
                onClick={() => handleSendCertificates('whatsapp')}
                disabled={sending}
                className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
              >
                <MessageSquare size={40} />
                <div>
                  <div className="text-lg font-bold">WhatsApp Only</div>
                  <div className="text-xs">Send via WhatsApp</div>
                </div>
              </button>
              
              <button
                onClick={() => handleSendCertificates('both')}
                disabled={sending}
                className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
              >
                <Send size={40} />
                <div>
                  <div className="text-lg font-bold">Send Both</div>
                  <div className="text-xs">Email + WhatsApp</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Delivery Dashboard</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(deliveryStatus).filter(s => s.emailStatus === 'delivered').length}
                </div>
                <div className="text-xs text-gray-600">Email Delivered</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(deliveryStatus).filter(s => s.whatsappStatus === 'delivered').length}
                </div>
                <div className="text-xs text-gray-600">WhatsApp Delivered</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(deliveryStatus).filter(s => s.emailStatus === 'bounced').length}
                </div>
                <div className="text-xs text-gray-600">Email Failed</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(deliveryStatus).filter(s => s.whatsappStatus === 'bounced').length}
                </div>
                <div className="text-xs text-gray-600">WhatsApp Failed</div>
              </div>
            </div>

            <div className="space-y-3">
              {participants.map(p => {
                const status = deliveryStatus[p.id];
                return (
                  <div key={p.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-lg">{p.name}</div>
                        <div className="text-sm text-gray-500">{p.email} | {p.phone}</div>
                      </div>
                    </div>
                    
                    {status && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Email Status */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail size={16} className="text-blue-600" />
                            <span className="text-sm font-medium">Email Status</span>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            {getStatusIcon(status.emailStatus)}
                            <span className={`text-sm font-medium capitalize ${
                              status.emailStatus === 'delivered' ? 'text-green-600' :
                              status.emailStatus === 'bounced' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {status.emailStatus || 'Not Sent'}
                            </span>
                          </div>
                          {status.emailError && (
                            <div className="text-xs text-red-500 mt-1 ml-6">
                              Error: {status.emailError}
                            </div>
                          )}
                        </div>

                        {/* WhatsApp Status */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare size={16} className="text-green-600" />
                            <span className="text-sm font-medium">WhatsApp Status</span>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            {getStatusIcon(status.whatsappStatus)}
                            <span className={`text-sm font-medium capitalize ${
                              status.whatsappStatus === 'delivered' ? 'text-green-600' :
                              status.whatsappStatus === 'bounced' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {status.whatsappStatus || 'Not Sent'}
                            </span>
                          </div>
                          {status.whatsappError && (
                            <div className="text-xs text-red-500 mt-1 ml-6">
                              Error: {status.whatsappError}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!status && (
                      <div className="text-sm text-gray-500 italic">No delivery attempted yet</div>
                    )}
                  </div>
                );
              })}
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

        {/* Template Preview Modal */}
        {showTemplatePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-screen overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">Template Preview</h3>
                  <p className="text-sm text-gray-600">
                    Template: {templates[eventDetails.template].name} | Sample Certificate
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle size={28} />
                </button>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <img src={showTemplatePreview} alt="Template Preview" className="w-full rounded-lg shadow-2xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                  ← Change Template
                </button>
                <a
                  href={showTemplatePreview}
                  download={`template_preview_${eventDetails.template}.png`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center flex items-center justify-center gap-2 font-medium"
                >
                  <Download size={20} />
                  Download Preview
                </a>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> This is how your certificates will look. Once satisfied, upload your participant CSV file below to generate certificates for everyone!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateAutomationSystem;
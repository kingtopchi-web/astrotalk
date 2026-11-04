import React, { useState, useEffect, useRef } from 'react';
import { Save, Bell, Lock, Building2, XCircle, Check, ShieldCheck, Upload, Eye, CheckCircle, Clock, AlertTriangle, FileText, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/apiConfig';
import { createSocket } from '../../utils/socket';
import { compressDocumentImage } from '../../utils/imageCompressor';

const ExpertSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [showPassbookPreview, setShowPassbookPreview] = useState(false);
  const passbookInputRef = useRef(null);
  const [expertDocs, setExpertDocs] = useState([]);
  const [docRequirements, setDocRequirements] = useState([]);
  const [docVerificationStatus, setDocVerificationStatus] = useState('');
  const [docRejectionReason, setDocRejectionReason] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');
  const [uploadingDocKey, setUploadingDocKey] = useState(null);
  const docFileInputRefs = useRef({});

  const isImageDoc = (doc) => {
    if (!doc) return false;
    const type = (doc.fileType || '').toLowerCase();
    const name = (doc.fileName || '').toLowerCase();
    const data = (doc.fileData || '');
    return type.startsWith('image/') || 
      name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') ||
      data.startsWith('data:image/');
  };

  const isPdfDoc = (doc) => {
    if (!doc) return false;
    const type = (doc.fileType || '').toLowerCase();
    const name = (doc.fileName || '').toLowerCase();
    const data = (doc.fileData || '');
    return type.includes('pdf') || name.endsWith('.pdf') || data.startsWith('data:application/pdf');
  };

  useEffect(() => {
    if (!previewDocModal) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl('');
      }
      return;
    }

    if (previewDocModal.fileData && isPdfDoc(previewDocModal)) {
      try {
        const parts = previewDocModal.fileData.split(',');
        if (parts.length === 2) {
          const byteCharacters = atob(parts[1]);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
          }
          const blob = new Blob(byteArrays, { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPreviewBlobUrl(url);
          return () => {
            URL.revokeObjectURL(url);
          };
        }
      } catch (err) {
        console.warn('PDF blob generation error in ExpertSettings:', err);
      }
    }
  }, [previewDocModal]);

  const handleDownloadPreviewDoc = (doc) => {
    if (!doc || !doc.fileData) return;
    const a = document.createElement('a');
    a.href = doc.fileData;
    a.download = doc.fileName || `${doc.docKey || 'document'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fetchExpertDocuments = async () => {
    try {
      setLoadingDocs(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl('/expert/documents'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpertDocs(res.data.documents || []);
      setDocRequirements(res.data.requirements || []);
      setDocVerificationStatus(res.data.verificationStatus || '');
      setDocRejectionReason(res.data.rejectionReason || '');
    } catch (err) {
      console.error('Failed to load expert documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchExpertDocuments();
  }, []);

  const handleUploadOrReplaceDoc = async (reqItem, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDocKey(reqItem.docKey);
    try {
      let fileData = '';
      const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

      if (isImg) {
        // Automatically compress image <= 1MB while preserving sharp document readability
        const compressed = await compressDocumentImage(file);
        fileData = compressed.dataUrl;
      } else {
        // PDF or other documents: check 5MB max
        const maxMb = reqItem.maxFileSizeMb || 5;
        if (file.size > maxMb * 1024 * 1024) {
          setStatusMessage({ type: 'error', text: `File size exceeds ${maxMb}MB limit.` });
          setUploadingDocKey(null);
          return;
        }
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const token = localStorage.getItem('token');
      const res = await axios.post(getApiUrl('/expert/documents/upload'), {
        requirementId: reqItem._id,
        docKey: reqItem.docKey,
        docName: reqItem.name,
        fileName: file.name,
        fileData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMessage({ type: 'success', text: res.data.message || 'Document uploaded successfully!' });
      fetchExpertDocuments();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Failed to upload document' });
    } finally {
      setUploadingDocKey(null);
    }
  };

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notificationPreferences: {
      email: true,
      push: true
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      passbookImage: '',
      verificationStatus: 'NOT_SUBMITTED',
      rejectionReason: ''
    }
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        notificationPreferences: user.notificationPreferences || { email: true, push: true },
        bankDetails: {
          accountName: user.bankDetails?.accountName || '',
          accountNumber: user.bankDetails?.accountNumber || '',
          ifscCode: user.bankDetails?.ifscCode || '',
          bankName: user.bankDetails?.bankName || '',
          passbookImage: user.bankDetails?.passbookImage || '',
          verificationStatus: user.bankDetails?.verificationStatus || 'NOT_SUBMITTED',
          rejectionReason: user.bankDetails?.rejectionReason || ''
        }
      }));
    }
  }, [user]);

  // Real-time socket listener for bank verification updates from Admin
  useEffect(() => {
    if (!user?._id) return;
    let socket = null;
    try {
      socket = createSocket();
      socket.emit('join_user', user._id);
      socket.on('document_status_changed', (data) => {
        fetchExpertDocuments();
        setStatusMessage({
          type: data.status === 'VERIFIED' ? 'success' : 'error',
          text: data.message || `Document status updated: ${data.status}`
        });
      });
      socket.on('expert_status_updated', (data) => {
        if (updateUser) {
          updateUser({ verificationStatus: data.verificationStatus });
        }
        setStatusMessage({
          type: data.verificationStatus === 'APPROVED' ? 'success' : 'error',
          text: data.message || `Application status: ${data.verificationStatus}`
        });
      });
      socket.on('bank_status_updated', (data) => {
        if (data?.bankDetails) {
          setFormData(prev => ({
            ...prev,
            bankDetails: {
              ...prev.bankDetails,
              ...data.bankDetails
            }
          }));
          if (updateUser) {
            updateUser({ bankDetails: data.bankDetails });
          }
          setStatusMessage({
            type: data.verificationStatus === 'APPROVED' ? 'success' : 'error',
            text: data.message || `Bank verification status: ${data.verificationStatus}`
          });
        }
      });
    } catch (err) {
      console.warn('ExpertSettings socket error:', err);
    }

    return () => {
      if (socket) {
        socket.off('bank_status_updated');
        socket.disconnect();
      }
    };
  }, [user?._id, updateUser]);

  const handlePassbookUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Automatically compress passbook image to <= 1MB while preserving bank details legibility
        const compressed = await compressDocumentImage(file);
        setFormData(prev => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            passbookImage: compressed.dataUrl
          }
        }));
        setStatusMessage({ type: 'success', text: 'Passbook image selected & optimized (<1MB). Click "Save & Submit Bank Details" to submit.' });
      } catch (err) {
        console.error('Passbook compression error:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            bankDetails: {
              ...prev.bankDetails,
              passbookImage: reader.result
            }
          }));
          setStatusMessage({ type: 'success', text: 'Passbook image selected. Click "Save & Submit Bank Details" to submit.' });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleChange = (e, section) => {
    let { name, value, type, checked } = e.target;
    
    if (name === 'ifscCode') {
      value = (value || '').toUpperCase().replace(/\s+/g, '');
    }

    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (section) => {
    try {
      setLoading(true);
      setStatusMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      
      let payload = {};
      if (section === 'notifications') {
        payload = { notificationPreferences: formData.notificationPreferences };
      } else if (section === 'security') {
        if (!formData.currentPassword || !formData.newPassword) {
          setStatusMessage({ type: 'error', text: 'Please fill in both current and new password' });
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setStatusMessage({ type: 'error', text: 'New passwords do not match' });
          setLoading(false);
          return;
        }
        payload = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        };
      } else if (section === 'bank') {
        const b = formData.bankDetails;
        if (!b.accountName?.trim() || !b.accountNumber?.trim() || !b.bankName?.trim() || !b.ifscCode?.trim()) {
          setStatusMessage({ type: 'error', text: 'Please fill in Account Holder Name, Bank Name, Account Number, and IFSC Code.' });
          setLoading(false);
          return;
        }
        const cleanIfsc = (b.ifscCode || '').replace(/\s+/g, '').toUpperCase();
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(cleanIfsc)) {
          setStatusMessage({
            type: 'error',
            text: 'Invalid IFSC Code format. An IFSC must be an 11-character code (e.g. HDFC0001234, SBIN0000691, or test IFSC RAZR0000001).'
          });
          setLoading(false);
          return;
        }
        if (!b.passbookImage) {
          setStatusMessage({ type: 'error', text: 'Bank Passbook / Cheque image is strictly required for verification.' });
          setLoading(false);
          return;
        }
        payload = {
          bankDetails: {
            ...formData.bankDetails,
            ifscCode: cleanIfsc
          }
        };
      }

      const res = await axios.put(getApiUrl('/experts/settings'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const successMsg = section === 'bank' 
        ? 'Bank details submitted successfully! Your details & passbook are now pending Admin verification.' 
        : (res.data.message || 'Settings updated successfully');
      setStatusMessage({ type: 'success', text: successMsg });

      if (section === 'bank' && res.data?.expert?.bankDetails) {
        setFormData(prev => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            ...res.data.expert.bankDetails
          }
        }));
      }

      if (section === 'security') {
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences, security, and payout methods</p>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in ${
          statusMessage.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="font-bold text-xs hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col md:flex-row w-full">
        {/* Sidebar tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-[#FAF8F5] flex md:flex-col p-4 sm:p-5 gap-2 shrink-0 overflow-x-auto">
          <button 
            type="button"
            onClick={() => {
              setActiveTab('notifications');
              setStatusMessage({ type: '', text: '' });
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setActiveTab('security');
              setStatusMessage({ type: '', text: '' });
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Lock size={18} />
            <span>Security & Password</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setActiveTab('documents');
              setStatusMessage({ type: '', text: '' });
              fetchExpertDocuments();
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer ${
              activeTab === 'documents' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText size={18} />
            <span>Verification Documents</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setActiveTab('bank');
              setStatusMessage({ type: '', text: '' });
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer ${
              activeTab === 'bank' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Building2 size={18} />
            <span>Bank Details</span>
          </button>
        </div>

        {/* Content area: Expands to fill full width naturally */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 min-w-0 w-full">
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 w-full">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Notification Preferences</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Control how you receive booking alerts and message updates.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white cursor-pointer hover:border-amber-300 transition-all shadow-2xs">
                  <div className="flex items-center h-5 mt-1">
                    <input 
                      type="checkbox" 
                      name="email"
                      checked={formData.notificationPreferences.email}
                      onChange={(e) => handleChange(e, 'notificationPreferences')}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 accent-amber-600 cursor-pointer" 
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Email Notifications</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">Receive emails for new bookings, messages, and payout updates.</div>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white cursor-pointer hover:border-amber-300 transition-all shadow-2xs">
                  <div className="flex items-center h-5 mt-1">
                    <input 
                      type="checkbox" 
                      name="push"
                      checked={formData.notificationPreferences.push}
                      onChange={(e) => handleChange(e, 'notificationPreferences')}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 accent-amber-600 cursor-pointer" 
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Push Notifications</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">Receive instant browser alerts when a client calls or joins.</div>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleSave('notifications')} 
                  disabled={loading} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-70 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 w-full">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Security & Password</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Update your account password to maintain security.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={formData.currentPassword} 
                    onChange={handleChange} 
                    placeholder="Enter current password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                    placeholder="Enter new password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="Repeat new password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleSave('security')} 
                  disabled={loading} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-70 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>{loading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Verification Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6 w-full">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Category Verification Documents</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage qualification certificates and statutory licenses required for your category.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchExpertDocuments}
                  disabled={loadingDocs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Clock size={13} className={loadingDocs ? 'animate-spin' : ''} />
                  <span>Refresh Documents</span>
                </button>
              </div>

              {/* Status Banner */}
              {docVerificationStatus === 'APPROVED' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Application & Documents Approved</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      All required qualification documents are verified by Administrator. Your account is approved and live for consultations.
                    </p>
                  </div>
                </div>
              )}

              {docVerificationStatus === 'REJECTED' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Application / Document Verification Rejected</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Reason: <span className="font-semibold">{docRejectionReason || 'Please inspect rejected documents below and upload certified copies.'}</span>
                    </p>
                    <p className="text-xs text-rose-600 mt-1">Re-upload the required valid documents below to re-submit for review.</p>
                  </div>
                </div>
              )}

              {(!docVerificationStatus || docVerificationStatus === 'PENDING') && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Document Verification Under Review</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your category documents are submitted and pending Administrator review. Bookings will become active once approved.
                    </p>
                  </div>
                </div>
              )}

              {/* Requirements & Uploaded Documents List */}
              {loadingDocs ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading your verification documents...</div>
              ) : (docRequirements.length === 0 && expertDocs.length === 0) ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No Specific Category Documents Configured</p>
                  <p className="text-slate-400 mt-1">Your registered category does not require custom mandatory qualification documents at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(docRequirements.length > 0 ? docRequirements : expertDocs).map((reqItem) => {
                    const doc = expertDocs.find(d => 
                      d.docKey === reqItem.docKey || 
                      (d.requirementId && d.requirementId.toString() === reqItem._id?.toString())
                    ) || (reqItem.fileData ? reqItem : null);

                    const status = doc?.status || 'NOT_SUBMITTED';
                    const isUploading = uploadingDocKey === (reqItem.docKey || doc?.docKey);

                    return (
                      <div
                        key={reqItem._id || reqItem.docKey}
                        className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white hover:border-slate-300 transition-all shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">{reqItem.name || doc?.docName}</h4>
                              {reqItem.isMandatory ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                  Mandatory *
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  Optional
                                </span>
                              )}

                              {/* Status Badge */}
                              {status === 'VERIFIED' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check size={12} /> Verified by Admin
                                </span>
                              )}
                              {status === 'PENDING' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock size={12} /> Under Review
                                </span>
                              )}
                              {status === 'REUPLOAD_REQUIRED' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                  <AlertTriangle size={12} /> Re-upload Required
                                </span>
                              )}
                              {status === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                  <XCircle size={12} /> Rejected
                                </span>
                              )}
                              {status === 'NOT_SUBMITTED' && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                  Not Uploaded
                                </span>
                              )}
                            </div>

                            {reqItem.description && (
                              <p className="text-xs text-slate-600">{reqItem.description}</p>
                            )}

                            <p className="text-[11px] text-slate-400">
                              Accepted: {(reqItem.allowedFormats || ['pdf', 'jpg', 'jpeg', 'png']).join(', ').toUpperCase()} • Max Size: {reqItem.maxFileSizeMb || 5}MB
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {doc && (
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal(doc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-slate-700 text-xs font-semibold cursor-pointer transition shadow-xs"
                              >
                                <Eye size={13} />
                                <span>View Document</span>
                              </button>
                            )}

                            {/* Hidden file input */}
                            <input
                              type="file"
                              ref={el => docFileInputRefs.current[reqItem.docKey] = el}
                              onChange={e => handleUploadOrReplaceDoc(reqItem, e)}
                              accept="application/pdf,image/jpeg,image/png,image/jpg"
                              className="hidden"
                            />

                            <button
                              type="button"
                              onClick={() => docFileInputRefs.current[reqItem.docKey]?.click()}
                              disabled={isUploading}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                doc 
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' 
                                  : 'bg-[#D97706] hover:bg-[#B45309] text-white'
                              } disabled:opacity-60`}
                            >
                              <Upload size={13} className={isUploading ? 'animate-bounce' : ''} />
                              <span>{isUploading ? 'Uploading...' : doc ? 'Re-upload / Replace' : 'Upload Document'}</span>
                            </button>
                          </div>
                        </div>

                        {/* If Rejection Reason exists */}
                        {(status === 'REJECTED' || status === 'REUPLOAD_REQUIRED') && doc?.rejectionReason && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                            <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Admin Feedback: </span>
                              <span>{doc.rejectionReason}</span>
                            </div>
                          </div>
                        )}

                        {/* Uploaded Document Info Strip */}
                        {doc && (
                          <div className="bg-slate-50 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-slate-600 border border-slate-100">
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={14} className="text-amber-600 shrink-0" />
                              <span className="font-medium truncate">{doc.fileName}</span>
                              {doc.fileSize ? <span className="text-slate-400">({(doc.fileSize / 1024).toFixed(0)} KB)</span> : null}
                            </div>
                            {doc.uploadedAt && (
                              <span className="text-[11px] text-slate-400 shrink-0">
                                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-6 w-full">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Bank Details (Payouts)</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Add your verified bank account and passbook image to receive automated consultation payouts.</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck size={14} />
                  <span>Direct NEFT/IMPS</span>
                </span>
              </div>

              {/* Dynamic Bank Verification Status Alert */}
              {formData.bankDetails.verificationStatus === 'APPROVED' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Bank Details Verified & Approved</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">Your bank account has been verified by Administrator. Automated consultation payouts will be sent to this account. Note: Any modification will re-trigger the verification review.</p>
                  </div>
                </div>
              )}

              {formData.bankDetails.verificationStatus === 'PENDING' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Verification Pending with Administrator</h4>
                    <p className="text-xs text-amber-700 mt-0.5">Your bank details and passbook image have been submitted and are under review by Admin. Payouts will be enabled once approved.</p>
                  </div>
                </div>
              )}

              {formData.bankDetails.verificationStatus === 'REJECTED' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Bank Details Verification Rejected</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Reason: <span className="font-semibold">{formData.bankDetails.rejectionReason || 'Documents could not be verified.'}</span>
                    </p>
                    <p className="text-xs text-rose-600 mt-1">Please correct your details and re-upload a clear Bank Passbook / Cancelled Cheque image to re-submit.</p>
                  </div>
                </div>
              )}

              {(!formData.bankDetails.verificationStatus || formData.bankDetails.verificationStatus === 'NOT_SUBMITTED') && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                  <Building2 className="text-blue-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">Submit Bank Details & Passbook</h4>
                    <p className="text-xs text-blue-700 mt-0.5">Please provide your bank details along with a clear Passbook image. All bank submissions require Admin verification before payouts can be requested.</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="accountName" 
                    value={formData.bankDetails.accountName} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                    placeholder="e.g. Ramesh Kumar" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="bankName" 
                    value={formData.bankDetails.bankName} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                    placeholder="e.g. HDFC Bank" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="accountNumber" 
                    value={formData.bankDetails.accountNumber} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                    placeholder="Enter Bank Account Number" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="ifscCode" 
                    value={formData.bankDetails.ifscCode} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800 uppercase" 
                    placeholder="e.g. HDFC0001234 or RAZR0000001" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    11-digit code (e.g. HDFC0001234). For Razorpay test mode, use test IFSC: <code className="text-amber-700 font-bold">RAZR0000001</code>
                  </p>
                </div>

                {/* Bank Passbook Image Upload (Required) */}
                <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Bank Passbook / Cancelled Cheque Image <span className="text-red-500">* Required</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">Upload a clear photo showing Account Number, Name & IFSC code (Max 5MB, JPG/PNG).</p>
                    </div>
                    <input 
                      type="file" 
                      ref={passbookInputRef} 
                      onChange={handlePassbookUpload} 
                      accept="image/jpeg,image/png,image/webp,image/jpg" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => passbookInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:border-amber-500 text-slate-700 hover:text-amber-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>{formData.bankDetails.passbookImage ? 'Change Passbook Image' : 'Upload Passbook Image'}</span>
                    </button>
                  </div>

                  {formData.bankDetails.passbookImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white p-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={formData.bankDetails.passbookImage} 
                          alt="Passbook" 
                          className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                        />
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check size={12} /> Passbook Attached
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Image uploaded and ready for Admin verification</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassbookPreview(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        <Eye size={13} />
                        <span>View Image</span>
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => passbookInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-5 text-center cursor-pointer bg-white transition-colors"
                    >
                      <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-700">Click to upload Bank Passbook / Cheque Image *</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 5MB (Required for verification)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 italic">
                  * Note: Saving or editing bank details will submit them to Admin for review.
                </p>
                <button 
                  type="button"
                  onClick={() => handleSave('bank')} 
                  disabled={loading} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-70 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>{loading ? 'Submitting...' : 'Save & Submit for Verification'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Passbook Lightbox Preview Modal */}
          {showPassbookPreview && formData.bankDetails.passbookImage && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-3 border border-slate-200 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={16} className="text-amber-600" />
                    <span>Bank Passbook Document Preview</span>
                  </h3>
                  <button 
                    onClick={() => setShowPassbookPreview(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <img 
                    src={formData.bankDetails.passbookImage} 
                    alt="Passbook Full Preview" 
                    className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs" 
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowPassbookPreview(false)}
                    className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Lightbox Preview Modal */}
          {previewDocModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-4 space-y-3 border border-slate-200 shadow-2xl flex flex-col max-h-[92vh]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={16} className="text-amber-600" />
                    <span>{previewDocModal.docName || previewDocModal.fileName}</span>
                  </h3>
                  <button 
                    onClick={() => { setPreviewDocModal(null); setPreviewBlobUrl(''); }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2 border border-slate-100 min-h-[380px]">
                  {isImageDoc(previewDocModal) ? (
                    <img 
                      src={previewDocModal.fileData || `${getApiUrl('')}/documents/${previewDocModal._id}/file`} 
                      alt="Document Preview" 
                      className="max-h-[70vh] w-auto object-contain rounded-lg shadow-xs" 
                    />
                  ) : (
                    <iframe
                      src={previewBlobUrl || previewDocModal.fileData || `${getApiUrl('')}/documents/${previewDocModal._id}/file`}
                      title="Document Preview"
                      className="w-full h-[70vh] rounded-lg border-0 bg-white"
                    />
                  )}
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDownloadPreviewDoc(previewDocModal)}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Download File
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setPreviewDocModal(null); setPreviewBlobUrl(''); }}
                    className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ExpertSettings;

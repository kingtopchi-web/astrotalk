import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardList, Search, CheckCircle, XCircle, Eye, ChevronLeft,
  ChevronRight, RefreshCw, X, AlertCircle, FileText, Clock
} from 'lucide-react';

import { ADMIN_API_URL } from '../utils/apiConfig';

const API = ADMIN_API_URL;

const VerifBadge = ({ status }) => {
  const map = {
    PENDING:  'bg-orange-50 text-orange-700 border-orange-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
// ── Detail Modal with Category Document Verification ───────────────────────────
const DetailModal = ({ expert, onClose, onAction }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);

  // Document verification states
  const [docsData, setDocsData] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeDocAction, setActiveDocAction] = useState(null); // { docId, type: 'reject' | 'reupload' | 'notes', text: '' }
  const [docActionLoading, setDocActionLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');

  const token = localStorage.getItem('adminToken');

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
    if (!previewDoc) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl('');
      }
      return;
    }

    if (previewDoc.fileData && isPdfDoc(previewDoc)) {
      try {
        const parts = previewDoc.fileData.split(',');
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
        console.warn('PDF blob generation error:', err);
      }
    }
  }, [previewDoc]);

  const handleDownloadPreviewDoc = () => {
    if (!previewDoc) return;
    if (previewDoc.fileData) {
      const a = document.createElement('a');
      a.href = previewDoc.fileData;
      a.download = previewDoc.fileName || `${previewDoc.docKey || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const streamUrl = `${API.replace('/admin', '')}/documents/${previewDoc._id}/file?token=${token}`;
    window.open(streamUrl, '_blank');
  };

  const fetchExpertDocs = async () => {
    try {
      setLoadingDocs(true);
      const res = await axios.get(`${API}/experts/${expert._id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocsData(res.data);
    } catch (e) {
      console.error('Failed to load expert documents:', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchExpertDocs();
  }, [expert._id]);

  const handleVerifySingleDoc = async (documentId) => {
    setDocActionLoading(true);
    try {
      await axios.patch(`${API}/experts/${expert._id}/documents/${documentId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchExpertDocs();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to verify document');
    } finally {
      setDocActionLoading(false);
    }
  };

  const handleDocActionSubmit = async () => {
    if (!activeDocAction) return;
    const { docId, type, text } = activeDocAction;
    if (!text.trim() && type !== 'notes') {
      alert(type === 'reject' ? 'Rejection reason is required.' : 'Re-upload instructions are required.');
      return;
    }

    setDocActionLoading(true);
    try {
      if (type === 'reject') {
        await axios.patch(`${API}/experts/${expert._id}/documents/${docId}/reject`, { reason: text.trim() }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (type === 'reupload') {
        await axios.patch(`${API}/experts/${expert._id}/documents/${docId}/request-reupload`, { instructions: text.trim() }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (type === 'notes') {
        await axios.patch(`${API}/experts/${expert._id}/documents/${docId}/notes`, { adminNotes: text.trim() }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setActiveDocAction(null);
      await fetchExpertDocs();
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    } finally {
      setDocActionLoading(false);
    }
  };

  const approve = async () => {
    if (docsData && !docsData.summary?.allMandatoryVerified) {
      alert('Cannot approve expert: All mandatory category qualification documents must be verified first.');
      return;
    }

    setLoading(true);
    try {
      await axios.patch(`${API}/experts/${expert._id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      onAction(expert._id, 'APPROVED');
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to approve');
    } finally { setLoading(false); }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return alert('Please enter an overall application rejection reason.');
    setLoading(true);
    try {
      await axios.patch(`${API}/experts/${expert._id}/reject`, { reason: rejectReason.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      onAction(expert._id, 'REJECTED');
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reject');
    } finally { setLoading(false); }
  };

  const canApprove = docsData ? Boolean(docsData.summary?.allMandatoryVerified) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Expert Application Review</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Profile Header */}
          <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <img
              src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || 'E')}&background=ea580c&color=fff&size=64`}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
              alt=""
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-bold text-slate-900 truncate">{expert.name}</h4>
                <VerifBadge status={expert.verificationStatus} />
              </div>
              <p className="text-xs text-slate-500 truncate">{expert.email} • {expert.mobile || 'No mobile'}</p>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                <span className="font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  Category: {expert.categoryId?.name || docsData?.expert?.category?.name || 'General'}
                </span>
                {(expert.subCategoryId?.name || docsData?.expert?.subCategory?.name) && (
                  <span className="font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                    Sub: {expert.subCategoryId?.name || docsData?.expert?.subCategory?.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Specialty', value: expert.specialty },
              { label: 'Country', value: expert.country || docsData?.expert?.country || 'India' },
              { label: 'Languages', value: Array.isArray(expert.languages) ? expert.languages.join(', ') : (Array.isArray(docsData?.expert?.languages) ? docsData.expert.languages.join(', ') : 'English, Hindi') },
              { label: 'Experience', value: expert.experience },
              { label: 'Qualification', value: expert.qualification },
              { label: 'Applied On', value: expert.createdAt ? new Date(expert.createdAt).toLocaleDateString() : 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{label}</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">{value || <span className="text-slate-400 italic">N/A</span>}</p>
              </div>
            ))}
          </div>

          {expert.bio && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bio</p>
              <p className="text-xs text-slate-700 leading-relaxed">{expert.bio}</p>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              CATEGORY QUALIFICATION DOCUMENTS SECTION
             ───────────────────────────────────────────────────────────── */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText size={15} className="text-amber-600" />
                  <span>Category Qualification Documents</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify mandatory credentials, degrees, and licenses before approving application.
                </p>
              </div>

              {docsData && (
                <div className="shrink-0">
                  {docsData.summary?.allMandatoryVerified ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle size={13} /> All {docsData.summary.mandatoryRequirements} Mandatory Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock size={13} /> {docsData.summary?.mandatoryVerified || 0} / {docsData.summary?.mandatoryRequirements || 0} Mandatory Verified
                    </span>
                  )}
                </div>
              )}
            </div>

            {loadingDocs ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin text-amber-500" />
                <span>Loading submitted documents...</span>
              </div>
            ) : !docsData || docsData.checklist?.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                No category document requirements configured.
              </div>
            ) : (
              <div className="space-y-3">
                {docsData.checklist.map(({ requirement: reqItem, uploadedDocument: doc, isUploaded, status }) => {
                  const isActionOpen = activeDocAction && activeDocAction.docId === doc?._id;

                  return (
                    <div
                      key={reqItem.docKey}
                      className={`rounded-xl border p-3.5 space-y-3 transition ${
                        status === 'VERIFIED'
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : status === 'REJECTED'
                            ? 'bg-rose-50/30 border-rose-200'
                            : status === 'REUPLOAD_REQUIRED'
                              ? 'bg-purple-50/30 border-purple-200'
                              : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900">{reqItem.name}</h5>
                            {reqItem.isMandatory ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                Mandatory *
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Optional
                              </span>
                            )}
                          </div>
                          {reqItem.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{reqItem.description}</p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {status === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              <CheckCircle size={12} /> Verified
                            </span>
                          )}
                          {status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              <Clock size={12} /> Pending Review
                            </span>
                          )}
                          {status === 'UNDER_REVIEW' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                              <Clock size={12} /> Under Review
                            </span>
                          )}
                          {status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                              <XCircle size={12} /> Rejected
                            </span>
                          )}
                          {status === 'REUPLOAD_REQUIRED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                              <AlertCircle size={12} /> Re-upload Requested
                            </span>
                          )}
                          {status === 'NOT_SUBMITTED' && (
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-200 px-2.5 py-0.5 rounded-full">
                              Not Uploaded
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Uploaded File Info and Actions */}
                      {isUploaded && doc && (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="truncate text-slate-600">
                            <span className="font-semibold text-slate-800">{doc.fileName}</span>
                            {doc.fileSize ? ` • ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                            {doc.uploadedAt ? ` • ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            {/* View / Download */}
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              <Eye size={12} /> View Document
                            </button>

                            {/* Verify Action */}
                            {status !== 'VERIFIED' && (
                              <button
                                type="button"
                                onClick={() => handleVerifySingleDoc(doc._id)}
                                disabled={docActionLoading}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1 cursor-pointer transition disabled:opacity-60"
                              >
                                <CheckCircle size={12} /> Verify
                              </button>
                            )}

                            {/* Request Re-upload */}
                            <button
                              type="button"
                              onClick={() => setActiveDocAction(isActionOpen && activeDocAction.type === 'reupload' ? null : { docId: doc._id, type: 'reupload', text: '' })}
                              className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg cursor-pointer transition"
                            >
                              Request Re-upload
                            </button>

                            {/* Reject Action */}
                            <button
                              type="button"
                              onClick={() => setActiveDocAction(isActionOpen && activeDocAction.type === 'reject' ? null : { docId: doc._id, type: 'reject', text: '' })}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition"
                            >
                              Reject
                            </button>

                            {/* Notes Action */}
                            <button
                              type="button"
                              onClick={() => setActiveDocAction(isActionOpen && activeDocAction.type === 'notes' ? null : { docId: doc._id, type: 'notes', text: doc.adminNotes || '' })}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                              title="Internal Notes"
                            >
                              Notes
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display Rejection / Note Details */}
                      {doc?.rejectionReason && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-lg">
                          <span className="font-bold">Reason / Note: </span>
                          <span>{doc.rejectionReason}</span>
                        </div>
                      )}
                      {doc?.adminNotes && !isActionOpen && (
                        <div className="bg-slate-100 border border-slate-200 text-slate-700 text-xs p-2 rounded-lg">
                          <span className="font-bold">Internal Admin Note: </span>
                          <span>{doc.adminNotes}</span>
                        </div>
                      )}

                      {/* Inline Input Box for Reject, Re-upload, or Notes */}
                      {isActionOpen && (
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            {activeDocAction.type === 'reject' && 'Mandatory Document Rejection Reason:'}
                            {activeDocAction.type === 'reupload' && 'Document Re-upload Instructions for Expert:'}
                            {activeDocAction.type === 'notes' && 'Internal Admin Notes (Private):'}
                          </label>
                          <textarea
                            rows={2}
                            value={activeDocAction.text}
                            onChange={(e) => setActiveDocAction({ ...activeDocAction, text: e.target.value })}
                            placeholder={
                              activeDocAction.type === 'reject'
                                ? 'e.g. Expired registration or blurry image...'
                                : activeDocAction.type === 'reupload'
                                  ? 'e.g. Please upload clear color scan of full degree certificate...'
                                  : 'Internal observation notes...'
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveDocAction(null)}
                              className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleDocActionSubmit}
                              disabled={docActionLoading}
                              className={`px-4 py-1 rounded-lg text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer ${
                                activeDocAction.type === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-900'
                              }`}
                            >
                              {docActionLoading ? 'Saving...' : 'Submit'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bank Details & Passbook */}
          {expert.bankDetails && expert.bankDetails.accountNumber && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bank Details & Passbook</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  expert.bankDetails.verificationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                  expert.bankDetails.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                  expert.bankDetails.verificationStatus === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  Bank: {expert.bankDetails.verificationStatus || 'NOT_SUBMITTED'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Holder:</span> <span className="font-semibold text-slate-800">{expert.bankDetails.accountName || '—'}</span></div>
                <div><span className="text-slate-400">Bank:</span> <span className="font-semibold text-slate-800">{expert.bankDetails.bankName || '—'}</span></div>
                <div><span className="text-slate-400">A/C:</span> <span className="font-mono text-slate-800">{expert.bankDetails.accountNumber || '—'}</span></div>
                <div><span className="text-slate-400">IFSC:</span> <span className="font-mono text-slate-800">{expert.bankDetails.ifscCode || '—'}</span></div>
              </div>
              {expert.bankDetails.passbookImage && (
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Passbook Image Attached</span>
                  <a
                    href={expert.bankDetails.passbookImage}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    View Document
                  </a>
                </div>
              )}
            </div>
          )}

          {expert.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-[10px] text-red-500 font-semibold uppercase mb-1">Previous Rejection Reason</p>
              <p className="text-sm text-red-700">{expert.rejectionReason}</p>
            </div>
          )}

          {/* Overall Application Rejection */}
          {showReject && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700">Application Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 outline-none focus:border-red-500 resize-none"
                placeholder="Explain why this entire expert application is being rejected..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReject(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={reject}
                  disabled={loading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Confirm Reject Application'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        {expert.verificationStatus === 'PENDING' && !showReject && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-50/50">
            <div>
              {!canApprove ? (
                <p className="text-xs text-amber-700 font-semibold">
                  * Verify all mandatory documents above to enable final approval.
                </p>
              ) : (
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle size={14} /> All mandatory documents verified. Ready for approval.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowReject(true)}
                disabled={loading}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition disabled:opacity-60 cursor-pointer"
              >
                Reject Application
              </button>

              <button
                type="button"
                onClick={approve}
                disabled={loading || !canApprove}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                title={!canApprove ? 'All mandatory qualification documents must be verified first' : 'Approve Expert'}
              >
                <CheckCircle size={15} />
                <span>{loading ? 'Processing...' : 'Approve Expert'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Fullscreen / Preview Lightbox */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 space-y-3 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">{previewDoc.docName || previewDoc.fileName}</h3>
              </div>
              <button 
                onClick={() => { setPreviewDoc(null); setPreviewBlobUrl(''); }} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2 border border-slate-100 min-h-[380px]">
              {isImageDoc(previewDoc) ? (
                <img
                  src={previewDoc.fileData || `${API.replace('/admin', '')}/documents/${previewDoc._id}/file?token=${token}`}
                  alt={previewDoc.docName || previewDoc.fileName}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-xs"
                />
              ) : (
                <iframe
                  src={previewBlobUrl || `${API.replace('/admin', '')}/documents/${previewDoc._id}/file?token=${token}`}
                  title="Admin Document Preview"
                  className="w-full h-[70vh] rounded-lg border-0 bg-white"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPreviewDoc}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
                >
                  Download / Save File
                </button>
                <a
                  href={previewBlobUrl || `${API.replace('/admin', '')}/documents/${previewDoc._id}/file?token=${token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                >
                  Open in New Window
                </a>
              </div>
              <button
                type="button"
                onClick={() => { setPreviewDoc(null); setPreviewBlobUrl(''); }}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default function ExpertApplications() {
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get('search');
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParam || '');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [selected, setSelected] = useState(null);

  const token = localStorage.getItem('adminToken');
  const limit = 15;

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit, verificationStatus: statusFilter };
      if (search) params.search = search;

      const res = await axios.get(`${API}/experts`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setExperts(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);

      // Also fetch counts for tabs
      const [p, a, r] = await Promise.all([
        axios.get(`${API}/experts`, { headers: { Authorization: `Bearer ${token}` }, params: { verificationStatus: 'PENDING', limit: 1 } }),
        axios.get(`${API}/experts`, { headers: { Authorization: `Bearer ${token}` }, params: { verificationStatus: 'APPROVED', limit: 1 } }),
        axios.get(`${API}/experts`, { headers: { Authorization: `Bearer ${token}` }, params: { verificationStatus: 'REJECTED', limit: 1 } }),
      ]);
      setCounts({ PENDING: p.data.total, APPROVED: a.data.total, REJECTED: r.data.total });
    } catch (e) {
      setError('Failed to load applications.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (searchParam !== null && searchParam !== undefined) {
      setSearch(searchParam);
      setPage(1);
    }
  }, [searchParam]);

  useEffect(() => { fetchData(); }, [page, statusFilter]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleAction = (id, newStatus) => {
    setExperts(prev => prev.map(e => e._id === id ? { ...e, verificationStatus: newStatus } : e));
    setCounts(prev => ({
      ...prev,
      PENDING: newStatus !== 'PENDING' ? Math.max(0, prev.PENDING - 1) : prev.PENDING,
      [newStatus]: (prev[newStatus] || 0) + 1,
    }));
  };

  const TABS = [
    { key: 'PENDING', label: 'Pending', color: 'orange' },
    { key: 'APPROVED', label: 'Approved', color: 'green' },
    { key: 'REJECTED', label: 'Rejected', color: 'red' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Expert Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review and manage expert verification requests</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${statusFilter === tab.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? (tab.color === 'orange' ? 'bg-orange-100 text-orange-700' : tab.color === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'bg-slate-200 text-slate-600'}`}>
              {counts[tab.key] ?? '—'}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 max-w-sm">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
          />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-400" /></button>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {error ? (
          <div className="p-12 text-center">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchData} className="text-sm text-blue-600 hover:underline">Try again</button>
          </div>
        ) : loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : experts.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No {statusFilter.toLowerCase()} applications</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Expert</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Specialty</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Experience</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Applied</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Status</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {experts.map(e => (
                    <tr key={e._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={e.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name || 'E')}&background=ea580c&color=fff&size=36`}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{e.name}</p>
                            <p className="text-xs text-slate-400">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{e.specialty || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{e.experience || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
                      </td>
                      <td className="px-4 py-3"><VerifBadge status={e.verificationStatus} /></td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelected(e)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Page {page} of {totalPages} — {total} total</p>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                    <ChevronLeft size={14} />
                  </button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <DetailModal expert={selected} onClose={() => setSelected(null)} onAction={handleAction} />
      )}
    </div>
  );
}

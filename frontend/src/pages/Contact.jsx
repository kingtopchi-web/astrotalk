import React, { useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { getApiUrl } from '../utils/apiConfig';

export default function Contact() {
  const { supportEmail, contactPhone, address, platformName } = usePlatformSettings();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    if (!fullName) {
      setStatus({ type: 'error', text: 'Please provide your name.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(getApiUrl('/public/contact'), {
        name: fullName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim() || 'General Inquiry',
        message: formData.message.trim()
      });

      setStatus({
        type: 'success',
        text: response.data?.message || 'Message sent successfully! We will get back to you soon.'
      });

      // Clear the form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Contact submit error:', err);
      const errorMsg =
        err.response?.data?.message ||
        'Unable to send message right now. Please check your connection or contact us directly via email.';
      setStatus({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans overflow-x-hidden">
      <Header />
      
      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 relative">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Touch</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Have questions about {platformName || 'ExpertHub'}? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 bg-white rounded-[2.5rem] shadow-xl overflow-hidden max-w-6xl mx-auto border border-slate-100">
            {/* Contact Info Panel */}
            <div className="lg:w-2/5 relative p-10 md:p-12 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>

              <div className="relative z-10 h-full flex flex-col">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
                  <p className="text-slate-300 mb-12 text-lg">
                    Fill out the form and our friendly team will get back to you within 24 hours.
                  </p>
                </div>
                
                <div className="space-y-8 flex-1">
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
                      <Mail className="text-blue-300" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Email us</p>
                      <a href={`mailto:${supportEmail || 'support@stitchplatform.com'}`} className="font-medium text-lg hover:underline break-all">
                        {supportEmail || 'support@stitchplatform.com'}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
                      <Phone className="text-blue-300" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Call us</p>
                      <a href={`tel:${contactPhone || '+91 98765 43210'}`} className="font-medium text-lg hover:underline">
                        {contactPhone || '+91 98765 43210'}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors">
                      <MapPin className="text-blue-300" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Visit us</p>
                      <p className="font-medium text-lg">{address || 'Plot 42, Tech Park, Bengaluru, Karnataka, India'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Panel */}
            <div className="lg:w-3/5 p-10 md:p-12">
              {status && status.type === 'success' && (
                <div className="mb-8 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-start gap-3 animate-fade-in shadow-sm">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-900">Message Received!</p>
                    <p className="text-sm text-emerald-700 mt-0.5">{status.text}</p>
                  </div>
                </div>
              )}

              {status && status.type === 'error' && (
                <div className="mb-8 p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 flex items-start gap-3 animate-fade-in shadow-sm">
                  <AlertCircle size={24} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-900">Submission Failed</p>
                    <p className="text-sm text-rose-700 mt-0.5">{status.text}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">First Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-900"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-900"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-900"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-900"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Subject</label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-900"
                    placeholder="General Inquiry / Question about consultation"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Message <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows="5"
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all resize-none text-slate-900"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 group mt-4 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-blue-400" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

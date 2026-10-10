import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, Plus, Edit2, Trash2, Power, Eye, CheckCircle2, Clock } from 'lucide-react';

function ExpertServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    price: '',
    duration: '',
    consultationType: 'Video',
    bookingType: 'Scheduled',
    status: 'ACTIVE'
  });
  const [editingId, setEditingId] = useState(null);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubcategories(formData.categoryId);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/expert-services', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(res.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/categories/${categoryId}/subcategories`);
      setSubcategories(res.data);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      price: '',
      duration: '',
      consultationType: 'Video',
      bookingType: 'Scheduled',
      status: 'ACTIVE'
    });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingId(service._id);
    setFormData({
      name: service.name,
      description: service.description,
      categoryId: service.categoryId?._id || '',
      subcategoryId: service.subcategoryId?._id || '',
      price: service.price,
      duration: service.duration,
      consultationType: service.consultationType,
      bookingType: service.bookingType,
      status: service.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration)
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/expert-services/${editingId}`, payload, config);
        alert('Service updated successfully.');
      } else {
        await axios.post('http://localhost:5000/api/expert-services', payload, config);
        alert('Service created successfully.');
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving service');
    }
  };

  const handleToggleStatus = async (service) => {
    const newStatus = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    
    if (newStatus === 'INACTIVE' && !window.confirm('Are you sure you want to deactivate this service? Users will no longer be able to book it.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/expert-services/${service._id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Service ${newStatus === 'ACTIVE' ? 'is now available for booking.' : 'deactivated successfully.'}`);
      fetchServices();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service? It will be archived to preserve historical bookings.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/expert-services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServices();
    } catch (err) {
      alert('Error archiving service');
    }
  };

  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'ACTIVE').length;
  const totalBookings = services.reduce((acc, s) => acc + s.totalBookings, 0);
  const revenueGenerated = services.reduce((acc, s) => acc + s.totalRevenue, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services & Pricing</h1>
          <p className="text-slate-500">Create and manage the services you offer to users.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Services</p>
          <p className="text-3xl font-extrabold text-slate-900">{totalServices}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Active Services</p>
          <p className="text-3xl font-extrabold text-blue-600">{activeServices}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Bookings</p>
          <p className="text-3xl font-extrabold text-slate-900">{totalBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Revenue Generated</p>
          <p className="text-3xl font-extrabold text-emerald-600">₹{revenueGenerated.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No services yet</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Create your first service to start accepting bookings.</p>
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Service
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-semibold">Service Details</th>
                  <th className="p-4 font-semibold">Price & Duration</th>
                  <th className="p-4 font-semibold">Stats</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{service.name}</p>
                      <div className="flex gap-2 text-xs text-slate-500 mt-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{service.categoryId?.name}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{service.consultationType}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">₹{Number(service.price).toFixed(2)}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={14}/> {service.duration} mins</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-slate-700">{service.totalBookings} Bookings</p>
                      <p className="text-xs text-slate-500 mt-0.5">₹{Number(service.totalRevenue).toFixed(2)} Earned</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(
                        service.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      ).toFixed(2)}`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => handleToggleStatus(service)} className={`p-2 rounded-lg transition-colors ${service.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`} title={service.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        <Power size={18} />
                      </button>
                      <button onClick={() => openEditModal(service)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(service._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Archive">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Service' : 'Add New Service'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 shadow-sm">✕</button>
            </div>
            
            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              <form id="serviceForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg border-b pb-2">Basic Information</h3>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Service Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. Career Guidance" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                    <select required name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Subcategory</label>
                    <select name="subcategoryId" value={formData.subcategoryId} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option value="">Select Subcategory</option>
                      {subcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg border-b pb-2">Pricing & Duration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹) *</label>
                    <input required type="number" min="0" name="price" value={formData.price} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="499" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (Minutes) *</label>
                    <select required name="duration" value={formData.duration} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option value="">Select Duration</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg border-b pb-2">Consultation Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Consultation Type *</label>
                    <select required name="consultationType" value={formData.consultationType} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                      <option value="Chat">Chat</option>
                      <option value="Video + Chat">Video + Chat</option>
                      <option value="Audio + Chat">Audio + Chat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Booking Type *</label>
                    <select required name="bookingType" value={formData.bookingType} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                      <option value="Scheduled">Scheduled</option>
                      <option value="Instant">Instant</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>
              </div>
              </form>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-200 shrink-0 flex flex-col sm:flex-row gap-4 bg-slate-50 rounded-b-3xl">
              <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-1/2 py-3 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors order-2 sm:order-1 border border-slate-200">Cancel</button>
              <button type="submit" form="serviceForm" className="w-full sm:w-1/2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors order-1 sm:order-2 shadow-sm">Save Service</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ExpertServices;

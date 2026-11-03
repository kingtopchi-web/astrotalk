import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Columns, Filter, Download, Search as SearchIcon, FileText, AlertCircle } from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '', slug: '', description: '', status: 'ACTIVE', commissionRate: '' });
  const [error, setError] = useState('');
  // Document Requirements state
  const [showDocReqModal, setShowDocReqModal] = useState(false);
  const [selectedCatForDocs, setSelectedCatForDocs] = useState(null);
  const [selectedSubCatForDocs, setSelectedSubCatForDocs] = useState('');
  const [catSubCategories, setCatSubCategories] = useState([]);
  const [docReqs, setDocReqs] = useState([]);
  const [loadingDocReqs, setLoadingDocReqs] = useState(false);
  const [showEditReqModal, setShowEditReqModal] = useState(false);
  const [editingReqId, setEditingReqId] = useState(null);
  const [reqFormData, setReqFormData] = useState({
    name: '',
    description: '',
    isMandatory: true,
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxFileSizeMb: 5,
    subCategoryId: ''
  });
  const [reqError, setReqError] = useState('');
  const [reqSaving, setReqSaving] = useState(false);

  const fetchDocReqsForCategory = async (catId, subCatId = '') => {
    if (!catId) return;
    setLoadingDocReqs(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = `${ADMIN_API_URL}/document-requirements?categoryId=${catId}${subCatId ? `&subCategoryId=${subCatId}` : ''}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setDocReqs(res.data || []);
    } catch (e) {
      console.error('Failed to fetch doc requirements:', e);
      setDocReqs([]);
    } finally {
      setLoadingDocReqs(false);
    }
  };

  const handleOpenDocReqs = async (cat) => {
    setSelectedCatForDocs(cat);
    setSelectedSubCatForDocs('');
    setShowDocReqModal(true);
    setCatSubCategories([]);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${ADMIN_API_URL}/sub-categories`, { headers: { Authorization: `Bearer ${token}` } });
      const subs = Array.isArray(res.data) ? res.data.filter(s => (s.categoryId?._id || s.categoryId) === cat._id) : [];
      setCatSubCategories(subs);
    } catch (e) {}
    fetchDocReqsForCategory(cat._id, '');
  };

  const handleOpenAddReqModal = (reqItem = null) => {
    setReqError('');
    if (reqItem) {
      setEditingReqId(reqItem._id);
      setReqFormData({
        name: reqItem.name,
        description: reqItem.description || '',
        isMandatory: reqItem.isMandatory !== undefined ? reqItem.isMandatory : true,
        allowedFormats: reqItem.allowedFormats || ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSizeMb: reqItem.maxFileSizeMb || 5,
        subCategoryId: reqItem.subCategoryId ? (reqItem.subCategoryId._id || reqItem.subCategoryId) : ''
      });
    } else {
      setEditingReqId(null);
      setReqFormData({
        name: '',
        description: '',
        isMandatory: true,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSizeMb: 5,
        subCategoryId: selectedSubCatForDocs || ''
      });
    }
    setShowEditReqModal(true);
  };

  const handleSaveReq = async (e) => {
    e.preventDefault();
    if (!reqFormData.name.trim()) {
      setReqError('Document name is required');
      return;
    }
    setReqSaving(true);
    setReqError('');
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        categoryId: selectedCatForDocs._id,
        subCategoryId: reqFormData.subCategoryId || null,
        name: reqFormData.name.trim(),
        description: reqFormData.description.trim(),
        isMandatory: reqFormData.isMandatory,
        allowedFormats: reqFormData.allowedFormats,
        maxFileSizeMb: Number(reqFormData.maxFileSizeMb) || 5
      };

      if (editingReqId) {
        await axios.patch(`${ADMIN_API_URL}/document-requirements/${editingReqId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${ADMIN_API_URL}/document-requirements`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowEditReqModal(false);
      fetchDocReqsForCategory(selectedCatForDocs._id, selectedSubCatForDocs);
    } catch (err) {
      setReqError(err.response?.data?.message || 'Failed to save document requirement');
    } finally {
      setReqSaving(false);
    }
  };

  const handleDeleteReq = async (reqId) => {
    if (!window.confirm('Are you sure you want to delete this document requirement?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${ADMIN_API_URL}/document-requirements/${reqId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocReqsForCategory(selectedCatForDocs._id, selectedSubCatForDocs);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete requirement');
    }
  };
  
  // Filtering and Searching
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${ADMIN_API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase()) || cat.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter ? cat.status === statusFilter : true;
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Slug', 'Commission (%)', 'Status', 'Description'];
    const csvData = filteredCategories.map(cat => [
      cat.name,
      cat.slug,
      cat.commissionRate !== null && cat.commissionRate !== undefined ? `${cat.commissionRate}%` : 'Default (20%)',
      cat.status,
      cat.description || ''
    ].join(','));
    const blob = new Blob([headers.join(',') + '\n' + csvData.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'categories.csv');
    a.click();
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    setError('');
    if (category) {
      setIsEditing(true);
      setCurrentCategory({
        ...category,
        commissionRate: category.commissionRate !== null && category.commissionRate !== undefined ? category.commissionRate : ''
      });
    } else {
      setIsEditing(false);
      setCurrentCategory({ name: '', slug: '', description: '', status: 'ACTIVE', commissionRate: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      
      // Auto-generate slug if empty
      const payload = { ...currentCategory };
      if (!payload.slug) {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }

      if (payload.commissionRate === '' || payload.commissionRate === null || payload.commissionRate === undefined) {
        payload.commissionRate = null;
      } else {
        const parsed = Number(payload.commissionRate);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) {
          setError('Commission rate must be a valid number between 0% and 100%');
          return;
        }
        payload.commissionRate = parsed;
      }

      if (isEditing) {
        await axios.patch(`${ADMIN_API_URL}/categories/${currentCategory._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${ADMIN_API_URL}/categories`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${ADMIN_API_URL}/categories/${category._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Dynamic Search */}
          {showSearch && (
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 w-48"
              />
              <SearchIcon size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          )}
          
          {/* Dynamic Filter */}
          {showFilters && (
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          )}

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition" title="Columns">
              <Columns size={16} />
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg transition ${showFilters ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`} title="Filter">
              <Filter size={16} />
            </button>
            <button onClick={exportToCSV} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition" title="Download">
              <Download size={16} />
            </button>
            <button onClick={() => setShowSearch(!showSearch)} className={`w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg transition ${showSearch ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`} title="Search">
              <SearchIcon size={16} />
            </button>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-900 transition ml-2"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-700 text-sm">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Slug</th>
                <th className="p-4 font-semibold">Commission</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No categories found.</td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat._id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                    <td className="p-4 font-medium text-slate-800">{cat.name}</td>
                    <td className="p-4 text-slate-600">{cat.slug}</td>
                    <td className="p-4">
                      {cat.commissionRate !== null && cat.commissionRate !== undefined && !isNaN(cat.commissionRate) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {cat.commissionRate}% Custom
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Platform Default (20%)
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {cat.status === 'ACTIVE' ? (
                         <span className="text-slate-800">✓</span>
                      ) : (
                         <span className="text-slate-400">✕</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenDocReqs(cat)} 
                        className="w-8 h-8 flex items-center justify-center bg-amber-50 border border-amber-200 rounded text-amber-700 hover:bg-amber-100 transition cursor-pointer" 
                        title="Manage Category Document Requirements"
                      >
                        <FileText size={14} />
                      </button>
                      <button onClick={() => handleOpenModal(cat)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat)} 
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input 
                    type="text" 
                    required
                    value={currentCategory.name}
                    onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. Doctor"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (optional)</label>
                  <input 
                    type="text" 
                    value={currentCategory.slug}
                    onChange={(e) => setCurrentCategory({...currentCategory, slug: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. doctor"
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave blank to auto-generate from name.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                    value={currentCategory.description}
                    onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    rows="3"
                  ></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Commission Rate (%)</label>
                    <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Admin Dynamic Control</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      step="0.5"
                      value={currentCategory.commissionRate ?? ''}
                      onChange={(e) => setCurrentCategory({...currentCategory, commissionRate: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none pr-8"
                      placeholder="e.g. 15 (leave blank to inherit platform default)"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Take rate deducted from consultations in this category. Leave blank to use global platform default.
                  </p>
                </div>
                
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={currentCategory.status}
                      onChange={(e) => setCurrentCategory({...currentCategory, status: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Requirements Management Modal */}
      {showDocReqModal && selectedCatForDocs && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Category Document Requirements: {selectedCatForDocs.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define qualification and licensing documents experts must upload when registering under this category.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDocReqModal(false)} 
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Subcategory Filter & Add Button */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Subcategory:</label>
                <select
                  value={selectedSubCatForDocs}
                  onChange={(e) => {
                    setSelectedSubCatForDocs(e.target.value);
                    fetchDocReqsForCategory(selectedCatForDocs._id, e.target.value);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-amber-500"
                >
                  <option value="">All Requirements (Category Level)</option>
                  {catSubCategories.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddReqModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Document Requirement</span>
              </button>
            </div>

            {/* Requirements List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {loadingDocReqs ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading document requirements...</div>
              ) : docReqs.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No Document Requirements Configured</p>
                  <p className="text-slate-400 mt-1">Click "Add Document Requirement" above to define mandatory or optional documents for this category.</p>
                </div>
              ) : (
                docReqs.map((reqItem) => (
                  <div key={reqItem._id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{reqItem.name}</h4>
                          {reqItem.isMandatory ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              Mandatory *
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Optional
                            </span>
                          )}
                          {reqItem.subCategoryId && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Subcategory: {reqItem.subCategoryId?.name || 'Specific'}
                            </span>
                          )}
                        </div>
                        {reqItem.description && (
                          <p className="text-xs text-slate-600 mt-1">{reqItem.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Allowed: {(reqItem.allowedFormats || ['pdf', 'jpg', 'jpeg', 'png']).join(', ').toUpperCase()} • Max Size: {reqItem.maxFileSizeMb || 5}MB
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenAddReqModal(reqItem)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          title="Edit Requirement"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReq(reqItem._id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Requirement"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setShowDocReqModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Requirement Modal */}
      {showEditReqModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingReqId ? 'Edit Document Requirement' : 'Add Document Requirement'}
              </h3>
              <button onClick={() => setShowEditReqModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveReq} className="p-5 space-y-4">
              {reqError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{reqError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reqFormData.name}
                  onChange={(e) => setReqFormData({ ...reqFormData, name: e.target.value })}
                  placeholder="e.g. Medical Degree (MBBS / MD) or Bar Council Certificate"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  value={reqFormData.description}
                  onChange={(e) => setReqFormData({ ...reqFormData, description: e.target.value })}
                  placeholder="e.g. Upload clear certified copy of recognized university passing degree."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              {catSubCategories.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Applies To Subcategory
                  </label>
                  <select
                    value={reqFormData.subCategoryId}
                    onChange={(e) => setReqFormData({ ...reqFormData, subCategoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">All Subcategories (Category Wide)</option>
                    {catSubCategories.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requirement Type
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reqFormData.isMandatory}
                      onChange={(e) => setReqFormData({ ...reqFormData, isMandatory: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-800">Mandatory (Required)</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">If unchecked, document is marked optional.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={reqFormData.maxFileSizeMb}
                    onChange={(e) => setReqFormData({ ...reqFormData, maxFileSizeMb: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Accepted Formats
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {['pdf', 'jpg', 'jpeg', 'png'].map((fmt) => {
                    const isChecked = reqFormData.allowedFormats.includes(fmt);
                    return (
                      <label key={fmt} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReqFormData({ ...reqFormData, allowedFormats: [...reqFormData.allowedFormats, fmt] });
                            } else {
                              if (reqFormData.allowedFormats.length <= 1) return; // keep at least one
                              setReqFormData({ ...reqFormData, allowedFormats: reqFormData.allowedFormats.filter(f => f !== fmt) });
                            }
                          }}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                        />
                        <span className="uppercase font-bold text-[11px]">{fmt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditReqModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reqSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {reqSaving ? 'Saving...' : editingReqId ? 'Update Requirement' : 'Save Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesList;

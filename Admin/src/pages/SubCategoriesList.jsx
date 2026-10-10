import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Columns, Filter, Download, Search as SearchIcon, X } from 'lucide-react';

function SubCategoriesList() {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]); // For dropdown
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubCategory, setCurrentSubCategory] = useState({ name: '', slug: '', categoryId: '', description: '', status: 'ACTIVE' });
  const [error, setError] = useState('');

  // Filtering and Searching
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [subRes, catRes] = await Promise.all([
        axios.get('https://astrotalk-hlg2.onrender.com/api/admin/sub-categories', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('https://astrotalk-hlg2.onrender.com/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSubCategories(subRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubCategories = subCategories.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(search.toLowerCase()) || 
                          sub.slug.toLowerCase().includes(search.toLowerCase()) ||
                          (sub.categoryId?.name && sub.categoryId.name.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = statusFilter ? sub.status === statusFilter : true;
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Parent Category', 'Slug', 'Status', 'Description'];
    const csvData = filteredSubCategories.map(sub => [
      sub.name, 
      sub.categoryId?.name || 'Unknown', 
      sub.slug, 
      sub.status, 
      sub.description
    ].join(','));
    const blob = new Blob([headers.join(',') + '\\n' + csvData.join('\\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'subcategories.csv');
    a.click();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (subCategory = null) => {
    setError('');
    if (subCategory) {
      setIsEditing(true);
      setCurrentSubCategory({
        ...subCategory,
        categoryId: subCategory.categoryId._id // extract ID from populated object
      });
    } else {
      setIsEditing(false);
      setCurrentSubCategory({ name: '', slug: '', categoryId: '', description: '', status: 'ACTIVE' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const payload = { ...currentSubCategory };
      if (!payload.slug) {
        payload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }

      if (isEditing) {
        await axios.patch(`https://astrotalk-hlg2.onrender.com/api/admin/sub-categories/${currentSubCategory._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://astrotalk-hlg2.onrender.com/api/admin/sub-categories', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save sub-category');
    }
  };

  const handleDelete = async (subCategory) => {
    if (!window.confirm(`Are you sure you want to delete sub-category "${subCategory.name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`https://astrotalk-hlg2.onrender.com/api/admin/sub-categories/${subCategory._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Failed to delete sub-category');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Sub-categories</h1>
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
            <Plus size={16} /> Add Sub-category
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
                <th className="p-4 font-semibold">Parent Category</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No sub-categories found.</td>
                </tr>
              ) : (
                filteredSubCategories.map((sub) => (
                  <tr key={sub._id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                    <td className="p-4 font-medium text-slate-800">{sub.name}</td>
                    <td className="p-4 text-slate-600">{sub.categoryId?.name || 'Unknown'}</td>
                    <td className="p-4">
                      {sub.status === 'ACTIVE' ? (
                         <span className="text-slate-800">✓</span>
                      ) : (
                         <span className="text-slate-400">✕</span>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(sub)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sub)} 
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
              <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Sub-category' : 'Add Sub-category'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category *</label>
                  <select 
                    required
                    value={currentSubCategory.categoryId}
                    onChange={(e) => setCurrentSubCategory({...currentSubCategory, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Select a Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id} disabled={cat.status !== 'ACTIVE'}>
                        {cat.name} {cat.status !== 'ACTIVE' ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sub-category Name *</label>
                  <input 
                    type="text" 
                    required
                    value={currentSubCategory.name}
                    onChange={(e) => setCurrentSubCategory({...currentSubCategory, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (optional)</label>
                  <input 
                    type="text" 
                    value={currentSubCategory.slug}
                    onChange={(e) => setCurrentSubCategory({...currentSubCategory, slug: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                    value={currentSubCategory.description}
                    onChange={(e) => setCurrentSubCategory({...currentSubCategory, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    rows="3"
                  ></textarea>
                </div>
                
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={currentSubCategory.status}
                      onChange={(e) => setCurrentSubCategory({...currentSubCategory, status: e.target.value})}
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
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">Save Sub-category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubCategoriesList;

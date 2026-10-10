import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, Phone, MessageSquare } from 'lucide-react';
import UserLayout from '../components/UserLayout';

function FreeServices() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFreeExperts = async () => {
      try {
        const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/public/experts', {
          params: { maxPrice: 0 }
        });
        setExperts(res.data.data);
      } catch (err) {
        setError('Unable to load free services. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchFreeExperts();
  }, []);

  return (
    <UserLayout title="Free Services" subtitle="Consult with experts offering free sessions.">
      <div className="py-6">
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl p-4 animate-pulse border border-border-color">
                <div className="w-14 h-14 rounded-2xl bg-surface-light mb-3"></div>
                <div className="h-4 bg-surface-light rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-surface-light rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-2xl border border-border-color">
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="text-xl font-bold text-on-surface mb-2">No Free Services Currently</h3>
            <p className="text-on-surface/60 text-sm">Our experts are currently busy. Please check back later for free sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {experts.map(expert => (
              <div
                key={expert._id}
                onClick={() => navigate(`/expert/${expert._id}`)}
                className="bg-surface rounded-2xl border border-border-color p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=F7C83C&color=fff`}
                    alt={expert.name}
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                  />
                  <div>
                    <h3 className="font-bold text-on-surface text-sm">{expert.name}</h3>
                    <p className="text-xs text-on-surface/60">{expert.specialty}</p>
                    <span className="inline-block text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full mt-1 border border-emerald-100">
                      FREE
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default FreeServices;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import UserLayout from '../components/UserLayout';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/public/categories')
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <UserLayout title="Categories" subtitle="Find the right expert by exploring our professional fields.">
      <div className="py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-surface-light rounded-2xl h-40 border border-border-color"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/experts?categoryId=${category._id}`}
                className="bg-surface rounded-2xl p-6 border border-border-color hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <span className="material-symbols-outlined text-[32px] text-primary group-hover:text-background">{category.icon || 'category'}</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                <p className="text-sm text-on-surface/60">{category.description || 'Explore experts in this field'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default Categories;

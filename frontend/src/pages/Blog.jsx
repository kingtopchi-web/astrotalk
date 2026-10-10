import React, { useState } from 'react';
import UserLayout from '../components/UserLayout';
import ExpertLayout from '../layouts/ExpertLayout';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, Clock, ChevronRight, User } from 'lucide-react';

const BLOG_CATEGORIES = ['All', 'Astrology', 'Career', 'Mental Health', 'Legal', 'Tech', 'Finance'];

const BLOG_POSTS = [
  {
    id: 1,
    title: 'How to Choose the Right Career Path in 2027',
    excerpt: 'Feeling stuck? Discover the most effective strategies to align your passion with market demand and build a fulfilling career.',
    category: 'Career',
    author: 'Dr. Sarah Jenkins',
    authorImage: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=0D8ABC&color=fff',
    date: 'Oct 10, 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    title: 'The Impact of Planetary Transits on Your Daily Life',
    excerpt: 'An in-depth guide on how major astrological transits influence your mood, decision-making, and interpersonal relationships.',
    category: 'Astrology',
    author: 'Pandit Ravi Sharma',
    authorImage: 'https://ui-avatars.com/api/?name=Ravi+Sharma&background=F59E0B&color=fff',
    date: 'Oct 08, 2026',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    title: 'Managing Startup Finances: A Founder\'s Handbook',
    excerpt: 'Learn the critical financial metrics every startup founder needs to track, and how to optimize burn rate during tough times.',
    category: 'Finance',
    author: 'Michael Chen',
    authorImage: 'https://ui-avatars.com/api/?name=Michael+Chen&background=10B981&color=fff',
    date: 'Oct 05, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 4,
    title: 'Overcoming Imposter Syndrome in Tech',
    excerpt: 'Practical advice from senior engineers on how to build confidence and recognize your true value in the tech industry.',
    category: 'Mental Health',
    author: 'Emily Rodriguez',
    authorImage: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=8B5CF6&color=fff',
    date: 'Sep 28, 2026',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 5,
    title: 'Essential Legal Clauses for Freelance Contracts',
    excerpt: 'Protect your business with these 5 essential clauses every freelancer must include in their client agreements.',
    category: 'Legal',
    author: 'Robert Hayes, Esq.',
    authorImage: 'https://ui-avatars.com/api/?name=Robert+Hayes&background=EF4444&color=fff',
    date: 'Sep 25, 2026',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 6,
    title: 'Vedic vs Western Astrology: Key Differences',
    excerpt: 'A comprehensive comparison between Vedic (Jyotish) and Western astrological systems and how to interpret them.',
    category: 'Astrology',
    author: 'Anita Desai',
    authorImage: 'https://ui-avatars.com/api/?name=Anita+Desai&background=F59E0B&color=fff',
    date: 'Sep 20, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1515266591878-f93e32bc5937?auto=format&fit=crop&q=80&w=800'
  }
];

function Blog() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const Layout = user?.role === 'EXPERT' ? ExpertLayout : UserLayout;

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout title="Blog & Resources" subtitle="Expert advice, guides, and insights to help you grow.">
      
      {/* Search & Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {BLOG_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${Number(
                selectedCategory === category 
                  ? 'bg-primary text-background shadow-md transform scale-105' 
                  : 'bg-surface border border-border-color text-on-surface/70 hover:border-primary hover:text-primary'
              ).toFixed(2)}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 group">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border-color rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 group-focus-within:text-primary transition-colors" size={18} />
        </div>
      </div>

      {/* Featured/Latest Post (Optional highlight for first post if "All" is selected) */}
      {selectedCategory === 'All' && searchTerm === '' && filteredPosts.length > 0 && (
        <div className="mb-12 bg-surface border border-border-color rounded-3xl overflow-hidden flex flex-col lg:flex-row group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50">
          <div className="w-full lg:w-1/2 h-64 lg:h-auto overflow-hidden relative">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
            <img 
              src={filteredPosts[0].image} 
              alt={filteredPosts[0].title} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-primary text-background text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Featured
              </span>
            </div>
          </div>
          <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-surface-card">
            <span className="text-primary font-bold text-sm mb-3 block">{filteredPosts[0].category}</span>
            <h2 className="text-3xl font-heading font-extrabold text-on-surface mb-4 group-hover:text-primary transition-colors">
              {filteredPosts[0].title}
            </h2>
            <p className="text-on-surface/70 mb-6 leading-relaxed text-lg">
              {filteredPosts[0].excerpt}
            </p>
            <div className="flex items-center gap-4 mt-auto">
              <img src={filteredPosts[0].authorImage} alt={filteredPosts[0].author} className="w-12 h-12 rounded-full border-2 border-primary/20" />
              <div>
                <h4 className="text-sm font-bold text-on-surface">{filteredPosts[0].author}</h4>
                <div className="flex items-center gap-3 text-xs text-on-surface/50 mt-1">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {filteredPosts[0].date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {filteredPosts[0].readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border-color rounded-3xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Search size={32} />
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-2">No articles found</h3>
          <p className="text-on-surface/60">Try adjusting your search or selecting a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.slice(selectedCategory === 'All' && searchTerm === '' ? 1 : 0).map(post => (
            <div key={post.id} className="bg-surface-card border border-border-color rounded-2xl overflow-hidden flex flex-col group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-surface/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-heading font-bold text-on-surface mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-on-surface/60 text-sm mb-6 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border-color mt-auto">
                  <div className="flex items-center gap-3">
                    <img src={post.authorImage} alt={post.author} className="w-8 h-8 rounded-full" />
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{post.author}</h4>
                      <span className="text-[10px] text-on-surface/50">{post.date}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Newsletter Signup */}
      <div className="mt-16 bg-primary-light/30 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary opacity-5 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-4xl mb-4 block">💌</span>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-on-surface mb-4">
            Never miss an update from our experts!
          </h2>
          <p className="text-on-surface/70 mb-8 text-lg">
            Subscribe to our newsletter and get weekly insights, expert tips, and exclusive offers straight to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 justify-center" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="px-6 py-4 rounded-full bg-surface border border-border-color text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-96 shadow-sm"
              required
            />
            <button 
              type="submit" 
              className="px-8 py-4 bg-primary text-background font-bold rounded-full hover:bg-primary-dark transition-colors shadow-md whitespace-nowrap"
            >
              Subscribe Now
            </button>
          </form>
        </div>
      </div>

    </Layout>
  );
}

export default Blog;

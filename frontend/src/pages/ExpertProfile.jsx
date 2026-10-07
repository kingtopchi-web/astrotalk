import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  BadgeCheck, 
  MapPin, 
  Clock, 
  Star, 
  Calendar as CalendarIcon, 
  MessageSquare,
  ChevronRight,
  Globe,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';

function ExpertPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Services');

  useEffect(() => {
    const fetchExpertAndServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [expertRes, servicesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/user/experts/${id}`, { headers }),
          axios.get(`http://localhost:5000/api/expert-services/public/${id}`)
        ]);

        setExpert(expertRes.data);
        setServices(servicesRes.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('This expert could not be found.');
        } else {
          setError('Failed to load expert profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchExpertAndServices();
  }, [id]);

  const handleConsultClick = (type) => {
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-6">
          <div className="text-6xl">😕</div>
          <p className="text-slate-600 font-medium text-lg">{error || 'Expert not found'}</p>
          <button onClick={() => navigate('/experts')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Browse Experts
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryName = expert.categoryId?.name || 'General';
  const subCategoryName = expert.subCategoryId?.name || '';
  const price = expert.pricing || 500;
  
  // Dummy tags if missing
  const expertiseTags = expert.tags?.length > 0 ? expert.tags : [categoryName, subCategoryName, 'Consultation'].filter(Boolean);
  const rating = expert.rating > 0 ? expert.rating.toFixed(1) : '4.8';
  const reviewsCount = expert.reviewsCount || 120;
  
  const dummyReviews = [
    { name: 'Anjali Mehta', time: '2 weeks ago', rating: 5, text: 'Dr. Priya is very understanding and patient. Her sessions really helped me manage my anxiety.' },
    { name: 'Rohit Verma', time: '1 month ago', rating: 5, text: 'Highly recommend! She provides practical solutions and listens genuinely.' }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans pt-16 md:pt-20">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-slate-500 mb-6 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2 text-slate-400" />
          <Link to="/experts" className="hover:text-blue-600 transition-colors">Experts</Link>
          <ChevronRight size={14} className="mx-2 text-slate-400" />
          <span className="text-slate-800">{expert.name}</span>
        </nav>

        {/* Top Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 mb-8">
          
          {/* Left: Info */}
          <div className="flex-1 flex flex-col md:flex-row gap-8">
            <div className="relative shrink-0 mx-auto md:mx-0">
              <img
                src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=2563eb&color=fff&size=256`}
                alt={expert.name}
                className="w-40 h-40 md:w-56 md:h-56 rounded-2xl object-cover shadow-md"
              />
              {expert.onlineStatus === 'online' && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white bg-green-500"></div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-center text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 font-bold text-sm mb-2">
                <BadgeCheck size={18} />
                <span>Verified Expert</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">{expert.name}</h1>
              <p className="text-lg text-slate-600 font-medium mb-6">{expert.specialty || expert.specialization || `${categoryName} Specialist`}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-4 gap-x-6 text-sm text-slate-600 font-medium mb-6">
                <div className="flex items-center gap-1.5">
                  <Star size={18} className="text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-900">{rating}</span>
                  <span className="text-slate-400">({reviewsCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-6">
                  <CalendarIcon size={18} className="text-slate-400" />
                  <span>{expert.experience || '5+ Years Experience'}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-6">
                  <MapPin size={18} className="text-slate-400" />
                  <span>{expert.location || 'New Delhi, India'}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-auto">
                {expertiseTags.map((tag, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking CTA */}
          <div className="md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900">{services.length} <span className="text-sm font-medium text-slate-500">Active Services</span></p>
                {services.length > 0 && <p className="text-xs font-medium text-slate-400">Starting from ₹{Math.min(...services.map(s => s.price))}</p>}
              </div>
            </div>
            
            <button 
              onClick={() => {
                setActiveTab('Services');
                window.scrollTo({ top: 500, behavior: 'smooth' });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-3"
            >
              <CalendarIcon size={18} />
              View & Book Services
            </button>
            <button 
              className="w-full bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 mb-6"
            >
              <MessageSquare size={18} />
              Send Message
            </button>
            
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Available today, 10:00 AM - 06:00 PM
            </div>
          </div>
        </div>

        {/* Bottom Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Tabs + Details) */}
          <div className="lg:col-span-2">
            
            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-200 mb-8 overflow-x-auto pb-1">
              {['Services', 'About', `Reviews (${reviewsCount})`, 'Availability', 'Sessions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-bold whitespace-nowrap pb-3 border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'Services' && (
              <div className="space-y-4">
                {services.length === 0 ? (
                   <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                     <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                     <h3 className="text-lg font-bold text-slate-900 mb-2">No active services</h3>
                     <p className="text-slate-500">This expert has not listed any services yet.</p>
                   </div>
                ) : (
                  services.map(service => (
                    <div key={service._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{service.consultationType}</span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{service.categoryId?.name}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                        <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
                          <span className="flex items-center gap-1"><Clock size={16} className="text-slate-400"/> {service.duration} mins</span>
                          <span className="flex items-center gap-1"><BadgeCheck size={16} className="text-blue-500"/> {service.bookingType} Booking</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center md:border-l border-slate-100 md:pl-6 shrink-0">
                        <p className="text-2xl font-extrabold text-slate-900 mb-4">₹{service.price}</p>
                        <button 
                          onClick={() => navigate(`/book/${id}?serviceId=${service._id}`)}
                          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors whitespace-nowrap"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'About' && (
              <div className="space-y-10 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                
                {/* Bio */}
                {expert.bio && (
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-4">About {expert.name}</h3>
                    <div className="text-slate-600 leading-relaxed space-y-4 text-sm font-medium whitespace-pre-line">
                      {expert.bio}
                    </div>
                  </div>
                )}

                {/* Expertise */}
                {(expertiseTags.length > 0 || expert.specialization) && (
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4">Expertise & Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {expertiseTags.map((tag, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-bold">
                          {tag}
                        </span>
                      ))}
                      {expert.specialization && (
                        <span className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-bold">
                          {expert.specialization}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Education */}
                {expert.qualification && (
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4">Education & Credentials</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Award size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{expert.qualification}</h4>
                          <p className="text-xs text-slate-500 font-medium">Verified Qualification</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab !== 'About' && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center py-20">
                <p className="text-slate-500 font-medium text-lg">No data available for {activeTab.toLowerCase()} yet.</p>
              </div>
            )}
            
          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="space-y-6">
            
            {/* About Expert Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">About the Expert</h3>
              <ul className="space-y-5">
                {expert.experience && (
                  <li className="flex gap-4">
                    <CalendarIcon size={20} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Experience</p>
                      <p className="text-sm font-bold text-slate-800">{expert.experience}</p>
                    </div>
                  </li>
                )}
                {expert.languages && expert.languages.length > 0 && (
                  <li className="flex gap-4">
                    <Globe size={20} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Language</p>
                      <p className="text-sm font-bold text-slate-800">{expert.languages.join(', ')}</p>
                    </div>
                  </li>
                )}
                <li className="flex gap-4">
                  <MapPin size={20} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Location</p>
                    <p className="text-sm font-bold text-slate-800">{expert.location || 'Remote'}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Ratings & Reviews Widget */}
            {(expert.rating > 0 || expert.reviewsCount > 0) && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Ratings & Reviews</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div>
                    <div className="text-5xl font-extrabold text-slate-900 mb-2">{rating}</div>
                    <div className="flex text-amber-400 gap-1 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.floor(rating) ? 'fill-amber-400' : ''} />)}
                    </div>
                    <p className="text-xs font-medium text-slate-500">Based on {reviewsCount} reviews</p>
                  </div>
                  
                  <div className="flex-1 space-y-2 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2"><span className="w-4">5 ★</span><div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-[100%]"></div></div><span className="w-8 text-right">100%</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

export default ExpertPublicProfile;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Expert = require('./models/Expert');
const ExpertService = require('./models/ExpertService');

const expertsData = [
  {
    name: 'Dr. Ananya Roy',
    email: 'dr.ananya.roy@experthub.com',
    mobile: '9876500001',
    categoryId: '6aca26a5d56afbd540756490', // Health & Medical
    subCategoryId: '6aca26a5d56afbd540756491', // General Physician
    specialty: 'Consultant Physician & Preventive Care',
    qualification: 'MBBS, MD (General Medicine)',
    specialization: 'Internal Medicine, Lifestyle Disease & Immunity',
    experience: '9',
    bio: 'Experienced clinical specialist with over 9 years in family medicine and lifestyle wellness. Providing comprehensive patient evaluations and empathetic care.',
    languages: ['English', 'Hindi', 'Bengali'],
    rates: { chat: 12, audio: 20, video: 30 },
    pricePerMinute: 12,
    rating: 4.9,
    reviewsCount: 164,
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'APPROVED',
    status: 'ACTIVE',
    onlineStatus: 'online'
  },
  {
    name: 'Adv. Rohan Verma',
    email: 'adv.rohan.verma@experthub.com',
    mobile: '9876500002',
    categoryId: '6aca26a6d56afbd540756493', // Legal Advisors
    subCategoryId: '6aca26a6d56afbd540756494', // Corporate Law
    specialty: 'Corporate Law & Startup Contracts',
    qualification: 'LL.B, LL.M (Commercial & Corporate Law)',
    specialization: 'Founders Agreement, Tech Contracts & Compliance',
    experience: '11',
    bio: 'Dedicated corporate attorney advising early-stage founders and tech businesses on shareholder pacts, IP security, and regulatory compliances.',
    languages: ['English', 'Hindi'],
    rates: { chat: 18, audio: 28, video: 40 },
    pricePerMinute: 18,
    rating: 4.8,
    reviewsCount: 92,
    profileImage: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'APPROVED',
    status: 'ACTIVE',
    onlineStatus: 'online'
  },
  {
    name: 'Priya Sengupta',
    email: 'priya.sengupta@experthub.com',
    mobile: '9876500003',
    categoryId: '6aca26a6d56afbd54075649f', // Mental Wellness
    subCategoryId: '6aca26a6d56afbd5407564a0', // Therapy
    specialty: 'Cognitive Behavioral & Stress Therapy',
    qualification: 'M.Sc Clinical Psychology, RCI Registered',
    specialization: 'Work Stress, Anxiety & Mindfulness Counseling',
    experience: '8',
    bio: 'Empathetic counselor focusing on holistic emotional wellbeing, resilience training, stress management, and modern lifestyle balance.',
    languages: ['English', 'Hindi'],
    rates: { chat: 15, audio: 22, video: 35 },
    pricePerMinute: 15,
    rating: 5.0,
    reviewsCount: 218,
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'APPROVED',
    status: 'ACTIVE',
    onlineStatus: 'online'
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta@experthub.com',
    mobile: '9876500004',
    categoryId: '6aca26a6d56afbd540756499', // Tech & IT
    subCategoryId: '6aca26a6d56afbd54075649a', // Software Development
    specialty: 'Fullstack Architect & AI System Engineer',
    qualification: 'B.Tech (Computer Science), AWS Solution Architect',
    specialization: 'Microservices, Scalability, System Design & Cloud',
    experience: '10',
    bio: 'Hands-on tech architect helping engineers and startups scale backend architectures, implement generative AI systems, and crack system design interviews.',
    languages: ['English', 'Hindi'],
    rates: { chat: 15, audio: 25, video: 38 },
    pricePerMinute: 15,
    rating: 4.9,
    reviewsCount: 145,
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'APPROVED',
    status: 'ACTIVE',
    onlineStatus: 'online'
  },
  {
    name: 'Vikramaditya Joshi',
    email: 'vikram.joshi@experthub.com',
    mobile: '9876500005',
    categoryId: '6acca7221f7af26ceb183397', // Astrologer
    subCategoryId: null,
    specialty: 'Vedic Kundli & Numerology Expert',
    qualification: 'Jyotish Visharad, Vedic Sciences Scholar',
    specialization: 'Career Horoscopes, Relationship Match & Gemology',
    experience: '14',
    bio: 'Practicing astrologer with 14+ years guiding clients with precision birth-chart analysis, career guidance, and practical Vedic remedies.',
    languages: ['English', 'Hindi', 'Sanskrit'],
    rates: { chat: 10, audio: 18, video: 28 },
    pricePerMinute: 10,
    rating: 4.8,
    reviewsCount: 310,
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'APPROVED',
    status: 'ACTIVE',
    onlineStatus: 'online'
  },
  {
    name: 'Sneha Kapoor',
    email: 'sneha.kapoor@experthub.com',
    mobile: '9876500006',
    categoryId: '6aca26a6d56afbd54075649c', // Business & Finance
    subCategoryId: '6aca26a6d56afbd54075649d', // Startup Funding
    specialty: 'Venture Capital & Pitch Deck Strategy',
    qualification: 'MBA (Finance), Ex-Venture Associate',
    specialization: 'Fundraising, Financial Modeling & Pitch Decks',
    experience: '7',
    bio: 'Seasoned finance and venture mentor who has aided over 40 startups in preparing investor-ready pitch decks, cap tables, and seed round strategies.',
    languages: ['English', 'Hindi'],
    rates: { chat: 20, audio: 30, video: 45 },
    pricePerMinute: 20,
    rating: 4.9,
    reviewsCount: 88,
    profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'APPROVED',
    status: 'ACTIVE',
    onlineStatus: 'online'
  }
];

async function seedOnlineExperts() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const hashedPassword = await bcrypt.hash('Expert@123', 10);

    for (const data of expertsData) {
      let expert = await Expert.findOne({ email: data.email });
      if (!expert) {
        expert = new Expert({
          ...data,
          password: hashedPassword
        });
        await expert.save();
        console.log(`Created online expert: ${expert.name}`);
      } else {
        Object.assign(expert, data);
        expert.onlineStatus = 'online';
        expert.verificationStatus = 'APPROVED';
        expert.status = 'ACTIVE';
        await expert.save();
        console.log(`Updated online expert: ${expert.name}`);
      }

      // Ensure active bookable service exists for this expert
      const existingService = await ExpertService.findOne({ expertId: expert._id });
      if (!existingService) {
        await ExpertService.create({
          expertId: expert._id,
          categoryId: expert.categoryId,
          subcategoryId: expert.subCategoryId || undefined,
          name: `${expert.specialty} - 1:1 Consultation`,
          description: `Direct private consultation with ${expert.name}. Includes real-time guidance, query resolution, and actionable takeaways.`,
          price: (expert.rates?.video || 25) * 15, // 15 min session
          currency: 'INR',
          pricingType: 'Fixed',
          duration: 15,
          consultationType: 'Video',
          bookingType: 'Both',
          availabilityMode: 'Use Expert Schedule',
          status: 'ACTIVE'
        });
        console.log(`Created ExpertService for: ${expert.name}`);
      }
    }

    // Also ensure existing 'test' expert remains online
    await Expert.updateOne({ name: 'test' }, { $set: { onlineStatus: 'online', status: 'ACTIVE', verificationStatus: 'APPROVED' } });

    console.log('Successfully seeded 6 verified online experts with active services!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedOnlineExperts();

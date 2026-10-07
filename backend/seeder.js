const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Expert = require('./models/Expert');

dotenv.config();

const experts = [
  {
    name: 'Devina Nair',
    specialty: 'Vedic Astrology & Tarot',
    languages: ['English', 'Hindi', 'Sanskrit'],
    rating: 4.97,
    reviewsCount: 1420,
    pricePerMinute: 2.50,
    isVerified: true,
    profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_wPdUyWiXObvOkG2c3BFSZ06LIwt9lX3ymqoRICmdQNMw06yK3OzVxdcAtexGxduPr2cnjuoB3uWQRb-_WYkRoNrTqJiJn3o92jnIlsigt6fxpBPLBgUWjdTxPzZkE2A_Pz5m2VBbyfIOKe6i8fMNgnOJZqef-eArHj0Z3BSldmaWn7GB5IQxxjXuGoOd6Lo3sXtpMJtdolG0_ieF2tI5f-GSqiUSvXupLMwnXl84hS8Xu2X90GuT',
    status: 'online',
    categories: ['vedic']
  },
  {
    name: 'Marcus Vance',
    specialty: 'Series-A Pitch & AI Scale',
    languages: ['English', 'German'],
    rating: 4.99,
    reviewsCount: 890,
    pricePerMinute: 4.20,
    isVerified: true,
    profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDliYb7MAQv5WgxwT0CWiFOJeddgHG8fifC7kWI2j7wM8n1LWd_VOS1uxwEjTbA7icSw3GvCkcg2VHmbjFwTLZ6GqQNAWYuPtarexUqS9z9-es_fbnhGpCAUG-Dh7gTLpqBuJ0-3pSzv5xafald2SXy8oZOfu3MSBdLkPW36CNBoxHWvzt5PyoMgZuG8JpmcSAAHUuBQJDdA4RuB84mflfWskhyAoyxvF91PGV2P_6B2NGLbGXFHNZD',
    status: 'online',
    categories: ['business']
  },
  {
    name: 'Elena Rostova',
    specialty: 'Burnout & High-Performance',
    languages: ['English', 'French', 'Russian'],
    rating: 4.95,
    reviewsCount: 612,
    pricePerMinute: 3.10,
    isVerified: true,
    profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWwPT_5cCHa-g67RFsG74zfvYyfTEzASsMdn3ZgNNEYkhfld5yKWnSdHjtKePZcRVdVZ0oZjVw7QU71aPWtlL6eV1gh5iRKYIJeE9BIIAxI01iK43x_uS7DiSc5hBpsKi9hQ8OvyEn8DYSGkJxy9Me-vpG1ztrrHiA4RVn2tqk8V0ZQn2JKDgkMGalKFWLh7ryvmrnRU8edPK738bcKA_OZU9xPZkP6i0n8amq22sD5I14DJXxcEep',
    status: 'busy',
    categories: ['wellness']
  }
];

const seedDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auraexpert';
    await mongoose.connect(MONGODB_URI);
    
    await Expert.deleteMany();
    await Expert.insertMany(experts);
    
    console.log('Database seeded!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();

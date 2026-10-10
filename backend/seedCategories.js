const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');

const MONGO_URI = process.env.MONGODB_URI;

const categoriesData = [
  { slug: 'health', name: 'Health & Medical', icon: 'favorite', subcats: ['General Physician', 'Ayurveda'] },
  { slug: 'legal', name: 'Legal Advisors', icon: 'balance', subcats: ['Corporate Law', 'Family Law'] },
  { slug: 'career', name: 'Career Mentors', icon: 'work', subcats: ['Resume Review', 'Interview Prep'] },
  { slug: 'tech', name: 'Tech & IT', icon: 'computer', subcats: ['Software Development', 'Data Science'] },
  { slug: 'finance', name: 'Business & Finance', icon: 'account_balance', subcats: ['Startup Funding', 'Taxation'] },
  { slug: 'wellness', name: 'Mental Wellness', icon: 'self_improvement', subcats: ['Therapy', 'Life Coaching'] }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (let cat of categoriesData) {
      let existingCat = await Category.findOne({ slug: cat.slug });
      if (!existingCat) {
        existingCat = await Category.create({ name: cat.name, slug: cat.slug, icon: cat.icon });
        console.log(`Created category: ${cat.name}`);
      } else {
        existingCat.icon = cat.icon;
        await existingCat.save();
      }

      for (let sub of cat.subcats) {
        const subSlug = sub.toLowerCase().replace(/\s+/g, '-');
        const existingSub = await SubCategory.findOne({ slug: subSlug, categoryId: existingCat._id });
        if (!existingSub) {
          await SubCategory.create({ name: sub, slug: subSlug, categoryId: existingCat._id });
          console.log(`  Created subcategory: ${sub}`);
        }
      }
    }
    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding:', error);
  } finally {
    mongoose.disconnect();
  }
}

seed();

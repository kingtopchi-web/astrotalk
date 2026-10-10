require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const Expert = require('./models/Expert');
    const Category = require('./models/Category');
    
    const cat = await Category.findOne({name: /doctor/i});
    if(cat) {
      console.log('Found category, id:', cat._id);
      const res = await Expert.updateMany({ specialty: 'doctor' }, { $set: { categoryId: cat._id } });
      console.log('Updated experts:', res.modifiedCount);
    } else {
      console.log('Doctor category not found');
    }
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
});

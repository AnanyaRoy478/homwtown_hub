// Usage: npm run seed   (safe to re-run; it will not duplicate records)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('./config/db');
const User = require('./models/User');
const Community = require('./models/Community');
const Membership = require('./models/Membership');
const Post = require('./models/Post');
const Category = require('./models/Category');

const CATEGORIES = ['Local news', 'Culture & traditions', 'Festivals', 'Help & support', 'Jobs & opportunities', 'Education', 'Health', 'Farming & trade', 'Sports', 'Lost & found'];

const SAMPLE_COMMUNITIES = [
  { name: 'Cuttack Connect', type: 'city', city: 'Cuttack', state: 'Odisha', description: 'For everyone who calls the Silver City home, wherever you live now. Share news, meet-ups and memories.', rules: '1. Be kind and respectful.\n2. No spam or paid promotions.\n3. Verify news before sharing.' },
  { name: 'Puri Heritage Circle', type: 'town', city: 'Puri', state: 'Odisha', description: 'Preserving the traditions, festivals and food of Puri. Rath Yatra planning and cultural stories live here.', rules: '1. Respect all beliefs.\n2. Keep posts relevant to Puri.' },
  { name: 'Sundargarh Village Voice', type: 'village', city: 'Sundargarh', state: 'Odisha', description: 'Village notices, harvest updates and community initiatives for Sundargarh families near and far.', rules: '1. Keep it local.\n2. Share help requests clearly.' },
];

(async () => {
  await connectDB();

  for (const name of CATEGORIES) await Category.updateOne({ name }, { $setOnInsert: { name, kind: 'category' } }, { upsert: true });

  const email = (process.env.ADMIN_EMAIL || 'admin@hometownhub.test').toLowerCase();
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Platform Admin',
      email,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
      hometown: { city: 'Bhubaneswar', state: 'Odisha' },
    });
    console.log(`Created platform admin: ${email}`);
  }

  for (const c of SAMPLE_COMMUNITIES) {
    let doc = await Community.findOne({ name: c.name });
    if (doc) continue;
    doc = await Community.create({ ...c, status: 'approved', createdBy: admin._id, memberCount: 1, joinPolicy: 'open' });
    await Membership.create({ user: admin._id, community: doc._id, role: 'admin', status: 'active' });
    await Post.create({
      community: doc._id,
      author: admin._id,
      type: 'announcement',
      pinned: true,
      title: `Welcome to ${doc.name}`,
      content: 'This is your community space for updates, events and conversations. Introduce yourself and tell us where in town you grew up.',
      category: 'Local news',
    });
    console.log(`Created community: ${doc.name}`);
  }
  console.log('Seed complete');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

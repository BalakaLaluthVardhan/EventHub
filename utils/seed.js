const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment config
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Review = require('../models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college-event-hub';

async function seedDB() {
  console.log('🔌  Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to Database.');

  // 1. Clear database
  console.log('🧹  Cleaning collections...');
  await User.deleteMany({});
  await Event.deleteMany({});
  await Registration.deleteMany({});
  await Review.deleteMany({});
  console.log('🧹  Collections cleared.');

  // 2. Create Admin
  const admin = new User({
    name: 'Balaka Laluth Vardhan',
    email: 'admin@college.edu',
    role: 'admin',
    interests: ['Workshop', 'Hackathon'],
    isProfileComplete: true
  });
  await User.register(admin, 'admin123');

  // 3. Create 5 Hosts/Organizers
  console.log('👤  Creating 5 hosts...');
  const hostData = [
    { name: 'Prof. Rajesh Kumar', email: 'rajesh.organizer@college.edu', role: 'organizer', interests: ['Seminar', 'Workshop'], isProfileComplete: true },
    { name: 'Dr. Amit Patel', email: 'amit.organizer@college.edu', role: 'organizer', interests: ['Workshop', 'Hackathon'], isProfileComplete: true },
    { name: 'Priya Sharma (GDSC Lead)', email: 'priya.organizer@college.edu', role: 'organizer', interests: ['Hackathon', 'Cultural'], isProfileComplete: true },
    { name: 'Vikram Singh', email: 'vikram.organizer@college.edu', role: 'organizer', interests: ['Sports', 'Seminar'], isProfileComplete: true },
    { name: 'Nisha Verma', email: 'nisha.organizer@college.edu', role: 'organizer', interests: ['Cultural', 'Sports'], isProfileComplete: true }
  ];
  const hosts = [];
  for (const h of hostData) {
    const user = new User(h);
    const registered = await User.register(user, 'password');
    hosts.push(registered);
  }
  console.log(`✅  ${hosts.length} hosts created.`);

  // 4. Create 20 Students with Indian Names
  console.log('👤  Creating 20 students...');
  const studentNames = [
    'Aarav Sharma', 'Vihaan Patel', 'Aditya Iyer', 'Arjun Gupta', 'Sai Reddy',
    'Rohan Verma', 'Ishan Joshi', 'Ananya Rao', 'Diya Nair', 'Kiara Choudhury',
    'Rhea Sen', 'Kavya Krishnan', 'Myra Banerjee', 'Kabir Malhotra', 'Ranveer Kapoor',
    'Dev Mishra', 'Tanvi Bhatia', 'Pranav Shah', 'Meera Pillai', 'Yash Deshmukh'
  ];
  const students = [];
  const categoriesList = ['Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports'];
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const email = `${name.toLowerCase().replace(' ', '.')}@college.edu`;
    const user = new User({
      name,
      email,
      role: 'student',
      interests: [
        categoriesList[i % categoriesList.length],
        categoriesList[(i + 2) % categoriesList.length]
      ],
      isProfileComplete: true
    });
    const registered = await User.register(user, 'password');
    students.push(registered);
  }
  console.log(`✅  ${students.length} students created.`);

  // 5. Create 30 Events
  console.log('📅  Creating 30 events...');
  const today = new Date();
  
  const events = [];
  const eventDetails = [
    // 10 Completed/Past Events
    { title: 'Introduction to Web Development', category: 'Workshop', offsetDays: -10, description: 'Learn HTML, CSS, and JS basics.' },
    { title: 'AI/ML Hackathon 2025', category: 'Hackathon', offsetDays: -25, description: '24-hour hackathon to build intelligent applications.' },
    { title: 'Effective Communication Skills', category: 'Seminar', offsetDays: -15, description: 'Seminar on speaking and professional writing.' },
    { title: 'Sargam: Classical Music Night', category: 'Cultural', offsetDays: -5, description: 'An evening of melodious classical Indian music.' },
    { title: 'Inter-College Badminton Tournament', category: 'Sports', offsetDays: -20, description: 'Matches across singles and doubles categories.' },
    { title: 'Introduction to Cybersecurity', category: 'Workshop', offsetDays: -8, description: 'Basic security principles, threat detection and prevention.' },
    { title: 'Smart Campus App Challenge', category: 'Hackathon', offsetDays: -12, description: 'Build innovative apps to solve campus problems.' },
    { title: 'Higher Education in Germany', category: 'Seminar', offsetDays: -18, description: 'An guidance session for studies abroad in Germany.' },
    { title: 'Dramatics Club Annual Play', category: 'Cultural', offsetDays: -3, description: 'Stage performance by the dramatics group.' },
    { title: 'Annual Athletics Meet', category: 'Sports', offsetDays: -30, description: 'Track and field competition events.' },

    // 20 Upcoming Events
    { title: 'Full Stack Development Bootcamp', category: 'Workshop', offsetDays: 5, description: 'Master Node.js, Express and MongoDB in this intensive session.' },
    { title: 'National Blockchain Hackathon', category: 'Hackathon', offsetDays: 12, description: 'Implement decentralized ledger apps to secure identity and finance.' },
    { title: 'Quantum Computing Explained', category: 'Seminar', offsetDays: 8, description: 'Understand qubits, superposition and quantum gates.' },
    { title: 'Spandan: Bollywood Dance Night', category: 'Cultural', offsetDays: 15, description: 'Vibrant Bollywood theme dance night with campus DJs.' },
    { title: 'Inter-Department Football League', category: 'Sports', offsetDays: 20, description: 'The annual department football league clash.' },
    { title: 'Cloud Computing with AWS', category: 'Workshop', offsetDays: 25, description: 'Deploy serverless architectures and host dynamic websites.' },
    { title: 'Game Development Sprint', category: 'Hackathon', offsetDays: 30, description: 'Design and build video games in 48 hours using Unity.' },
    { title: 'Research Paper Writing Seminar', category: 'Seminar', offsetDays: 18, description: 'Tips on structuring research papers and indexing.' },
    { title: 'Canvas: Painting Exhibition', category: 'Cultural', offsetDays: 7, description: 'A platform for students to display their artwork.' },
    { title: 'Table Tennis Championship', category: 'Sports', offsetDays: 10, description: 'Table tennis tournament for students and teachers.' },
    { title: 'Docker and Kubernetes Workshop', category: 'Workshop', offsetDays: 14, description: 'Learn containerization and scale applications.' },
    { title: 'Fintech Hackathon 2026', category: 'Hackathon', offsetDays: 22, description: 'Disrupt traditional banking and payments with software.' },
    { title: 'Resume Writing & Interview Tips', category: 'Seminar', offsetDays: 9, description: 'Step by step guidance on cracking placement interviews.' },
    { title: 'Rock Band Showdown', category: 'Cultural', offsetDays: 28, description: 'Battle of the bands featuring live rock music.' },
    { title: 'College Basketball Tournament', category: 'Sports', offsetDays: 32, description: 'Knockout basketball series across campus teams.' },
    { title: 'UI/UX Design Masterclass', category: 'Workshop', offsetDays: 16, description: 'Design prototypes and user research strategies.' },
    { title: 'AR/VR Hackathon 2026', category: 'Hackathon', offsetDays: 35, description: 'Design immersive virtual reality environments.' },
    { title: 'Entrepreneurship and Startup Panel', category: 'Seminar', offsetDays: 11, description: 'Interactive panel with campus alumni startups.' },
    { title: 'Street Play Competition', category: 'Cultural', offsetDays: 4, description: 'Nukkad Natak competition addressing social issues.' },
    { title: 'Inter-College Chess Tournament', category: 'Sports', offsetDays: 6, description: 'Mind battles on the chess board.' }
  ];

  for (let i = 0; i < eventDetails.length; i++) {
    const detail = eventDetails[i];
    const isCompleted = detail.offsetDays < 0;
    const dateValue = new Date(today.getTime() + detail.offsetDays * 24 * 60 * 60 * 1000);
    
    // Assign organizer round-robin
    const organizer = hosts[i % hosts.length];
    
    const event = new Event({
      title: detail.title,
      description: `${detail.description}\n\nJoin us for this incredible event! All necessary materials and guidance will be provided.`,
      summary: detail.description,
      organizer: organizer._id,
      category: detail.category,
      tags: [detail.category.toLowerCase(), 'campus', 'eventhub'],
      date: dateValue,
      time: '10:00 AM',
      venue: `Hall ${i + 1}, Campus Building`,
      address: `PES University, 100 Feet Ring Rd, Banashankari, Bengaluru, Karnataka 560085`,
      coordinates: {
        lat: 12.971599 + (i * 0.001),
        lng: 77.594563 - (i * 0.001)
      },
      price: i % 3 === 0 ? 100 : 0, // Paid event every 3rd event
      capacity: i % 2 === 0 ? 50 : 100,
      status: isCompleted ? 'completed' : 'open'
    });

    const savedEvent = await event.save();
    events.push(savedEvent);
  }
  console.log(`✅  ${events.length} events created (10 past, 20 upcoming).`);

  // 6. Create Attendee Registrations & Reviews for the 10 completed events
  console.log('⭐  Seeding registrations and reviews for completed events...');
  
  // Pick first 10 events which are completed/past events
  const completedEvents = events.slice(0, 10);
  
  const commentsPool = [
    'Excellent event! Learned a lot and met amazing people.',
    'Very well organized. Highly recommended!',
    'The content was super useful, but the room was a bit small.',
    'Loved the session, the host was extremely knowledgeable.',
    'Good presentation, though some parts were a bit too fast.',
    'Amazing experience, glad I attended this.',
    'Learned some great concepts. Looking forward to the next one!',
    'Nice venue and helpful team members.',
    'Perfect introduction to the topic. Interactive Q&A was nice.',
    'Interesting and engaging. 5 stars!'
  ];

  for (let i = 0; i < completedEvents.length; i++) {
    const event = completedEvents[i];
    
    // We register 3 students as 'attended'
    const attendees = [
      students[i % students.length],
      students[(i + 3) % students.length],
      students[(i + 7) % students.length]
    ];
    
    for (let j = 0; j < attendees.length; j++) {
      const student = attendees[j];
      
      // Create registration
      await Registration.create({
        event: event._id,
        user: student._id,
        status: 'attended'
      });

      // Create review
      await Review.create({
        event: event._id,
        user: student._id,
        rating: 4 + (j % 2), // 4 or 5 stars
        comment: commentsPool[(i + j) % commentsPool.length]
      });
    }

    event.registrationCount = attendees.length;
    await event.save();
  }

  console.log('✅  Registrations and reviews seeded.');

  console.log('\n============================================================');
  console.log('✨  DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('------------------------------------------------------------');
  console.log('👥  Test accounts:');
  console.log('    1. Admin:      admin@college.edu            (admin123)');
  console.log('    2. Host 1:     rajesh.organizer@college.edu (password)');
  console.log('    3. Student 1:  aarav.sharma@college.edu     (password)');
  console.log('============================================================\n');

  await mongoose.disconnect();
}

seedDB().catch(err => {
  console.error('❌  Error seeding database:', err);
  process.exit(1);
});

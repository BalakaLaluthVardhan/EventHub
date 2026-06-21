const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const recommendationService = require('../services/recommendation/recommendationService');
const XLSX = require('xlsx');

/**
 * Main dashboard routing hub by user role
 */
module.exports.index = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (role === 'student') {
      return await renderStudentDashboard(req, res);
    } else if (role === 'organizer') {
      return await renderOrganizerDashboard(req, res);
    } else if (role === 'admin') {
      return await renderAdminDashboard(req, res);
    }
    res.redirect('/');
  } catch (error) {
    next(error);
  }
};

/**
 * 1. Student Dashboard implementation
 */
async function renderStudentDashboard(req, res) {
  const userId = req.user._id;

  // Fetch registrations (registered, waitlisted, attended, etc.)
  const registrations = await Registration.find({ user: userId })
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name' }
    })
    .sort({ registeredAt: -1 });

  // Group events
  const registeredEvents = registrations.filter(r => r.status === 'registered');
  const waitlistedEvents = registrations.filter(r => r.status === 'waitlisted');
  const pastEvents = registrations.filter(r => r.status === 'attended' || (r.event && new Date(r.event.date) < new Date()));

  // Fetch wishlist
  const userWithWishlist = await User.findById(userId).populate({
    path: 'wishlist',
    populate: { path: 'organizer', select: 'name' }
  });
  const wishlist = userWithWishlist ? userWithWishlist.wishlist : [];

  // Get AI recommendations
  const recommendations = await recommendationService.getRecommendations(req.user, 5);

  res.render('dashboard/student', {
    title: 'Student Dashboard - College Event Hub',
    registeredEvents,
    waitlistedEvents,
    pastEvents,
    wishlist,
    recommendations
  });
}

/**
 * 2. Organizer Dashboard implementation
 */
async function renderOrganizerDashboard(req, res) {
  const organizerId = req.user._id;

  // Get all events organized by the user
  const events = await Event.find({ organizer: organizerId }).sort({ date: -1 });

  // Compute overall stats
  const totalEvents = events.length;
  const totalRegistrationsCount = events.reduce((acc, e) => acc + e.registrationCount, 0);

  // Prepare data for dashboard charts (registrations per event and per category)
  const chartCategoryData = {
    Workshop: 0,
    Hackathon: 0,
    Seminar: 0,
    Cultural: 0,
    Sports: 0
  };

  events.forEach(e => {
    chartCategoryData[e.category] = (chartCategoryData[e.category] || 0) + e.registrationCount;
  });

  const eventListWithCounts = [];
  for (const event of events) {
    const totalReg = event.registrationCount;
    const waitlistedCount = await Registration.countDocuments({ event: event._id, status: 'waitlisted' });
    const attendedCount = await Registration.countDocuments({ event: event._id, status: 'attended' });

    eventListWithCounts.push({
      _id: event._id,
      title: event.title,
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue,
      price: event.price,
      capacity: event.capacity,
      status: event.status,
      registrationCount: totalReg,
      waitlistedCount,
      attendedCount
    });
  }

  res.render('dashboard/organizer', {
    title: 'Organizer Dashboard - College Event Hub',
    events: eventListWithCounts,
    totalEvents,
    totalRegistrationsCount,
    chartCategoryData
  });
}

/**
 * 3. Admin Dashboard implementation
 */
async function renderAdminDashboard(req, res) {
  // Compute overall stats
  const totalUsers = await User.countDocuments();
  const studentCount = await User.countDocuments({ role: 'student' });
  const organizerCount = await User.countDocuments({ role: 'organizer' });
  const totalEvents = await Event.countDocuments();
  const totalRegistrations = await Registration.countDocuments({ status: 'registered' });

  // Get list of all users
  const users = await User.find().sort({ createdAt: -1 }).limit(100);

  res.render('dashboard/admin', {
    title: 'Admin Console - College Event Hub',
    totalUsers,
    studentCount,
    organizerCount,
    totalEvents,
    totalRegistrations,
    users
  });
}

/**
 * Organizer: View registrations & mark attendance page for a specific event
 */
module.exports.viewEventRegistrations = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    req.flash('error', 'Event not found.');
    return res.redirect('/dashboard');
  }

  // Check authorization
  if (!event.organizer.equals(req.user._id) && req.user.role !== 'admin') {
    req.flash('error', 'Unauthorized access.');
    return res.redirect('/dashboard');
  }

  const registrations = await Registration.find({ event: id })
    .populate('user', 'name email interests')
    .sort({ registeredAt: 1 });

  res.render('dashboard/event_registrations', {
    title: `Manage: ${event.title}`,
    event,
    registrations
  });
};

/**
 * Organizer: Export registrations list to Excel sheet
 */
module.exports.exportRegistrations = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/dashboard');
    }

    // Check authorization
    if (!event.organizer.equals(req.user._id) && req.user.role !== 'admin') {
      req.flash('error', 'Unauthorized operation.');
      return res.redirect('/dashboard');
    }

    const registrations = await Registration.find({ event: id }).populate('user', 'name email');

    // Compile rows for Excel sheet
    const dataRows = registrations.map((r, index) => ({
      'S.No': index + 1,
      'Attendee Name': r.user ? r.user.name : 'Unknown User',
      'Email ID': r.user ? r.user.email : 'N/A',
      'Status': r.status.toUpperCase(),
      'Registration Date': new Date(r.registeredAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    // Generate Excel Workbook
    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendee Roster');

    // Customize Column widths
    worksheet['!cols'] = [
      { wch: 10 }, // S.No
      { wch: 25 }, // Attendee Name
      { wch: 30 }, // Email ID
      { wch: 15 }, // Status
      { wch: 25 }  // Registration Date
    ];

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Stream download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Attendees.xlsx"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Excel Export Error:', error);
    req.flash('error', 'Failed to generate Excel report.');
    res.redirect('back');
  }
};

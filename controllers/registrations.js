const Registration = require('../models/Registration');
const Event = require('../models/Event');
const emailService = require('../services/email/emailService');

/**
 * Handle one-click registration
 */
module.exports.register = async (req, res) => {
  const { eventId } = req.params;
  const user = req.user;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.status !== 'open') {
      req.flash('error', 'Registrations are closed for this event.');
      return res.redirect(`/events/${eventId}`);
    }

    // Intercept paid events for payment flow
    if (event.price > 0) {
      return res.redirect(`/events/${eventId}/checkout`);
    }

    // Check if already registered (even if cancelled, we can reactive it or update it)
    let existingReg = await Registration.findOne({ event: eventId, user: user._id });
    
    if (existingReg) {
      if (existingReg.status === 'registered' || existingReg.status === 'waitlisted') {
        req.flash('info', 'You are already registered for this event.');
        return res.redirect(`/events/${eventId}`);
      } else if (existingReg.status === 'attended') {
        req.flash('info', 'You have already attended this event.');
        return res.redirect(`/events/${eventId}`);
      }
      // If previous status was 'cancelled', we can handle it by updating below
    }

    // Check capacity
    const activeRegCount = await Registration.countDocuments({ event: eventId, status: 'registered' });

    let status = 'registered';
    let message = 'Registration confirmed! Check your email for details.';

    if (activeRegCount >= event.capacity) {
      status = 'waitlisted';
      message = 'Event is full! You have been added to the waitlist.';
    }

    if (existingReg) {
      existingReg.status = status;
      existingReg.registeredAt = new Date();
      await existingReg.save();
    } else {
      const reg = new Registration({
        event: eventId,
        user: user._id,
        status
      });
      await reg.save();
    }

    if (status === 'registered') {
      // Increment event registration count
      event.registrationCount += 1;
      await event.save();
      
      // Send confirmation email
      await emailService.sendRegistrationConfirmation(user, event);
      req.flash('success', message);
    } else {
      // Send waitlist email
      await emailService.sendWaitlistNotification(user, event);
      req.flash('warning', message);
    }

    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Failed to complete registration.');
    res.redirect(`/events/${eventId}`);
  }
};

/**
 * Cancel registration
 */
module.exports.cancel = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  try {
    const reg = await Registration.findOne({ event: eventId, user: userId });
    if (!reg) {
      req.flash('error', 'Registration record not found.');
      return res.redirect('back');
    }

    const event = await Event.findById(eventId);
    const oldStatus = reg.status;

    // Mark registration as cancelled
    reg.status = 'cancelled';
    await reg.save();

    if (oldStatus === 'registered') {
      // Decrement event registration count
      event.registrationCount = Math.max(0, event.registrationCount - 1);
      await event.save();

      // WAITLIST PROMOTION LOGIC:
      // Promote the next waitlisted user
      const nextInLine = await Registration.findOne({ event: eventId, status: 'waitlisted' })
        .sort({ registeredAt: 1 })
        .populate('user');

      if (nextInLine && nextInLine.user) {
        nextInLine.status = 'registered';
        await nextInLine.save();

        event.registrationCount += 1;
        await event.save();

        // Notify promoted user
        await emailService.sendRegistrationConfirmation(nextInLine.user, event);
        console.log(`Waitlist Promotion: Promoted user ${nextInLine.user.name} for event ${event.title}`);
      }
    }

    req.flash('success', 'Your registration has been cancelled successfully.');
    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error('Cancellation error:', error);
    req.flash('error', 'Failed to cancel registration.');
    res.redirect('back');
  }
};

/**
 * Mark Attendance (Organizer / Admin only)
 */
module.exports.markAttendance = async (req, res) => {
  const { regId } = req.params;
  const { status } = req.body; // 'attended' or 'registered' (absent/reverted)

  try {
    const reg = await Registration.findById(regId).populate('user event');
    if (!reg) {
      req.flash('error', 'Registration record not found.');
      return res.redirect('back');
    }

    const event = reg.event;

    // Verify current user is authorized to mark attendance
    if (!event.organizer.equals(req.user._id) && req.user.role !== 'admin') {
      req.flash('error', 'Unauthorized access.');
      return res.redirect('back');
    }

    const oldStatus = reg.status;
    reg.status = status;
    await reg.save();

    // If status is updated to 'attended', send thank you feedback email
    if (status === 'attended' && oldStatus !== 'attended') {
      await emailService.sendAttendanceNotification(reg.user, event);
    }

    req.flash('success', `Attendance status updated for ${reg.user.name}.`);
    res.redirect('back');
  } catch (error) {
    console.error('Mark attendance error:', error);
    req.flash('error', 'Failed to update attendance.');
    res.redirect('back');
  }
};

/**
 * Render checkout page for paid events
 */
module.exports.renderCheckout = async (req, res) => {
  const { eventId } = req.params;
  const user = req.user;

  try {
    const event = await Event.findById(eventId).populate('organizer', 'name');
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.status !== 'open') {
      req.flash('error', 'Registrations are closed for this event.');
      return res.redirect(`/events/${eventId}`);
    }

    if (event.price <= 0) {
      req.flash('info', 'This event is free. You can register directly.');
      return res.redirect(`/events/${eventId}`);
    }

    // Check if already registered
    const existingReg = await Registration.findOne({ event: eventId, user: user._id });
    if (existingReg && existingReg.status !== 'cancelled') {
      req.flash('info', 'You are already registered for this event.');
      return res.redirect(`/events/${eventId}`);
    }

    res.render('events/checkout', {
      title: `Checkout: ${event.title}`,
      event,
      user
    });
  } catch (error) {
    console.error('Render checkout error:', error);
    req.flash('error', 'Something went wrong loading checkout.');
    res.redirect(`/events/${eventId}`);
  }
};

/**
 * Process checkout payment and register user
 */
module.exports.processCheckout = async (req, res) => {
  const { eventId } = req.params;
  const user = req.user;
  const { cardNumber, cardExpiry, cardCvv, cardholderName } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.status !== 'open') {
      req.flash('error', 'Registrations are closed for this event.');
      return res.redirect(`/events/${eventId}`);
    }

    // Server-side payment details check (mock validation)
    if (!cardNumber || !cardExpiry || !cardCvv || !cardholderName) {
      req.flash('error', 'All payment fields are required.');
      return res.redirect(`/events/${eventId}/checkout`);
    }

    // Verify existing registration status
    let existingReg = await Registration.findOne({ event: eventId, user: user._id });
    if (existingReg && existingReg.status !== 'cancelled') {
      req.flash('info', 'You are already registered for this event.');
      return res.redirect(`/events/${eventId}`);
    }

    // Capacity checking
    const activeRegCount = await Registration.countDocuments({ event: eventId, status: 'registered' });
    let status = 'registered';
    let message = `Payment of ₹${event.price} processed successfully! Registration confirmed.`;

    if (activeRegCount >= event.capacity) {
      status = 'waitlisted';
      message = `Payment of ₹${event.price} processed successfully! You have been added to the waitlist (Event Full).`;
    }

    if (existingReg) {
      existingReg.status = status;
      existingReg.registeredAt = new Date();
      await existingReg.save();
    } else {
      const reg = new Registration({
        event: eventId,
        user: user._id,
        status
      });
      await reg.save();
    }

    if (status === 'registered') {
      event.registrationCount += 1;
      await event.save();
      await emailService.sendRegistrationConfirmation(user, event);
      req.flash('success', message);
    } else {
      await emailService.sendWaitlistNotification(user, event);
      req.flash('warning', message);
    }

    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error('Process checkout error:', error);
    req.flash('error', 'Failed to process payment registration.');
    res.redirect(`/events/${eventId}/checkout`);
  }
};

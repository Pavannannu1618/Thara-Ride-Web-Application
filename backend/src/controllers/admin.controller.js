const User    = require('../models/User');
const Driver  = require('../models/Driver');
const Ride    = require('../models/Ride');
const Payment = require('../models/Payment');

// GET /admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalDrivers, activeRides,
      todayRides, completedRides, cancelledRides,
      revenueAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Driver.countDocuments({ approvalStatus: 'approved' }),
      Ride.countDocuments({ status: { $in: ['accepted','arrived','started'] } }),
      Ride.countDocuments({ createdAt: { $gte: today } }),
      Ride.countDocuments({ status: 'completed', createdAt: { $gte: today } }),
      Ride.countDocuments({ status: 'cancelled', createdAt: { $gte: today } }),
      Payment.aggregate([
        { $match: { status: 'captured', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$commission.platform' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalDrivers, activeRides,
        todayRides, completedRides, cancelledRides,
        todayRevenue: revenueAgg[0]?.total || 0,
      },
    });
  } catch (err) { next(err); }
};

// GET /admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const filter = search
      ? { $or: [{ name: new RegExp(search,'i') }, { phone: new RegExp(search,'i') }] }
      : {};
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: { users, total } });
  } catch (err) { next(err); }
};

// PATCH /admin/users/:id/block
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, data: { isBlocked: user.isBlocked } });
  } catch (err) { next(err); }
};

// PATCH /admin/drivers/:id/approve
exports.approveDriver = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: status },
      { new: true }
    ).populate('user', 'name phone');
    if (!driver) return res.status(404).json({ success: false, error: 'Driver not found' });
    res.json({ success: true, data: { driver } });
  } catch (err) { next(err); }
};

// GET /admin/revenue
exports.getRevenue = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = { status: 'captured' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(to);
    }
    const agg = await Payment.aggregate([
      { $match: match },
      { $group: {
        _id:             { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalRevenue:    { $sum: '$amount' },
        platformRevenue: { $sum: '$commission.platform' },
        driverRevenue:   { $sum: '$commission.driver' },
        count:           { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: { revenue: agg } });
  } catch (err) { next(err); }
};

// GET /admin/rides/live
exports.getLiveRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({
      status: { $in: ['searching','accepted','arrived','started'] },
    })
      .populate('customer', 'name phone')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, data: { rides } });
  } catch (err) { next(err); }
};

// POST /admin/promo
exports.createPromoCode = async (req, res, next) => {
  try {
    const PromoCode = require('../models/PromoCode');
    const promo = await PromoCode.create(req.body);
    res.status(201).json({ success: true, data: { promo } });
  } catch (err) { next(err); }
};
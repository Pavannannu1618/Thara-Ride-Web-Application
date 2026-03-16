const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const Admin    = require('../../models/Admin');
const redis    = require('../../config/redis');
const { protect }     = require('../../middlewares/auth.middleware');
const { authorize }   = require('../../middlewares/role.middleware');
const adminController = require('../../controllers/admin.controller');

const generateTokens = (userId, role) => ({
  accessToken: jwt.sign(
    { id: userId.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  ),
  refreshToken: jwt.sign(
    { id: userId.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  ),
});

// ── POST /api/v1/admin/login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password required' });

    const admin = await Admin.findOne({
      email:    email.toLowerCase().trim(),
      isActive: true,
    }).select('+password');

    if (!admin)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Token carries the actual role e.g. 'superadmin'
    const tokens = generateTokens(admin._id, admin.role);

    console.log('[Admin Login] role in token:', admin.role);

    try {
      const tokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
      await redis.setex('rt:' + admin._id.toString(), 7 * 24 * 60 * 60, tokenHash);
    } catch (e) {
      console.warn('[Admin Login] Redis skipped:', e.message);
    }

    await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

    return res.status(200).json({
      success: true,
      data: {
        admin: {
          _id:   admin._id,
          name:  admin.name,
          email: admin.email,
          role:  admin.role,
        },
        tokens,
      },
    });
  } catch (err) {
    console.error('[Admin Login] Error:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      error:  'Internal server error',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// ── All admin roles allowed ──
const adminGuard = [protect, authorize('admin', 'superadmin', 'support', 'ops')];

router.get('/dashboard',             ...adminGuard, adminController.getDashboard);
router.get('/users',                 ...adminGuard, adminController.getUsers);
router.patch('/users/:id/block',     ...adminGuard, adminController.toggleBlockUser);
router.get('/revenue',               ...adminGuard, adminController.getRevenue);
router.get('/rides/live',            ...adminGuard, adminController.getLiveRides);
router.post('/promo',                ...adminGuard, adminController.createPromoCode);
router.patch('/drivers/:id/approve', ...adminGuard, adminController.approveDriver);

router.get('/drivers', ...adminGuard, async (req, res, next) => {
  try {
    const Driver = require('../../models/Driver');
    const { approvalStatus, page = 1, limit = 20 } = req.query;
    const filter = approvalStatus ? { approvalStatus } : {};
    const [drivers, total] = await Promise.all([
      Driver.find(filter)
        .populate('user',    'name phone email')
        .populate('vehicle')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Driver.countDocuments(filter),
    ]);
    res.json({ success: true, data: { drivers, total } });
  } catch (err) { next(err); }
});

module.exports = router;
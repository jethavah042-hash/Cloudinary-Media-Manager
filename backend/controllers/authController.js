const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail, getOtpEmailTemplate } = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'mern_cloudinary_secret_key_2026',
    {
      expiresIn: '30d'
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Full Name, Email, Password)'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: emailNormalized });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please login.'
      });
    }

    // Public registration MUST ALWAYS set role = 'user' and isBlocked = false
    const user = await User.create({
      name: name.trim(),
      email: emailNormalized,
      password,
      role: 'user',
      isBlocked: false
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please login with your registered account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration: ' + error.message
    });
  }
};

// @desc    Authenticate user & get token (supports User Login & Admin Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, loginType = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    // If user does not exist in MongoDB
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. Please register first.'
      });
    }

    // Check whether account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator.'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check role when attempting Admin Login
    if (loginType === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin account required.'
      });
    }

    // Generate JWT Token
    const token = generateToken(user._id, user.role);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login: ' + error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    return res.json({
      success: true,
      user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user: ' + error.message
    });
  }
};

// @desc    Initiate forgot password by generating and emailing a 6-digit OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address'
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked. Please contact support.'
      });
    }

    // 60-second cooldown check
    if (user.resetPasswordOtpLastSent) {
      const timeSinceLastOtp = Date.now() - new Date(user.resetPasswordOtpLastSent).getTime();
      if (timeSinceLastOtp < 60000) {
        const remainingSeconds = Math.ceil((60000 - timeSinceLastOtp) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} second(s) before requesting another OTP.`,
          retryAfter: remainingSeconds
        });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Save hashed OTP, 10-minute expiry, reset attempts counter
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLastSent = new Date();
    await user.save();

    // Send email with OTP
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - Cloudinary Media Manager',
        text: `Your password reset verification code is: ${otp}. It will expire in 10 minutes.`,
        html: getOtpEmailTemplate(otp, user.name)
      });

      return res.json({
        success: true,
        message: 'OTP has been sent to your email address.'
      });
    } catch (mailError) {
      console.error('[Forgot Password Email Error]:', mailError);
      return res.status(500).json({
        success: false,
        message: mailError.message || 'Failed to send OTP email. Please check server email configuration.'
      });
    }
  } catch (error) {
    console.error('[Forgot Password Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error initiating password reset: ' + error.message
    });
  }
};

// @desc    Verify 6-digit OTP and issue a short-lived reset token
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and OTP'
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP was requested
    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP request found. Please request a new OTP.'
      });
    }

    // Check expiry
    if (new Date(user.resetPasswordOtpExpires).getTime() < Date.now()) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpires = null;
      user.resetPasswordOtpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.'
      });
    }

    // Check max attempts (5 maximum)
    if (user.resetPasswordOtpAttempts >= 5) {
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpires = null;
      user.resetPasswordOtpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. For security, this OTP has been invalidated. Please request a new one.'
      });
    }

    // Hash provided OTP and verify
    const enteredHashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (user.resetPasswordOtp !== enteredHashedOtp) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      await user.save();
      const attemptsLeft = 5 - user.resetPasswordOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining.` : 'Please request a new OTP.'}`
      });
    }

    // OTP is valid: generate a cryptographically secure one-time reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    // Store hashed token with 15-minute expiration and clear OTP
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    return res.json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken: rawResetToken
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification: ' + error.message
    });
  }
};

// @desc    Resend OTP with 60-second cooldown rate limiting
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked. Please contact support.'
      });
    }

    // 60-second rate limit
    if (user.resetPasswordOtpLastSent) {
      const timeSinceLastOtp = Date.now() - new Date(user.resetPasswordOtpLastSent).getTime();
      if (timeSinceLastOtp < 60000) {
        const remainingSeconds = Math.ceil((60000 - timeSinceLastOtp) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} second(s) before requesting another OTP.`,
          retryAfter: remainingSeconds
        });
      }
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordOtpLastSent = new Date();
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: 'New Password Reset OTP - Cloudinary Media Manager',
        text: `Your new password reset verification code is: ${otp}. It will expire in 10 minutes.`,
        html: getOtpEmailTemplate(otp, user.name)
      });

      return res.json({
        success: true,
        message: 'A new OTP has been sent to your email.'
      });
    } catch (mailError) {
      console.error('[Resend OTP Email Error]:', mailError);
      return res.status(500).json({
        success: false,
        message: mailError.message || 'Failed to send OTP email.'
      });
    }
  } catch (error) {
    console.error('[Resend OTP Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resending OTP: ' + error.message
    });
  }
};

// @desc    Reset password using verified resetToken
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, reset token, and new password'
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.resetPasswordToken || !user.resetPasswordTokenExpires) {
      return res.status(400).json({
        success: false,
        message: 'No valid reset session found. Please verify your OTP again.'
      });
    }

    // Check token expiry
    if (new Date(user.resetPasswordTokenExpires).getTime() < Date.now()) {
      user.resetPasswordToken = null;
      user.resetPasswordTokenExpires = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Reset session expired. Please request a new OTP.'
      });
    }

    // Hash provided raw resetToken and compare
    const hashedResetToken = crypto.createHash('sha256').update(resetToken.trim()).digest('hex');
    if (user.resetPasswordToken !== hashedResetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or forged reset token.'
      });
    }

    // Update password (pre-save hook will hash it with bcrypt)
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpires = null;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('[Reset Password Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resetting password: ' + error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  verifyOTP,
  resendOTP,
  resetPassword
};

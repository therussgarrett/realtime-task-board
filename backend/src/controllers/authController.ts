import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { signToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  if (process.env.ALLOW_REGISTRATION === 'false') {
    res.status(403).json({
      success: false,
      message: 'Registration is currently disabled for the live demo. Please use the demo account.',
    });
    return;
  }
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Create user (your pre-save hook hashes password)
    const user = new User({ email, password });
    await user.save();

    // Sign JWT
    const token = signToken(user._id.toString(), user.email);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user._id, email: user.email },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Login attempt:', { email }); //DEBUG

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await User.findOne({ email }) as IUser | null;
    console.log('🔍 User found:', !!user); // DEBUG

    if (!user) {
      console.log('❌ No user found for email:', email); //DEBUG
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password using your comparePassword method
    const isValid = await user.comparePassword(password);
    console.log('🔍 Password valid:', isValid); // DEBUG
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Sign JWT
    const token = signToken(user._id.toString(), user.email);

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user._id, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

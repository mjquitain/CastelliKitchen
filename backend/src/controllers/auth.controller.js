import jwt from 'jsonwebtoken';

export const googleCallback = async (req, res) => {
    try {
        const user = req.user;

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google OAuth callback error:', error);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/login?error=auth_failed`);
    }
};

export const googleAuthFailed = (req, res) => {
    res.status(401).json({ message: 'Google authentication failed' });
};

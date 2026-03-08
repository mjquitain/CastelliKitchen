import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing required environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
}

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                // Check if user exists with same email
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Link Google account to existing user
                    user.googleId = profile.id;
                    user.authProvider = 'google';
                    user.avatar = profile.photos[0]?.value;
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                const nameParts = profile.displayName.split(' ');
                const newUser = await User.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    firstname: nameParts[0] || profile.displayName,
                    lastname: nameParts.slice(1).join(' ') || '',
                    username: profile.emails[0].value.split('@')[0],
                    authProvider: 'google',
                    avatar: profile.photos[0]?.value,
                });

                done(null, newUser);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;

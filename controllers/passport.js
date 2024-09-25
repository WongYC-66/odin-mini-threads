// passport.js
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: GitHubStrategy } = require('passport-github2');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET; // Access JWT secret from environment variables

// Github OAuth 2.0
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.DOMAIN}/users/auth/github/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    console.log({ accessToken, refreshToken }, profile)
    try {
        let user = await prisma.user.findUnique({
            where: { username: profile.username },
            include: { userProfile: true }
        });
        // If user does not exist, create a new one
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: profile.username,
                    password: ' ',
                    userProfile: {
                        create: {
                            firstName: profile.displayName,
                            bio: profile._json.bio,
                            photoURL: profile._json.avatar_url,
                        }
                    }
                },
                include: { userProfile: true },
            });
        }
        return done(null, user);  // Pass the user to be serialized or next
    } catch (err) {
        return done(err, false);
    }
}
));

// Local password straregy
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};
passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: Number(jwt_payload.id) },
            });
            if (user) {
                return done(null, user);    // User is authenticated now
            } else {
                return done(null, false);   // User not found
            }
        } catch (err) {
            return done(err, false);        // Error during authentication
        }
    })
);


// Middleware for JWT authentication with a failure redirect
exports.authenticateJWT = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        const FE_domain = `${req.protocol}://${req.get('host')}`;
        if (err || !user) {
            return res.redirect(`${FE_domain}/sign-in`);
        }
        req.user = user;
        next();
    })(req, res, next);     // magic line
};
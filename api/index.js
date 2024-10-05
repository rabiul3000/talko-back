const express = require('express');
const session = require('express-session');
const TwitterLite = require('twitter-lite');
require('dotenv').config();

const app = express();

// Configure session middleware
app.use(
	session({
		secret: process.env.TWITTER_API_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);

// Initialize Twitter Client with the consumer keys
const twitterClient = new TwitterLite({
	consumer_key: process.env.TWITTER_API_KEY,
	consumer_secret: process.env.TWITTER_API_SECRET,
});

// Route to start the Twitter login (request token)
app.get('/auth/twitter', async (req, res) => {
	try {
		const response = await twitterClient.getRequestToken(
			'/auth/twitter/callback'
		);

		// Store token and token secret in session
		req.session.oauth_token = response.oauth_token;
		req.session.oauth_token_secret = response.oauth_token_secret;

		// Redirect user to Twitter to authenticate
		res.redirect(
			`https://api.twitter.com/oauth/authenticate?oauth_token=${response.oauth_token}`
		);
	} catch (error) {
		console.error('Error getting request token', error);
		res.status(500).send('Error getting request token');
	}
});

// Callback route after user authorizes
app.get('/auth/twitter/callback', async (req, res) => {
	const { oauth_token, oauth_verifier } = req.query;

	if (oauth_token !== req.session.oauth_token) {
		return res.status(400).send('OAuth token mismatch');
	}

	try {
		// Use the stored oauth_token and secret to get the access token
		const response = await twitterClient.getAccessToken({
			oauth_token: req.session.oauth_token,
			oauth_token_secret: req.session.oauth_token_secret,
			oauth_verifier,
		});

		// Store the access token and secret for future API requests
		req.session.access_token = response.oauth_token;
		req.session.access_token_secret = response.oauth_token_secret;
		req.session.user_id = response.user_id;
		req.session.screen_name = response.screen_name;

		// Redirect to dashboard after login
		res.redirect('/dashboard');
	} catch (error) {
		console.error('Error getting access token', error);
		res.status(500).send('Error getting access token');
	}
});

// Route to display user data after login
app.get('/dashboard', (req, res) => {
	if (!req.session.access_token) {
		return res.redirect('/auth/twitter');
	}

	res.send(`Logged in as @${req.session.screen_name}`);
});

// Start server
const port = 6000;
app.listen(port, () => {
	console.log('Server running on http://localhost:' + port);
});

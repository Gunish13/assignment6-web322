const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const productUtil = require('./modules/product-util');
require('dotenv').config();
const mailgun = require('mailgun.js');
const mg = mailgun({ '623424ea 32de8083': process.env.MAILGUN_API_KEY,' sandbox2a2c745b1322440eab80f39e338cdfa5.mailgun.org': process.env.MAILGUN_DOMAIN });

app.set('view engine', 'ejs');
app.set('layout', 'main');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const featuredProducts = productUtil.getFeaturedProducts();
  res.render('home', { featuredProducts });
});

app.get('/inventory', (req, res) => {
  const products = productUtil.getAllProducts();
  const categorizedProducts = productUtil.getProductsByCategory(products);
  res.render('inventory', { categorizedProducts });
});

app.get('/sign-up', (req, res) => res.render('sign-up', { errors: null, firstName: '', lastName: '', email: '', password: '' }));

app.post('/sign-up', (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  let errors = [];

  if (!firstName) errors.push('First Name is required');
  if (!lastName) errors.push('Last Name is required');
  if (!email) errors.push('Email is required');
  else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) errors.push('Invalid email format');
  if (!password) errors.push('Password is required');
  else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/.test(password)) errors.push('Password must be 8-12 characters with a lowercase, uppercase, number, and symbol');

  if (errors.length > 0) {
    return res.render('sign-up', { errors, firstName, lastName, email, password });
  }

  const data = {
    from: 'Gunish Sharma <gsharma110@myseneca.ca>',
    to: email,
    subject: 'Welcome to WoodWorks',
    text: `Hello ${firstName} ${lastName},\n\nWelcome to WoodWorks! I’m Gunish Sharma. Enjoy shopping for high-quality furniture!\n\nBest,\nGunish`
  };

  mg.messages().send(data, (error, body) => {
    if (error) {
      console.error('Mailgun error:', error);
      return res.render('sign-up', { errors: ['Failed to send welcome email'], firstName, lastName, email, password });
    }
    console.log('Email sent:', body);
    res.redirect('/welcome');
  });
});

app.get('/log-in', (req, res) => res.render('log-in', { error: null, email: '' }));

app.post('/log-in', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('log-in', { error: 'Please enter both email and password', email });
  }

  // Placeholder for future authentication (Assignment #4)
  res.redirect('/'); // Temporary redirect
});

app.get('/welcome', (req, res) => res.render('welcome'));

app.listen(8080, () => console.log('Server running on port 8080'));// Added comment
// Email tweak
// Added comment
// Email tweak
// Added comment
// Email tweak

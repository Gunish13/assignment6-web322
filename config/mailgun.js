const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
});

module.exports = {
    sendEmail: async ({ to, subject, html }) => {
        try {
            await mg.messages.create(process.env.MAILGUN_DOMAIN, {
                from: `WoodWorks <mailgun@${process.env.MAILGUN_DOMAIN}>`,
                to: [to],
                subject,
                html
            });
            return true;
        } catch (err) {
            console.error('Error sending email:', err);
            return false;
        }
    }
};
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        var transport = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth:{
                user: "df98fa7359fafc",
                pass:"1908b368f0ea29"
            }
    })
        const emailOptions = {
            from: 'Audio-Store support<support@cineflix.com>',
            to: options.email,
            subject: options.subject,
            text: options.message
        };

        await transport.sendMail(emailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('There was an error sending password reset email. Please try again later');
    }
};

module.exports = sendEmail;
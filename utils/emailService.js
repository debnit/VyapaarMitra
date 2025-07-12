const mailOptions = {
      from: `"VyapaarMitra Platform" <${process.env.EMAIL_USER}>`,
      to: 'info@vyapaarmitra.com',
      subject: `[VyapaarMitra] ${subject}`,
      html: emailContent
    };
const mailOptions = {
      from: `"VyapaarMitra Platform" <${process.env.EMAIL_USER}>`,
      to: 'info@vyapaarmitra.com',
      subject: `[VyapaarMitra] ${subject}`,
      html: emailContent
    };
const reportData = {
    userDetails: {
      name: 'Platform Administrator',
      email: 'info@vyapaarmitra.com'
    },
    businessDetails: analytics
  };
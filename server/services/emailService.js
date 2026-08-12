const nodemailer = require('nodemailer');

let transporter;

const initializeTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('📧 Email transporter initialized.');
  } else {
    console.log('📧 SMTP not configured — emails will be logged to console.');
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@hospitalms.com',
    to,
    subject,
    html,
    text,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('📧 Email send error:', error.message);
      return { success: false, error: error.message };
    }
  } else {
    console.log('📧 [DEV] Email would be sent:', { to, subject });
    return { success: true, dev: true };
  }
};

const sendAppointmentConfirmation = async (appointment, patient, doctor) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏥 Appointment Confirmed</h1>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>${patient.firstName} ${patient.lastName}</strong>,</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
          <p><strong>Date:</strong> ${appointment.appointmentDate}</p>
          <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
          <p><strong>Type:</strong> ${appointment.type}</p>
          <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
        </div>
        <p>Please arrive 15 minutes before your scheduled time.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated message from Hospital Management System.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: patient.email,
    subject: `Appointment Confirmed — ${appointment.appointmentDate} at ${appointment.appointmentTime}`,
    html,
  });
};

const sendAppointmentCancellation = async (appointment, patient, doctor) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Cancelled</h1>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>${patient.firstName} ${patient.lastName}</strong>,</p>
        <p>Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} on <strong>${appointment.appointmentDate}</strong> at <strong>${appointment.appointmentTime}</strong> has been cancelled.</p>
        <p>Please contact us to reschedule if needed.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: patient.email,
    subject: `Appointment Cancelled — ${appointment.appointmentDate}`,
    html,
  });
};

module.exports = { initializeTransporter, sendEmail, sendAppointmentConfirmation, sendAppointmentCancellation };

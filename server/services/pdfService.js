const PDFDocument = require('pdfkit');

const generateInvoicePDF = (bill, patient, payments = []) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(24).fillColor('#667eea').text('Hospital Management System', 50, 50);
      doc.fontSize(10).fillColor('#888').text('123 Medical Center Drive, Healthcare City, HC 10001', 50, 80);
      doc.text('Phone: (555) 123-4567 | Email: billing@hospitalms.com', 50, 95);

      // Invoice title
      doc.moveTo(50, 120).lineTo(550, 120).strokeColor('#eee').stroke();
      doc.fontSize(20).fillColor('#333').text('INVOICE', 50, 135);
      doc.fontSize(10).fillColor('#666');
      doc.text(`Invoice #: ${bill.invoiceNumber}`, 400, 135);
      doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 400, 150);
      doc.text(`Status: ${bill.status.toUpperCase()}`, 400, 165);
      if (bill.dueDate) {
        doc.text(`Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`, 400, 180);
      }

      // Patient info
      doc.fontSize(12).fillColor('#333').text('Bill To:', 50, 160);
      doc.fontSize(10).fillColor('#666');
      doc.text(`${patient.firstName} ${patient.lastName}`, 50, 178);
      if (patient.email) doc.text(patient.email, 50, 193);
      if (patient.phone) doc.text(patient.phone, 50, 208);

      // Items table header
      const tableTop = 240;
      doc.moveTo(50, tableTop).lineTo(550, tableTop).strokeColor('#667eea').lineWidth(2).stroke();
      doc.fontSize(10).fillColor('#667eea');
      doc.text('Item', 55, tableTop + 8);
      doc.text('Description', 180, tableTop + 8);
      doc.text('Qty', 370, tableTop + 8);
      doc.text('Rate', 420, tableTop + 8);
      doc.text('Amount', 480, tableTop + 8);
      doc.moveTo(50, tableTop + 25).lineTo(550, tableTop + 25).strokeColor('#eee').lineWidth(1).stroke();

      // Items
      let yPos = tableTop + 35;
      const items = bill.items || [];
      items.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        doc.rect(50, yPos - 5, 500, 22).fillColor(bgColor).fill();
        doc.fillColor('#333').fontSize(9);
        doc.text(item.name || 'Service', 55, yPos);
        doc.text(item.description || '-', 180, yPos, { width: 180 });
        doc.text(String(item.quantity || 1), 375, yPos);
        doc.text(`$${parseFloat(item.rate || 0).toFixed(2)}`, 420, yPos);
        doc.text(`$${parseFloat(item.amount || 0).toFixed(2)}`, 480, yPos);
        yPos += 22;
      });

      // Totals
      yPos += 15;
      doc.moveTo(350, yPos).lineTo(550, yPos).strokeColor('#eee').stroke();
      yPos += 10;
      doc.fontSize(10).fillColor('#666');
      doc.text('Subtotal:', 370, yPos);
      doc.text(`$${parseFloat(bill.subtotal).toFixed(2)}`, 480, yPos);
      yPos += 18;
      doc.text('Tax:', 370, yPos);
      doc.text(`$${parseFloat(bill.tax).toFixed(2)}`, 480, yPos);
      yPos += 18;
      doc.text('Discount:', 370, yPos);
      doc.text(`-$${parseFloat(bill.discount).toFixed(2)}`, 480, yPos);
      yPos += 22;
      doc.moveTo(350, yPos).lineTo(550, yPos).strokeColor('#667eea').lineWidth(2).stroke();
      yPos += 8;
      doc.fontSize(14).fillColor('#667eea').font('Helvetica-Bold');
      doc.text('Total:', 370, yPos);
      doc.text(`$${parseFloat(bill.totalAmount).toFixed(2)}`, 470, yPos);

      // Payment history
      if (payments.length > 0) {
        yPos += 40;
        doc.fontSize(12).fillColor('#333').font('Helvetica-Bold').text('Payment History', 50, yPos);
        yPos += 20;
        doc.font('Helvetica').fontSize(9).fillColor('#666');
        payments.forEach((payment) => {
          doc.text(
            `${new Date(payment.paidAt).toLocaleDateString()} — $${parseFloat(payment.amount).toFixed(2)} via ${payment.method}${payment.transactionId ? ` (Ref: ${payment.transactionId})` : ''}`,
            50,
            yPos
          );
          yPos += 16;
        });
      }

      // Footer
      doc.fontSize(8).fillColor('#aaa');
      doc.text('Thank you for choosing our hospital. This is a computer-generated invoice.', 50, 750, {
        align: 'center',
        width: 500,
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };

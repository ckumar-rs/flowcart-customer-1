import jsPDF from 'jspdf';
import { Order, Business } from '@/types';

interface ReceiptOptions {
  business?: Business;
  isInvoice?: boolean; // If true, generate invoice; if false, generate receipt
}

/**
 * Calculate tax breakdown for GST (CGST + SGST for same state, IGST for different states)
 */
function calculateTaxBreakdown(subtotal: number, taxRate: number, businessState?: string, customerState?: string): {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
} {
  const isSameState = businessState && customerState && businessState === customerState;
  const totalTax = subtotal * (taxRate / 100);
  
  if (isSameState) {
    // Same state: CGST + SGST (each 50% of tax rate)
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    return { cgst, sgst, igst: 0, totalTax };
  } else {
    // Different state: IGST (full tax)
    return { cgst: 0, sgst: 0, igst: totalTax, totalTax };
  }
}

export const generateOrderReceiptPDF = (order: Order, options: ReceiptOptions = {}): void => {
  const { business, isInvoice } = options;
  const shouldGenerateInvoice = isInvoice || business?.generateInvoice;
  const hasGstDetails = !!(business?.gstNumber || business?.panNumber);
  
  // If invoice requested but no GST details, fall back to receipt
  const generateAsInvoice = shouldGenerateInvoice && hasGstDetails;
  const documentTitle = generateAsInvoice ? 'TAX INVOICE' : 'ORDER RECEIPT';
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header Section
  doc.setFontSize(20);
  doc.setTextColor(29, 130, 142); // Primary color
  doc.text(business?.name || 'FlowCart', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Business Address (for invoice)
  if (generateAsInvoice && business) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const businessAddress = [
      business.addressLine1 || business.address,
      business.addressLine2,
      business.city && business.state ? `${business.city}, ${business.state} ${business.postalCode || ''}`.trim() : business.city || business.state,
      business.country,
    ].filter(Boolean).join(', ');
    
    if (businessAddress) {
      doc.text(businessAddress, pageWidth / 2, yPos, { align: 'center', maxWidth: pageWidth - 40 });
      yPos += 6;
    }
    
    // GST and PAN details
    const taxDetails: string[] = [];
    if (business.gstNumber) taxDetails.push(`GSTIN: ${business.gstNumber}`);
    if (business.panNumber) taxDetails.push(`PAN: ${business.panNumber}`);
    if (business.businessRegistrationNumber) taxDetails.push(`Reg. No: ${business.businessRegistrationNumber}`);
    
    if (taxDetails.length > 0) {
      doc.text(taxDetails.join(' | '), pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }
  }

  // Document Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(documentTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Invoice/Receipt Number and Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(generateAsInvoice ? 'Invoice No:' : 'Order Number:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(order.orderNumber, 80, yPos);
  
  if (generateAsInvoice) {
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', pageWidth - 60, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.createdAt).toLocaleDateString('en-IN'), pageWidth - 20, yPos, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', pageWidth - 60, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }), pageWidth - 20, yPos, { align: 'right' });
  }
  yPos += 10;

  // Customer Information Section
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  if (order.customerName) {
    doc.text(order.customerName, 20, yPos);
    yPos += 7;
  }
  doc.text(`Phone: ${order.customerPhone}`, 20, yPos);
  yPos += 7;
  if (order.customerEmail) {
    doc.text(`Email: ${order.customerEmail}`, 20, yPos);
    yPos += 7;
  }
  yPos += 5;

  // Order Items Table
  doc.setFont('helvetica', 'bold');
  doc.text('Items', 20, yPos);
  doc.text('Qty', 100, yPos);
  doc.text('Rate', 130, yPos);
  doc.text('Amount', pageWidth - 20, yPos, { align: 'right' });
  yPos += 8;
  
  // Draw line
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  order.orderItems.forEach((item) => {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(item.productName, 20, yPos);
    doc.text(item.quantity.toString(), 100, yPos);
    doc.text(`₹${item.unitPrice.toFixed(2)}`, 130, yPos);
    doc.text(`₹${item.totalPrice.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 8;
  });

  yPos += 5;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // Calculate totals
  const subtotal = order.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = order.discountAmount || 0;
  const taxableAmount = subtotal - discount;
  const taxRate = business?.taxRate || 0;
  const showTax = business?.showTax !== false && taxRate > 0;
  
  let taxBreakdown = { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
  if (showTax && generateAsInvoice) {
    taxBreakdown = calculateTaxBreakdown(
      taxableAmount,
      taxRate,
      business?.state,
      undefined // Customer state not available in order
    );
  } else if (showTax) {
    taxBreakdown.totalTax = taxableAmount * (taxRate / 100);
  }

  const deliveryFee = order.deliveryFee || 0;
  const finalTotal = taxableAmount + taxBreakdown.totalTax + deliveryFee;

  // Totals Section
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 60, yPos, { align: 'right' });
  doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 7;

  if (discount > 0) {
    doc.text('Discount:', pageWidth - 60, yPos, { align: 'right' });
    doc.text(`-₹${discount.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 7;
  }

  if (showTax && generateAsInvoice) {
    if (taxBreakdown.cgst > 0) {
      doc.text(`CGST (${(taxRate / 2).toFixed(2)}%):`, pageWidth - 60, yPos, { align: 'right' });
      doc.text(`₹${taxBreakdown.cgst.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 7;
    }
    if (taxBreakdown.sgst > 0) {
      doc.text(`SGST (${(taxRate / 2).toFixed(2)}%):`, pageWidth - 60, yPos, { align: 'right' });
      doc.text(`₹${taxBreakdown.sgst.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 7;
    }
    if (taxBreakdown.igst > 0) {
      doc.text(`IGST (${taxRate.toFixed(2)}%):`, pageWidth - 60, yPos, { align: 'right' });
      doc.text(`₹${taxBreakdown.igst.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 7;
    }
  } else if (showTax && taxBreakdown.totalTax > 0) {
    doc.text(`Tax (${taxRate.toFixed(2)}%):`, pageWidth - 60, yPos, { align: 'right' });
    doc.text(`₹${taxBreakdown.totalTax.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 7;
  }

  if (deliveryFee > 0) {
    doc.text('Delivery Fee:', pageWidth - 60, yPos, { align: 'right' });
    doc.text(`₹${deliveryFee.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 7;
  }

  yPos += 3;
  doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);
  yPos += 7;

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Total Amount:', pageWidth - 60, yPos, { align: 'right' });
  doc.text(`₹${finalTotal.toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 10;

  // Payment Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`Payment Status: ${order.paymentStatus}`, 20, yPos);
  yPos += 6;
  doc.text(`Order Status: ${order.orderStatus}`, 20, yPos);
  yPos += 10;

  // Footer
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your order!', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  if (generateAsInvoice) {
    doc.setFontSize(8);
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save PDF
  const fileName = generateAsInvoice 
    ? `invoice-${order.orderNumber}.pdf`
    : `receipt-${order.orderNumber}.pdf`;
  doc.save(fileName);
};

export const generateOrderInvoicePDF = (order: Order, business?: Business): void => {
  generateOrderReceiptPDF(order, { business, isInvoice: true });
};

export const printOrderReceipt = (order: Order, business?: Business, isInvoice: boolean = false): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the receipt');
    return;
  }

  const shouldGenerateInvoice = isInvoice || business?.generateInvoice;
  const hasGstDetails = !!(business?.gstNumber || business?.panNumber);
  const generateAsInvoice = shouldGenerateInvoice && hasGstDetails;
  const documentTitle = generateAsInvoice ? 'TAX INVOICE' : 'ORDER RECEIPT';

  // Calculate tax
  const subtotal = order.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = order.discountAmount || 0;
  const taxableAmount = subtotal - discount;
  const taxRate = business?.taxRate || 0;
  const showTax = business?.showTax !== false && taxRate > 0;
  const totalTax = showTax ? taxableAmount * (taxRate / 100) : 0;
  const deliveryFee = order.deliveryFee || 0;
  const finalTotal = taxableAmount + totalTax + deliveryFee;

  const businessAddress = business ? [
    business.addressLine1 || business.address,
    business.addressLine2,
    business.city && business.state ? `${business.city}, ${business.state} ${business.postalCode || ''}`.trim() : business.city || business.state,
    business.country,
  ].filter(Boolean).join(', ') : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${documentTitle} - ${order.orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            color: #1d828e;
            margin-bottom: 30px;
          }
          .business-info {
            text-align: center;
            margin-bottom: 20px;
            font-size: 12px;
            color: #666;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 2px solid #1d828e;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .text-right {
            text-align: right;
          }
          .totals {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #1d828e;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .grand-total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #1d828e;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${business?.name || 'FlowCart'}</h1>
          ${businessAddress ? `<div class="business-info">${businessAddress}</div>` : ''}
          ${generateAsInvoice && business?.gstNumber ? `<div class="business-info">GSTIN: ${business.gstNumber}${business.panNumber ? ` | PAN: ${business.panNumber}` : ''}</div>` : ''}
          <h2>${documentTitle}</h2>
        </div>

        <div class="section">
          <div class="section-title">${generateAsInvoice ? 'Invoice' : 'Order'} Details</div>
          <table>
            <tr><td><strong>${generateAsInvoice ? 'Invoice' : 'Order'} Number:</strong></td><td>${order.orderNumber}</td></tr>
            <tr><td><strong>Date:</strong></td><td>${new Date(order.createdAt).toLocaleString('en-US')}</td></tr>
            <tr><td><strong>Status:</strong></td><td>${order.orderStatus}</td></tr>
            <tr><td><strong>Payment Status:</strong></td><td>${order.paymentStatus}</td></tr>
            <tr><td><strong>Payment Method:</strong></td><td>${order.paymentMethod || 'N/A'}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <table>
            ${order.customerName ? `<tr><td><strong>Name:</strong></td><td>${order.customerName}</td></tr>` : ''}
            <tr><td><strong>Phone:</strong></td><td>${order.customerPhone}</td></tr>
            ${order.customerEmail ? `<tr><td><strong>Email:</strong></td><td>${order.customerEmail}</td></tr>` : ''}
          </table>
        </div>

        <div class="section">
          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right">₹${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-₹${discount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${showTax && totalTax > 0 ? `
            <div class="total-row">
              <span>Tax (${taxRate.toFixed(2)}%):</span>
              <span>₹${totalTax.toFixed(2)}</span>
            </div>
            ` : ''}
            ${deliveryFee > 0 ? `
            <div class="total-row">
              <span>Delivery Fee:</span>
              <span>₹${deliveryFee.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Total Amount:</span>
              <span>₹${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>Generated on ${new Date().toLocaleString('en-US')}</p>
          ${generateAsInvoice ? '<p style="font-size: 10px;">This is a computer-generated invoice and does not require a signature.</p>' : ''}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

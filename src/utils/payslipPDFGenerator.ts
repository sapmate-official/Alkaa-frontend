// Types for payslip data
export interface PayslipData {
  month: number;
  year: number;
  monthName: string;
  payDate: string;
  period: string;
  status: string;
  paymentMode: string;
  paymentRef?: string;
  employee: {
    name: string;
    employeeId: string;
    department: string;
    email: string;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      ifscCode: string;
    };
  };
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  basicSalary: number;
  grossPay: number;
  totalDeductions: number;
  netSalary: number;
  earnings: {
    basicSalary: {
      description: string;
      hours: number;
      rate: number;
      current: number;
      ytd: number;
    };
    allowances: Array<{
      description: string;
      current: number;
      ytd: number;
    }>;
    additionalPayments: Array<{
      description: string;
      current: number;
      ytd: number;
    }>;
  };
  deductions: Array<{
    description: string;
    current: number;
    ytd: number;
  }>;
  attendance: {
    workingDays: number;
    presentDays: number;
    halfDays: number;
    absentDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    attendancePercentage: number;
  };
  attendanceDetails?: Record<string, unknown>;
  salaryContext?: Record<string, unknown>;
  ruleContext?: Record<string, unknown>;
  penaltyContext?: Record<string, unknown>;
  ytd: {
    grossPay: number;
    totalDeductions: number;
    netSalary: number;
  };
}

export class PayslipPDFGenerator {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Generate HTML content for payslip
   */
  private static generateHTMLContent(data: PayslipData): string {
    const headerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <h1 style="font-size: 14px; font-weight: bold; margin: 0; font-family: Arial, sans-serif;">${data.company.name}</h1>
          <p style="font-size: 8px; margin: 2px 0; font-family: Arial, sans-serif;">${data.company.address}</p>
          <p style="font-size: 8px; margin: 2px 0; font-family: Arial, sans-serif;">Phone: ${data.company.phone}, Email: ${data.company.email}</p>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; justify-content: flex-end;">
          <div style="font-size: 8px; color: #6b7280; margin-bottom: 4px; font-family: Arial, sans-serif;">Verified with</div>
          <img src="https://res.cloudinary.com/dqdc9yupa/image/upload/v1751231840/Screenshot_2025-06-30_023639_epsllo.png" alt="Company Logo" style="width: 64px; height: 32px; max-width: 96px; max-height: 96px;" />
        </div>
      </div>
    `;

    const employeeInfoHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; border-top: 1px solid #d1d5db; padding-top: 8px;">
        <div>
          <h3 style="padding: 4px; font-weight: 600; font-size: 10px; margin: 0; background: linear-gradient(135deg, rgba(255, 123, 0, 0.3) 0%, rgba(76, 175, 80, 0.3) 100%); font-family: Arial, sans-serif;">Employee Information</h3>
          <p style="font-size: 9px; margin: 4px 0 2px 0; font-family: Arial, sans-serif;"><strong>Full Name:</strong> ${data.employee.name}</p>
          <p style="font-size: 9px; margin: 2px 0; font-family: Arial, sans-serif;"><strong>Employee ID:</strong> ${data.employee.employeeId}</p>
          <p style="font-size: 9px; margin: 2px 0; font-family: Arial, sans-serif;"><strong>Department:</strong> ${data.employee.department}</p>
          <p style="font-size: 9px; margin: 2px 0; font-family: Arial, sans-serif;"><strong>Email:</strong> ${data.employee.email}</p>
        </div>
        <div style="text-align: right;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; padding: 4px; font-weight: 600; font-size: 10px; background: linear-gradient(135deg, rgba(255, 123, 0, 0.3) 0%, rgba(76, 175, 80, 0.3) 100%); font-family: Arial, sans-serif;">
            <div>Pay Date</div>
            <div>Pay Type</div>
            <div>Period</div>
            <div>${data.payDate}</div>
            <div>Monthly</div>
            <div>${data.period}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-top: 4px; font-size: 9px; font-family: Arial, sans-serif;">
            <div><strong>Payroll #:</strong> ${data.paymentRef || 'N/A'}</div>
            <div><strong>Tax Code:</strong> 1250L</div>
            <div><strong>Payment Method:</strong> ${data.paymentMode}</div>
          </div>
        </div>
      </div>
    `;

    const earningsHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="padding: 4px; font-weight: 600; font-size: 10px; margin: 0; background: linear-gradient(135deg, rgba(255, 123, 0, 0.3) 0%, rgba(76, 175, 80, 0.3) 100%); font-family: Arial, sans-serif;">Earnings</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #d1d5db; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; font-weight: 600; height: 30px; line-height: 1.4;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; font-weight: 600; height: 30px; line-height: 1.4;">Hours</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; font-weight: 600; height: 30px; line-height: 1.4;">Rate</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; font-weight: 600; height: 30px; line-height: 1.4;">Current</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; font-weight: 600; height: 30px; line-height: 1.4;">YTD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${data.earnings.basicSalary.description}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${data.earnings.basicSalary.hours}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(data.earnings.basicSalary.rate)}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(data.earnings.basicSalary.current)}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(data.earnings.basicSalary.ytd)}</td>
            </tr>
            ${data.earnings.allowances.map(allowance => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${allowance.description}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">-</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">-</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(allowance.current)}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(allowance.ytd)}</td>
              </tr>
            `).join('')}
            ${data.earnings.additionalPayments.map(payment => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${payment.description}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">-</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">-</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(payment.current)}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(payment.ytd)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #e5e7eb; font-weight: 600;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;" colspan="3">Gross Pay</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">${this.formatCurrency(data.grossPay)}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">${this.formatCurrency(data.ytd.grossPay)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    const deductionsHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="padding: 4px; font-weight: 600; font-size: 10px; margin: 0; background: linear-gradient(135deg, rgba(255, 123, 0, 0.3) 0%, rgba(76, 175, 80, 0.3) 100%); font-family: Arial, sans-serif;">Deductions</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #d1d5db; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">Current</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">YTD</th>
            </tr>
          </thead>
          <tbody>
            ${data.deductions.map(deduction => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${deduction.description}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(deduction.current)}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4;">${this.formatCurrency(deduction.ytd)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #e5e7eb; font-weight: 600;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">Total Deductions</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">${this.formatCurrency(data.totalDeductions)}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; vertical-align: middle; font-family: Arial, sans-serif; height: 30px; line-height: 1.4; font-weight: 600;">${this.formatCurrency(data.ytd.totalDeductions)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    const netPayHTML = `
      <div style="padding: 8px; font-weight: 600; text-align: center; font-size: 10px; margin-bottom: 16px; border: 1px solid #d1d5db; background: linear-gradient(135deg, rgba(255, 123, 0, 0.3) 0%, rgba(76, 175, 80, 0.3) 100%); font-family: Arial, sans-serif;">
        Net Pay: ${this.formatCurrency(data.netSalary)} (YTD: ${this.formatCurrency(data.ytd.netSalary)})
      </div>
    `;

    const footerHTML = `
      <div style="text-align: center; font-size: 9px; margin-top: 16px; font-family: Arial, sans-serif;">
        <p style="margin: 4px 0;">If you have any questions about this payslip, please contact HR.</p>
        <p style="margin: 4px 0;">Payslip generated on ${data.payDate} by ${data.company.name}</p>
      </div>
    `;

    return `
      ${headerHTML}
      ${employeeInfoHTML}
      ${earningsHTML}
      ${deductionsHTML}
      ${netPayHTML}
      ${footerHTML}
    `;
  }

  /**
   * Show preview modal with download option
   */
  static showPreviewModal(data: PayslipData): void {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'payslip-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    // Create header with buttons
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Payslip Preview';
    title.style.cssText = `
      font-size: 1.5rem;
      font-weight: bold;
      margin: 0;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
    `;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download PDF';
    downloadBtn.style.cssText = `
      background-color: #3b82f6;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    `;
    downloadBtn.onmouseover = () => downloadBtn.style.backgroundColor = '#2563eb';
    downloadBtn.onmouseout = () => downloadBtn.style.backgroundColor = '#3b82f6';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      background-color: #6b7280;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    `;
    closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#4b5563';
    closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#6b7280';
    
    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.id = 'payslip-preview-content';
    previewContainer.style.cssText = `
      width: 595px;
      background: white;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin: 0 auto;
      padding: 40px;
      padding-top: 10px;
      font-family: Arial, sans-serif;
    `;
    
    previewContainer.innerHTML = this.generateHTMLContent(data);
    
    // Assemble modal
    buttonContainer.appendChild(downloadBtn);
    buttonContainer.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(buttonContainer);
    modalContent.appendChild(header);
    modalContent.appendChild(previewContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    downloadBtn.addEventListener('click', () => {
      // Show loading state
      downloadBtn.textContent = 'Generating PDF...';
      downloadBtn.disabled = true;
      downloadBtn.style.backgroundColor = '#9ca3af';
      downloadBtn.style.cursor = 'not-allowed';
      
      try {
        this.generatePDFFromPreview(previewContainer, data);
        // Close modal after a short delay to allow PDF generation to start
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        }, 1000);
      } catch (error) {
        console.error('Error starting PDF generation:', error);
        alert('Error starting PDF generation: ' + (error as Error).message);
        // Reset button state
        downloadBtn.textContent = 'Download PDF';
        downloadBtn.disabled = false;
        downloadBtn.style.backgroundColor = '#3b82f6';
        downloadBtn.style.cursor = 'pointer';
      }
    });

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * Generate PDF from preview element - Enhanced version based on demo project
   */
  private static generatePDFFromPreview(element: HTMLElement, data: PayslipData): void {
    // Check if html2canvas and jsPDF are available
    if (!window.html2canvas || !window.jspdf) {
      throw new Error('PDF generation libraries not loaded. Please include html2canvas and jsPDF.');
    }

    const filename = `payslip_${data.employee.name.replace(/\s+/g, '_')}_${data.period}.pdf`;

    // Enhanced options similar to the demo project
    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    // Use html2pdf if available, otherwise fall back to jsPDF + html2canvas
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save();
    } else {
      // Fallback method using jsPDF and html2canvas (similar to demo project)
      window.html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then((canvas: any) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        doc.save(filename);
      }).catch((error: any) => {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
      });
    }
  }

  /**
   * Generate PDF directly from data
   */
  static generatePDF(data: PayslipData): void {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 595px;
      background: white;
      padding: 40px;
      font-family: Arial, sans-serif;
    `;
    
    tempContainer.innerHTML = this.generateHTMLContent(data);
    document.body.appendChild(tempContainer);
    
    try {
      this.generatePDFFromPreview(tempContainer, data);
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  }
}

// Global type declarations for external libraries
declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
    html2pdf: any;
  }
}

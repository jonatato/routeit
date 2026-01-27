import jsPDF from 'jspdf';
import type { SplitExpense, SplitMember, SplitPayment, SplitCategory } from './split';

export async function exportSplitReportToPDF(
  expenses: SplitExpense[],
  members: SplitMember[],
  payments: SplitPayment[],
  categories: SplitCategory[],
  groupName: string,
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'A4',
  });

  let yPosition = 20;

  // Title
  pdf.setFontSize(20);
  pdf.text(`Reporte de Gastos: ${groupName}`, 20, yPosition);
  yPosition += 15;

  // Summary
  pdf.setFontSize(14);
  pdf.text('Resumen', 20, yPosition);
  yPosition += 10;

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  pdf.setFontSize(10);
  pdf.text(`Total de gastos: €${totalExpenses.toFixed(2)}`, 25, yPosition);
  yPosition += 7;
  pdf.text(`Total de pagos: €${totalPayments.toFixed(2)}`, 25, yPosition);
  yPosition += 7;
  pdf.text(`Número de miembros: ${members.length}`, 25, yPosition);
  yPosition += 10;

  // Expenses by category
  if (categories.length > 0) {
    pdf.setFontSize(14);
    pdf.text('Gastos por categoría', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    const categoryTotals = new Map<string, number>();
    expenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.category_id);
      const catName = category?.name || 'Sin categoría';
      categoryTotals.set(catName, (categoryTotals.get(catName) || 0) + Number(expense.amount));
    });

    categoryTotals.forEach((total, category) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`${category}: €${total.toFixed(2)}`, 25, yPosition);
      yPosition += 7;
    });
    yPosition += 5;
  }

  // Recent expenses
  if (expenses.length > 0) {
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Gastos recientes', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    expenses.slice(0, 10).forEach(expense => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      const payer = members.find(m => m.id === expense.payer_id);
      pdf.text(`${expense.title} - €${Number(expense.amount).toFixed(2)} (${payer?.name || 'Desconocido'})`, 25, yPosition);
      yPosition += 7;
    });
  }

  // Generate filename
  const filename = `split_report_${groupName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Save PDF
  pdf.save(filename);
}

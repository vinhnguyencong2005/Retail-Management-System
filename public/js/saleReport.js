// Load invoices from API
async function loadInvoices() {
    try {
        const response = await fetch('/api/invoices');
        const result = await response.json();
        
        if (result.success) {
            const tableBody = document.getElementById('invoicesTable');
            tableBody.innerHTML = '';
            
            let totalAmount = 0;
            
            result.data.forEach(invoice => {
                totalAmount += invoice.TotalAmount;
                
                const date = new Date(invoice.InvoiceDate).toLocaleDateString();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${invoice.ID}</td>
                    <td>${date}</td>
                    <td>${invoice.CustomerID}</td>
                    <td>${invoice.TotalAmount}</td>
                    <td><span class="status ${invoice.Status.toLowerCase()}">${invoice.Status}</span></td>
                `;
                tableBody.appendChild(row);
            });
            
            // Update summary stats
            document.getElementById('totalSales').textContent = totalAmount.toLocaleString();
            document.getElementById('totalInvoices').textContent = result.data.length;
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

// Generate report button click handler
document.querySelector('[data-i18n="generateReport"]').addEventListener('click', loadInvoices);

// Load invoices on page load
document.addEventListener('DOMContentLoaded', loadInvoices);
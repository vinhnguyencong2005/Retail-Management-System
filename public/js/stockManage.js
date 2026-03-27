// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const result = await response.json();
        
        if (result.success) {
            const tableBody = document.getElementById('productsTable');
            tableBody.innerHTML = '';
            
            result.data.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.ID}</td>
                    <td>${product.ProdName}</td>
                    <td>${product.Quantity}</td>
                    <td>${product.Unit}</td>
                    <td>${product.costPrice}</td>
                    <td>${product.salePrice}</td>
                    <td>${product.Note || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-edit">Edit</button>
                        <button class="btn btn-sm btn-delete">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load products on page load
document.addEventListener('DOMContentLoaded', loadProducts);
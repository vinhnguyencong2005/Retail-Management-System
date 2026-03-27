const tabButtons = Array.from(document.querySelectorAll('.subtab-btn'));
const tabPanels = Array.from(document.querySelectorAll('.subtab-panel'));

const invoiceListBody = document.getElementById('invoiceListBody');
const invoiceListEmpty = document.getElementById('invoiceListEmpty');
const refreshInvoicesBtn = document.getElementById('refreshInvoicesBtn');

const createInvoiceForm = document.getElementById('createInvoiceForm');
const invoiceDateInput = document.getElementById('invoiceDate');
const invoiceStatusInput = document.getElementById('invoiceStatus');
const customerNameInput = document.getElementById('customerName');
const customerPhoneInput = document.getElementById('customerPhone');
const shippingFeeInput = document.getElementById('shippingFee');

const createItemsBody = document.getElementById('createItemsBody');
const createItemsEmpty = document.getElementById('createItemsEmpty');
const addItemBtn = document.getElementById('addItemBtn');
const resetInvoiceFormBtn = document.getElementById('resetInvoiceFormBtn');

const subtotalValue = document.getElementById('subtotalValue');
const grandTotalValue = document.getElementById('grandTotalValue');
const createInvoiceMessage = document.getElementById('createInvoiceMessage');

let invoices = [];
let products = [];
let expandedInvoiceId = null;
const invoiceItemsCache = new Map();
const invoiceItemsLoading = new Set();
const invoiceItemsError = new Map();

function formatDateDMY(dateValue) {
	if (!dateValue) {
		return '-';
	}

	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		return String(dateValue);
	}

	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
}

function formatNumber(value) {
	return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

function toMysqlDateTime(localDateTime) {
	if (!localDateTime) {
		return null;
	}

	const date = new Date(localDateTime);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function setDefaultDateTime() {
	const now = new Date();
	now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
	invoiceDateInput.value = now.toISOString().slice(0, 16);
}

function setMessage(message, type = '') {
	createInvoiceMessage.textContent = message;
	createInvoiceMessage.className = 'form-message';

	if (type) {
		createInvoiceMessage.classList.add(type);
	}
}
/////////////////////////// Print functions

function buildPrintInvoice(invoice, items) {
	const printCompanyName = document.getElementById('printCompanyName');
	const printInvoiceDate = document.getElementById('printInvoiceDate');
	const printCustomerName = document.getElementById('printCustomerName');
	const printCustomerPhone = document.getElementById('printCustomerPhone');
	const printStatus = document.getElementById('printStatus');
	const printShippingFee = document.getElementById('printShippingFee');
	const printTotalAmount = document.getElementById('printTotalAmount');

	if (printCompanyName) {
		printCompanyName.textContent = `Invoice #${invoice.ID}`;
	}
	if (printInvoiceDate) {
		printInvoiceDate.textContent = formatDateDMY(invoice.InvoiceDate);
	}
	if (printCustomerName) {
		printCustomerName.textContent = invoice.CustomerName || `Customer #${invoice.CustomerID}`;
	}
	if (printCustomerPhone) {
		printCustomerPhone.textContent = invoice.CustomerPhone || '-';
	}
	if (printStatus) {
		printStatus.textContent = invoice.Status || '-';
	}
	if (printShippingFee) {
		printShippingFee.textContent = formatNumber(invoice.ShippingFee);
	}
	if (printTotalAmount) {
		printTotalAmount.textContent = formatNumber(invoice.TotalAmount);
	}

	const printBody = document.getElementById('printItemsBody');
	if (!printBody) {
		return;
	}

	printBody.innerHTML = '';
	items.forEach((item) => {
		const quantity = Number(item.itemQuantity) || 0;
		const salePrice = Number(item.salePriceIns) || 0;
		const lineTotal = quantity * salePrice;
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${item.ProdName || `Product #${item.ProductID}`}</td>
			<td>${item.Unit || '-'}</td>
			<td>${quantity}</td>
			<td>${formatNumber(salePrice)}</td>
			<td>${formatNumber(lineTotal)}</td>
		`;
		printBody.appendChild(row);
	});
}


async function printCurrentInvoice(invoiceId) {
	const invoice = invoices.find((item) => String(item.ID) === String(invoiceId));
	if (!invoice) {
		return;
	}

	if (!invoiceItemsCache.has(invoiceId) && !invoiceItemsLoading.has(invoiceId)) {
		await loadInvoiceItems(invoiceId);
	}

	const items = invoiceItemsCache.get(invoiceId) || [];
	buildPrintInvoice(invoice, items);
	window.print();
}
/////////////////////////// End of print functions
function toggleTab(tabId) {
	tabButtons.forEach((button) => {
		const isActive = button.dataset.tabTarget === tabId;
		button.classList.toggle('active', isActive);
		button.setAttribute('aria-selected', isActive ? 'true' : 'false');
	});

	tabPanels.forEach((panel) => {
		panel.classList.toggle('active', panel.id === tabId);
	});
}

function renderInvoices() {
	invoiceListBody.innerHTML = '';

	if (!invoices.length) {
		invoiceListEmpty.hidden = false;
		return;
	}

	invoiceListEmpty.hidden = true;

	invoices.forEach((invoice) => {
		const invoiceId = String(invoice.ID);
		const row = document.createElement('tr');
		row.className = 'invoice-main-row';
		row.dataset.invoiceId = String(invoice.ID);
		row.innerHTML = `
			<td>${formatDateDMY(invoice.InvoiceDate)}</td>
			<td>${invoice.CustomerName || `Customer #${invoice.CustomerID}`}</td>
			<td>${formatNumber(invoice.TotalAmount)}</td>
			<td>${formatNumber(invoice.ShippingFee)}</td>
			<td><span class="status ${String(invoice.Status || '').toLowerCase()}">${invoice.Status || '-'}</span></td>
			<td><button type="button" class="btn btn-sm btn-edit view-invoice-btn" data-invoice-id="${invoice.ID}">${expandedInvoiceId === invoiceId ? 'Hide' : 'View'}</button></td>
		`;

		invoiceListBody.appendChild(row);

		if (expandedInvoiceId === invoiceId) {
			const inlineDetailRow = document.createElement('tr');
			inlineDetailRow.className = 'invoice-inline-detail-row';
			const cachedItems = invoiceItemsCache.get(invoiceId) || [];
			const isLoading = invoiceItemsLoading.has(invoiceId);
			const errorMessage = invoiceItemsError.get(invoiceId) || '';

			const detailContent = isLoading
				? '<p class="empty-state">Loading invoice details...</p>'
				: errorMessage
					? `<p class="form-message error">${errorMessage}</p>`
					: `
						<div class="inline-detail-header section-header">
							<h4>Invoice #${invoice.ID}</h4>
							<div class="inline-detail-actions">
								<select class="inline-status-select" data-invoice-id="${invoice.ID}">
									<option value="Unpaid" ${invoice.Status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
									<option value="Paid" ${invoice.Status === 'Paid' ? 'selected' : ''}>Paid</option>
								</select>
								<button type="button" class="btn btn-sm btn-primary inline-update-status-btn" data-invoice-id="${invoice.ID}">Update</button>
								<button type="button" class="btn btn-sm btn-edit inline-print-btn" data-invoice-id="${invoice.ID}">Print</button>
							</div>
						</div>
						<div class="detail-grid inline-detail-grid">
							<p><strong>Date:</strong> ${formatDateDMY(invoice.InvoiceDate)}</p>
							<p><strong>Customer:</strong> ${invoice.CustomerName || `Customer #${invoice.CustomerID}`}</p>
							<p><strong>Phone:</strong> ${invoice.CustomerPhone || '-'}</p>
							<p><strong>Status:</strong> ${invoice.Status || '-'}</p>
							<p><strong>Shipping Fee:</strong> ${formatNumber(invoice.ShippingFee)}</p>
							<p><strong>Total Amount:</strong> ${formatNumber(invoice.TotalAmount)}</p>
						</div>
						<div class="table-wrap">
							<table class="invoices-table invoices-inline-items-table">
								<thead>
									<tr>
										<th>Product</th>
										<th>Quantity</th>
										<th>Cost Price</th>
										<th>Sale Price</th>
										<th>Line Total</th>
									</tr>
								</thead>
								<tbody>
									${cachedItems.length ? cachedItems.map((item) => {
										const quantity = Number(item.itemQuantity) || 0;
										const salePrice = Number(item.salePriceIns) || 0;
										const lineTotal = quantity * salePrice;
										return `
											<tr>
												<td>${item.ProdName || `Product #${item.ProductID}`}</td>
												<td>${quantity}</td>
												<td>${formatNumber(item.costPriceIns)}</td>
												<td>${formatNumber(item.salePriceIns)}</td>
												<td>${formatNumber(lineTotal)}</td>
											</tr>
										`;
									}).join('') : '<tr><td colspan="5" class="empty-state">No invoice items found.</td></tr>'}
								</tbody>
							</table>
						</div>
						<p class="form-message inline-status-message" id="inlineStatusMessage-${invoice.ID}" aria-live="polite"></p>
					`;

			inlineDetailRow.innerHTML = `<td colspan="6"><div class="invoice-inline-detail">${detailContent}</div></td>`;
			invoiceListBody.appendChild(inlineDetailRow);
		}
	});
}

async function loadInvoiceItems(invoiceId) {
	if (invoiceItemsLoading.has(invoiceId)) {
		return;
	}

	invoiceItemsLoading.add(invoiceId);
	invoiceItemsError.delete(invoiceId);
	renderInvoices();

	try {
		const response = await fetch(`/api/invoices/${invoiceId}/items`);
		const result = await response.json();
		if (!result.success) {
			throw new Error(result.message || 'Failed to load invoice items.');
		}
		invoiceItemsCache.set(invoiceId, result.data || []);
	} catch (error) {
		console.error('Error loading invoice items:', error);
		invoiceItemsCache.set(invoiceId, []);
		invoiceItemsError.set(invoiceId, error.message || 'Failed to load invoice items.');
	} finally {
		invoiceItemsLoading.delete(invoiceId);
		renderInvoices();
	}
}

async function loadInvoices() {
	try {
		const response = await fetch('/api/invoices');
		const result = await response.json();
		invoices = result.success ? result.data : [];
	} catch (error) {
		invoices = [];
		console.error('Error loading invoices:', error);
	}

	renderInvoices();
}

async function toggleInlineInvoiceDetail(invoiceId) {
	if (expandedInvoiceId === String(invoiceId)) {
		expandedInvoiceId = null;
		renderInvoices();
		return;
	}

	expandedInvoiceId = String(invoiceId);
	renderInvoices();

	if (!invoiceItemsCache.has(String(invoiceId))) {
		await loadInvoiceItems(String(invoiceId));
	}
}

async function updateInvoiceStatus(invoiceId) {
	const statusSelect = invoiceListBody.querySelector(`.inline-status-select[data-invoice-id="${invoiceId}"]`);
	const statusButton = invoiceListBody.querySelector(`.inline-update-status-btn[data-invoice-id="${invoiceId}"]`);
	const statusMessage = document.getElementById(`inlineStatusMessage-${invoiceId}`);

	if (!statusSelect || !statusButton) {
		return;
	}

	statusButton.disabled = true;
	if (statusMessage) {
		statusMessage.textContent = '';
		statusMessage.className = 'form-message inline-status-message';
	}

	try {
		const response = await fetch(`/api/invoices/${invoiceId}/status`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ status: statusSelect.value })
		});
		const result = await response.json();

		if (!result.success) {
			throw new Error(result.message || 'Failed to update payment status.');
		}

		if (statusMessage) {
			statusMessage.textContent = 'Payment status updated.';
			statusMessage.classList.add('success');
		}

		await loadInvoices();
		expandedInvoiceId = String(invoiceId);
		renderInvoices();
	} catch (error) {
		console.error('Error updating payment status:', error);
		if (statusMessage) {
			statusMessage.textContent = error.message || 'Failed to update payment status.';
			statusMessage.classList.add('error');
		}
	} finally {
		statusButton.disabled = false;
	}
}

async function loadProducts() {
	try {
		const response = await fetch('/api/products');
		const result = await response.json();
		products = result.success ? result.data : [];
	} catch (error) {
		products = [];
		console.error('Error loading products:', error);
	}
}

function buildProductOptions(selectedProductId = '') {
	const options = products.map((product) => {
		const selected = String(product.ID) === String(selectedProductId) ? 'selected' : '';
		return `<option value="${product.ID}" ${selected}>${product.ProdName}</option>`;
	});

	return `<option value="">Select product</option>${options.join('')}`;
}

function createItemRow(selectedProductId = '') {
	const row = document.createElement('tr');
	row.innerHTML = `
		<td>
			<select class="item-product-select" required>
				${buildProductOptions(selectedProductId)}
			</select>
		</td>
		<td class="item-available">0</td>
		<td><input class="item-input item-quantity" type="number" min="0.01" step="0.01" value="1" required></td>
		<td><input class="item-input item-cost" type="number" min="0" step="1" value="0" required></td>
		<td><input class="item-input item-sale" type="number" min="0" step="1" value="0" required></td>
		<td class="item-total">0</td>
		<td><button type="button" class="btn btn-sm btn-delete remove-item-btn">Remove</button></td>
	`;

	createItemsBody.appendChild(row);
	syncItemRow(row);
	refreshCreateSummary();
}

function syncItemRow(row) {
	const productSelect = row.querySelector('.item-product-select');
	const availableCell = row.querySelector('.item-available');
	const quantityInput = row.querySelector('.item-quantity');
	const costInput = row.querySelector('.item-cost');
	const saleInput = row.querySelector('.item-sale');

	const selectedProduct = products.find((product) => String(product.ID) === String(productSelect.value));

	if (selectedProduct) {
		availableCell.textContent = String(selectedProduct.Quantity ?? 0);
		if (!costInput.dataset.userEdited) {
			costInput.value = Number(selectedProduct.costPrice) || 0;
		}
		if (!saleInput.dataset.userEdited) {
			saleInput.value = Number(selectedProduct.salePrice) || 0;
		}

		const maxQty = Number(selectedProduct.Quantity) || 0;
		quantityInput.max = String(maxQty);
	} else {
		availableCell.textContent = '0';
		quantityInput.removeAttribute('max');
	}

	const quantity = Number(quantityInput.value) || 0;
	const salePrice = Number(saleInput.value) || 0;
	const lineTotal = quantity * salePrice;
	row.querySelector('.item-total').textContent = formatNumber(lineTotal);
}

function refreshCreateSummary() {
	const rows = Array.from(createItemsBody.querySelectorAll('tr'));
	const subtotal = rows.reduce((total, row) => {
		const quantity = Number(row.querySelector('.item-quantity')?.value) || 0;
		const salePrice = Number(row.querySelector('.item-sale')?.value) || 0;
		return total + quantity * salePrice;
	}, 0);

	const shippingFee = Number(shippingFeeInput.value) || 0;
	subtotalValue.textContent = formatNumber(subtotal);
	grandTotalValue.textContent = formatNumber(subtotal + shippingFee);

	createItemsEmpty.hidden = rows.length > 0;
}

function resetCreateForm() {
	createInvoiceForm.reset();
	setDefaultDateTime();
	invoiceStatusInput.value = 'Unpaid';
	shippingFeeInput.value = '0';
	createItemsBody.innerHTML = '';
	setMessage('');
	createItemRow();
	refreshCreateSummary();
}

function collectInvoiceItems(customerName) {
	const rows = Array.from(createItemsBody.querySelectorAll('tr'));

	return rows.map((row) => {
		const productId = Number(row.querySelector('.item-product-select').value);
		const itemQuantity = Number(row.querySelector('.item-quantity').value);
		const costPriceIns = Number(row.querySelector('.item-cost').value);
		const salePriceIns = Number(row.querySelector('.item-sale').value);

		return {
			ProductID: productId,
			customer: customerName,
			itemQuantity,
			costPriceIns,
			salePriceIns
		};
	});
}

function validateInvoiceItems(items) {
	if (!items.length) {
		return 'Please add at least one invoice item.';
	}

	const hasInvalid = items.some((item) => !item.ProductID || item.itemQuantity <= 0 || item.salePriceIns < 0 || item.costPriceIns < 0);
	if (hasInvalid) {
		return 'Please complete all item rows with valid values.';
	}

	return null;
}

async function submitCreateInvoice(event) {
	event.preventDefault();
	setMessage('');

	const customerName = customerNameInput.value.trim();
	if (!customerName) {
		setMessage('Customer name is required.', 'error');
		return;
	}

	const invoiceDate = toMysqlDateTime(invoiceDateInput.value);
	if (!invoiceDate) {
		setMessage('Invoice date is invalid.', 'error');
		return;
	}

	const shippingFee = Number(shippingFeeInput.value) || 0;
	const invoiceItems = collectInvoiceItems(customerName);
	const validationError = validateInvoiceItems(invoiceItems);
	if (validationError) {
		setMessage(validationError, 'error');
		return;
	}

	const subtotal = invoiceItems.reduce((sum, item) => sum + (item.itemQuantity * item.salePriceIns), 0);
	const payload = {
		invoiceData: {
			InvoiceDate: invoiceDate,
			Status: invoiceStatusInput.value,
			TotalAmount: Math.round(subtotal),
			ShippingFee: Math.round(shippingFee),
			CustomerName: customerName,
			CustomerPhone: customerPhoneInput.value.trim() || null
		},
		invoiceItems
	};

	try {
		const response = await fetch('/api/invoices', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (!result.success) {
			throw new Error(result.message || 'Failed to create invoice.');
		}

		setMessage(`Invoice #${result.invoiceID} created successfully.`, 'success');
		await Promise.all([loadInvoices(), loadProducts()]);
		toggleTab('invoice-list-tab');
		resetCreateForm();
	} catch (error) {
		console.error('Error creating invoice:', error);
		setMessage(error.message || 'Failed to create invoice.', 'error');
	}
}

function handleCreateItemsEvents(event) {
	const row = event.target.closest('tr');
	if (!row) {
		return;
	}

	if (event.target.classList.contains('remove-item-btn')) {
		row.remove();
		refreshCreateSummary();
		return;
	}

	if (event.target.classList.contains('item-cost') || event.target.classList.contains('item-sale')) {
		event.target.dataset.userEdited = 'true';
	}

	if (
		event.target.classList.contains('item-product-select') ||
		event.target.classList.contains('item-quantity') ||
		event.target.classList.contains('item-cost') ||
		event.target.classList.contains('item-sale')
	) {
		syncItemRow(row);
		refreshCreateSummary();
	}
}

function bindEvents() {
	tabButtons.forEach((button) => {
		button.addEventListener('click', () => {
			toggleTab(button.dataset.tabTarget);
		});
	});

	refreshInvoicesBtn.addEventListener('click', loadInvoices);

	invoiceListBody.addEventListener('click', (event) => {
		const viewButton = event.target.closest('.view-invoice-btn');
		if (viewButton?.dataset.invoiceId) {
			toggleInlineInvoiceDetail(viewButton.dataset.invoiceId);
			return;
		}

		const updateButton = event.target.closest('.inline-update-status-btn');
		if (updateButton?.dataset.invoiceId) {
			updateInvoiceStatus(updateButton.dataset.invoiceId);
			return;
		}

		const printButton = event.target.closest('.inline-print-btn');
		if (printButton?.dataset.invoiceId) {
			printCurrentInvoice(printButton.dataset.invoiceId);
			return;
		}
	});

	addItemBtn.addEventListener('click', () => {
		createItemRow();
	});

	createItemsBody.addEventListener('click', handleCreateItemsEvents);
	createItemsBody.addEventListener('input', handleCreateItemsEvents);
	shippingFeeInput.addEventListener('input', refreshCreateSummary);

	resetInvoiceFormBtn.addEventListener('click', resetCreateForm);
	createInvoiceForm.addEventListener('submit', submitCreateInvoice);
}

async function initPage() {
	setDefaultDateTime();
	bindEvents();
	await Promise.all([loadProducts(), loadInvoices()]);
	createItemRow();
}

initPage();

// Menu items data with prices
const menuItems = {
    'veg-burger': { name: 'Veg Burger', price: 199 },
    'chicken-burger': { name: 'Chicken Burger', price: 299 },
    'french-fries': { name: 'French Fries', price: 149 },
    'pizza': { name: 'Pizza', price: 499 },
    'soft-drink': { name: 'Soft Drink', price: 89 }
};

// Mobile number validation
function validateMobileNumber(mobileNumber) {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobileNumber);
}

// Function to update quantity and total
function updateQuantity(itemId, change) {
    const qtyInput = document.getElementById(`${itemId}-qty`);
    let currentQty = parseInt(qtyInput.value);
    
    // Calculate new quantity (min 0)
    let newQty = Math.max(0, currentQty + change);
    qtyInput.value = newQty;
    
    // Update total and items JSON
    updateTotal();
}

// Calculate total and update hidden fields
function updateTotal() {
    let total = 0;
    const orderItems = [];
    
    // Loop through all menu items
    Object.keys(menuItems).forEach(itemId => {
        const qtyInput = document.getElementById(`${itemId}-qty`);
        const quantity = parseInt(qtyInput.value);
        
        if (quantity > 0) {
            const { name, price } = menuItems[itemId];
            const itemTotal = quantity * price;
            total += itemTotal;
            
            orderItems.push({
                name: name,
                quantity: quantity,
                price: price
            });
        }
    });
    
    // Update total display
    document.getElementById('order_total').textContent = total.toFixed(2);
    
    // Update hidden fields
    document.getElementById('total_amount').value = total;
    document.getElementById('items').value = JSON.stringify(orderItems);
}

// Order Management Functions
async function placeOrder(orderData) {
    try {
        const response = await fetch('/api/place_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
}

async function processOrder() {
    try {
        const response = await fetch('/api/process_order', {
            method: 'POST'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error processing order:', error);
        throw error;
    }
}

async function getOrderHistory(mobileNumber = null) {
    try {
        let url = '/api/order_history';
        if (mobileNumber) {
            url += `?mobile_number=${mobileNumber}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching order history:', error);
        throw error;
    }
}

async function getCustomerRecords() {
    try {
        const response = await fetch('/api/customer_records');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching customer records:', error);
        throw error;
    }
}

async function getPendingOrders() {
    try {
        const response = await fetch('/api/pending_orders');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        throw error;
    }
}

// UI Update Functions
function updateOrderHistory(orders) {
    const historyContainer = document.getElementById('orderHistory');
    if (!historyContainer) return;

    historyContainer.innerHTML = orders.map(order => `
        <div class="order-card">
            <h3>Order #${order.order_id}</h3>
            <p>Customer: ${order.customer_name}</p>
            <p>Mobile: ${order.mobile_number}</p>
            <p>Table: ${order.table_number || 'N/A'}</p>
            <p>Total: ₹${order.total_amount}</p>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.name}</span>
                        <span>${item.quantity}x</span>
                        <span>₹${item.price}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function updateCustomerRecords(records) {
    const recordsContainer = document.getElementById('customerRecords');
    if (!recordsContainer) return;

    recordsContainer.innerHTML = records.map(record => `
        <div class="customer-card">
            <h3>${record.customer_name}</h3>
            <p>Total Orders: ${record.total_orders}</p>
            <p>Total Spent: ₹${record.total_spent}</p>
        </div>
    `).join('');
}

function updatePendingOrders(orders) {
    const pendingContainer = document.getElementById('pendingOrders');
    if (!pendingContainer) return;

    pendingContainer.innerHTML = orders.map(order => `
        <div class="order-card pending">
            <h3>Order #${order.order_id}</h3>
            <p>Customer: ${order.customer_name}</p>
            <p>Mobile: ${order.mobile_number}</p>
            <p>Table: ${order.table_number || 'N/A'}</p>
            <p>Total: ₹${order.total_amount}</p>
            <button onclick="handleProcessOrder()" class="process-btn">Process Order</button>
        </div>
    `).join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize data
    try {
        const [records, pending] = await Promise.all([
            getCustomerRecords(),
            getPendingOrders()
        ]);
        
        updateCustomerRecords(records);
        updatePendingOrders(pending);
    } catch (error) {
        console.error('Error initializing data:', error);
    }
});

// Handle order form submission
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const customerName = document.getElementById('customer_name').value;
        const tableNumber = document.getElementById('table_number').value;
        const mobileNumber = document.getElementById('mobile_number').value;
        const items = JSON.parse(document.getElementById('items').value);
        const totalAmount = parseFloat(document.getElementById('total_amount').value);
        
        if (items.length === 0) {
            alert('Please select at least one item');
            return;
        }
        
        if (!tableNumber) {
            alert('Please select a table number');
            return;
        }

        if (!validateMobileNumber(mobileNumber)) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }
        
        const orderData = {
            customer_name: customerName,
            table_number: tableNumber,
            mobile_number: mobileNumber,
            items: items,
            total_amount: totalAmount
        };

        try {
            const result = await placeOrder(orderData);
            
            // Show success message
            alert(`Order #${result.order_id} placed successfully!`);
            
            // Refresh data and show order history for this mobile number
            const [history, records, pending] = await Promise.all([
                getOrderHistory(mobileNumber),
                getCustomerRecords(),
                getPendingOrders()
            ]);
            
            updateOrderHistory(history);
            updateCustomerRecords(records);
            updatePendingOrders(pending);
            
            // Reset form
            orderForm.reset();
            resetOrderItems();
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order. Please try again.');
        }
    });
}

// Reset order items
function resetOrderItems() {
    Object.keys(menuItems).forEach(itemId => {
        const qtyInput = document.getElementById(`${itemId}-qty`);
        qtyInput.value = 0;
    });
    updateTotal();
}

// Function to handle order button click
function showOrderForm() {
    // Scroll to the order management section
    const orderSection = document.querySelector('.order-management-section');
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });
        // Focus on the customer name input
        setTimeout(() => {
            document.getElementById('customer_name').focus();
        }, 500);
    }
}

// Handle processing an order
async function handleProcessOrder() {
    try {
        const result = await processOrder();
        
        // Get the mobile number from the processed order
        const mobileNumber = result.order.mobile_number;
        
        // Refresh all data after processing
        const [history, records, pending] = await Promise.all([
            getOrderHistory(mobileNumber),
            getCustomerRecords(),
            getPendingOrders()
        ]);
        
        updateOrderHistory(history);
        updateCustomerRecords(records);
        updatePendingOrders(pending);
        
        // Show success message
        alert(`Order #${result.order_id} for ${result.customer_name} processed successfully!`);
    } catch (error) {
        console.error('Error processing order:', error);
        alert('Error processing order. Please try again.');
    }
}

// Manager's View Functions
function refreshManagerView() {
    // Show loading state
    document.getElementById('todaysOrders').innerHTML = '<p class="text-center">Loading...</p>';
    document.getElementById('customerRecords').innerHTML = '<p class="text-center">Loading...</p>';

    // Fetch both today's orders and customer records
    Promise.all([
        fetch('/api/todays_orders').then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }),
        fetch('/api/customer_records').then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
    ])
    .then(([orders, customers]) => {
        if (!Array.isArray(orders) || !Array.isArray(customers)) {
            throw new Error('Invalid data received');
        }
        console.log('Received orders:', orders);
        console.log('Received customers:', customers);
        displayTodaysOrders(orders);
        displayCustomerRecords(customers);
        updateManagerStats(orders, customers);
    })
    .catch(error => {
        console.error('Error refreshing manager view:', error);
        document.getElementById('todaysOrders').innerHTML = 
            '<p class="text-danger text-center">Error loading data. Please try again.</p>';
        document.getElementById('customerRecords').innerHTML = 
            '<p class="text-danger text-center">Error loading data. Please try again.</p>';
    });
}

function displayTodaysOrders(orders) {
    const todaysOrdersContainer = document.getElementById('todaysOrders');
    todaysOrdersContainer.innerHTML = '';

    if (!orders || orders.length === 0) {
        todaysOrdersContainer.innerHTML = '<p class="text-muted text-center">No orders for today yet.</p>';
        return;
    }

    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        orderElement.innerHTML = `
            <div class="order-header">
                <span class="order-id">Order #${order.order_id}</span>
            </div>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Table:</strong> ${order.table_number}</p>
                <p><strong>Items:</strong> ${order.items.length}</p>
                <p><strong>Total:</strong> ₹${order.total_amount.toFixed(2)}</p>
            </div>
        `;
        todaysOrdersContainer.appendChild(orderElement);
    });
}

function displayCustomerRecords(customers) {
    const customerRecordsContainer = document.getElementById('customerRecords');
    customerRecordsContainer.innerHTML = '';

    if (!customers || customers.length === 0) {
        customerRecordsContainer.innerHTML = '<p class="text-muted text-center">No customer records yet.</p>';
        return;
    }

    customers.forEach(customer => {
        const customerElement = document.createElement('div');
        customerElement.className = 'customer-item';
        customerElement.innerHTML = `
            <div class="customer-header">
                <span class="customer-name">${customer.customer_name}</span>
            </div>
            <div class="customer-details">
                <p><strong>Total Orders:</strong> ${customer.total_orders}</p>
                <p><strong>Total Spent:</strong> ₹${customer.total_spent.toFixed(2)}</p>
                <p><strong>Average Order:</strong> ₹${(customer.total_spent / customer.total_orders).toFixed(2)}</p>
            </div>
        `;
        customerRecordsContainer.appendChild(customerElement);
    });
}

function updateManagerStats(orders, customers) {
    try {
        // Calculate totals
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            const amount = parseFloat(order.total_amount);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        const totalCustomers = customers.length;

        // Update the display
        const totalOrdersElement = document.getElementById('totalOrdersToday');
        const totalRevenueElement = document.getElementById('totalRevenueToday');
        const totalCustomersElement = document.getElementById('totalCustomers');

        if (totalOrdersElement) totalOrdersElement.textContent = totalOrders;
        if (totalRevenueElement) totalRevenueElement.textContent = `₹${totalRevenue.toFixed(2)}`;
        if (totalCustomersElement) totalCustomersElement.textContent = totalCustomers;

        console.log('Stats updated:', { totalOrders, totalRevenue, totalCustomers });
    } catch (error) {
        console.error('Error updating manager stats:', error);
    }
}

// Auto-refresh manager view every 30 seconds
let refreshInterval = setInterval(refreshManagerView, 30000);

// Initial load of manager view
document.addEventListener('DOMContentLoaded', () => {
    refreshManagerView();
}); 

// Menu items data with prices
const menuItems = {
    'veg-burger': { name: 'Veg Burger', price: 199 },
    'chicken-burger': { name: 'Chicken Burger', price: 299 },
    'french-fries': { name: 'French Fries', price: 149 },
    'pizza': { name: 'Pizza', price: 499 },
    'soft-drink': { name: 'Soft Drink', price: 89 }
};

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

async function getOrderHistory() {
    try {
        const response = await fetch('/api/order_history');
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
        const [history, records, pending] = await Promise.all([
            getOrderHistory(),
            getCustomerRecords(),
            getPendingOrders()
        ]);
        
        updateOrderHistory(history);
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
        
        const orderData = {
            customer_name: customerName,
            table_number: tableNumber,
            items: items,
            total_amount: totalAmount
        };

        try {
            const result = await placeOrder(orderData);
            
            // Show success message
            alert(`Order #${result.order_id} placed successfully!`);
            
            // Refresh data
            const [history, records, pending] = await Promise.all([
                getOrderHistory(),
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
        
        // Refresh all data after processing
        const [history, records, pending] = await Promise.all([
            getOrderHistory(),
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
from flask import Flask, request, jsonify, render_template, send_file
from collections import deque
from typing import List, Dict
import json
import os

app = Flask(__name__)

# Data Structures
class Order:
    def __init__(self, order_id: int, customer_name: str, table_number: str, items: List[Dict], total_amount: float):
        self.order_id = order_id
        self.customer_name = customer_name
        self.table_number = table_number
        self.items = items
        self.total_amount = total_amount

# Stack for order history (LIFO)
order_history = []

# Queue for pending orders (FIFO)
pending_orders = deque()

# Array for customer records
customer_records = []

# Counter for order IDs
order_counter = 1

@app.route('/')
def index():
    return send_file('Home.html')

@app.route('/Home.css')
def css():
    return send_file('Home.css')

@app.route('/script.js')
def js():
    return send_file('script.js')

@app.route('/api/place_order', methods=['POST'])
def place_order():
    global order_counter
    data = request.json
    
    # Create new order
    new_order = Order(
        order_id=order_counter,
        customer_name=data['customer_name'],
        table_number=data['table_number'],
        items=data['items'],
        total_amount=data['total_amount']
    )
    
    # Add to pending orders queue
    pending_orders.append(new_order)
    
    # Check if customer already exists in records
    customer_found = False
    for record in customer_records:
        if record['customer_name'].lower() == new_order.customer_name.lower():
            # Update existing customer record
            record['total_orders'] += 1
            record['total_spent'] += new_order.total_amount
            customer_found = True
            break
    
    # If customer not found, add new record
    if not customer_found:
        customer_records.append({
            'order_id': new_order.order_id,
            'customer_name': new_order.customer_name,
            'total_orders': 1,
            'total_spent': new_order.total_amount
        })
    
    order_counter += 1
    return jsonify({'message': 'Order placed successfully', 'order_id': new_order.order_id})

@app.route('/api/process_order', methods=['POST'])
def process_order():
    if not pending_orders:
        return jsonify({'message': 'No pending orders'}), 404
    
    # Get next order from queue
    current_order = pending_orders.popleft()
    
    # Add to order history stack
    order_history.append(current_order)
    
    return jsonify({
        'message': 'Order processed successfully',
        'order_id': current_order.order_id,
        'customer_name': current_order.customer_name,
        'table_number': current_order.table_number
    })

@app.route('/api/order_history', methods=['GET'])
def get_order_history():
    return jsonify([{
        'order_id': order.order_id,
        'customer_name': order.customer_name,
        'table_number': order.table_number,
        'items': order.items,
        'total_amount': order.total_amount
    } for order in order_history])

@app.route('/api/customer_records', methods=['GET'])
def get_customer_records():
    return jsonify(customer_records)

@app.route('/api/pending_orders', methods=['GET'])
def get_pending_orders():
    return jsonify([{
        'order_id': order.order_id,
        'customer_name': order.customer_name,
        'table_number': order.table_number,
        'items': order.items,
        'total_amount': order.total_amount
    } for order in pending_orders])

if __name__ == '__main__':
    app.run(debug=True) 
from flask import Flask, request, jsonify, render_template, send_file
from collections import deque
from typing import List, Dict
import json
import os
from dataclasses import dataclass, asdict
from decimal import Decimal

app = Flask(__name__)

@dataclass
class Order:
    order_id: int
    customer_name: str
    table_number: str
    mobile_number: str
    items: List[Dict]
    total_amount: float

    def to_dict(self):
        return asdict(self)

# Stack for order history (LIFO)
order_history = []

# Queue for pending orders (FIFO)
pending_orders = deque()

# Array for customer records
customer_records = []

# Counter for order IDs
order_counter = 1

def validate_order_data(data: Dict) -> bool:
    required_fields = ['customer_name', 'table_number', 'mobile_number', 'items', 'total_amount']
    return all(field in data for field in required_fields) and \
           isinstance(data['items'], list) and \
           isinstance(data['total_amount'], (int, float)) and \
           data['total_amount'] >= 0 and \
           isinstance(data['mobile_number'], str) and \
           data['mobile_number'].isdigit() and \
           len(data['mobile_number']) == 10

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
    try:
        data = request.json
        if not validate_order_data(data):
            return jsonify({'error': 'Invalid order data'}), 400

        # Create new order
        new_order = Order(
            order_id=order_counter,
            customer_name=data['customer_name'].strip(),
            table_number=str(data['table_number']).strip(),
            mobile_number=data['mobile_number'].strip(),
            items=data['items'],
            total_amount=float(data['total_amount'])
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/process_order', methods=['POST'])
def process_order():
    try:
        if not pending_orders:
            return jsonify({'message': 'No pending orders'}), 404
        
        # Get next order from queue
        current_order = pending_orders.popleft()
        
        # Add to order history stack
        order_history.append(current_order)
        
        return jsonify({
            'message': 'Order processed successfully',
            'order': current_order.to_dict()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/order_history', methods=['GET'])
def get_order_history():
    try:
        mobile_number = request.args.get('mobile_number')
        if mobile_number:
            # Filter orders by mobile number
            filtered_orders = [order for order in order_history if order.mobile_number == mobile_number]
            return jsonify([order.to_dict() for order in filtered_orders])
        return jsonify([order.to_dict() for order in order_history])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer_records', methods=['GET'])
def get_customer_records():
    try:
        return jsonify(customer_records)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pending_orders', methods=['GET'])
def get_pending_orders():
    try:
        return jsonify([order.to_dict() for order in pending_orders])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 

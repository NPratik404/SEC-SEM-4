from flask import Flask, request, jsonify, render_template, send_file
from collections import deque
from typing import List, Dict, TypeVar, Generic, Optional
import json
import os
from dataclasses import dataclass, asdict
from decimal import Decimal
from datetime import datetime, date

# Generic type for our data structures
T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self):
        self._items: List[T] = []
    
    def push(self, item: T) -> None:
        """Add item to top of stack"""
        self._items.append(item)
    
    def pop(self) -> Optional[T]:
        """Remove and return top item"""
        if not self.is_empty():
            return self._items.pop()
        return None
    
    def peek(self) -> Optional[T]:
        """View top item without removing"""
        if not self.is_empty():
            return self._items[-1]
        return None
    
    def is_empty(self) -> bool:
        return len(self._items) == 0
    
    def size(self) -> int:
        return len(self._items)
    
    def get_all(self) -> List[T]:
        return self._items.copy()

class Queue(Generic[T]):
    def __init__(self):
        self._items: deque[T] = deque()
    
    def enqueue(self, item: T) -> None:
        """Add item to end of queue"""
        self._items.append(item)
    
    def dequeue(self) -> Optional[T]:
        """Remove and return front item"""
        if not self.is_empty():
            return self._items.popleft()
        return None
    
    def peek(self) -> Optional[T]:
        """View front item without removing"""
        if not self.is_empty():
            return self._items[0]
        return None
    
    def is_empty(self) -> bool:
        return len(self._items) == 0
    
    def size(self) -> int:
        return len(self._items)
    
    def get_all(self) -> List[T]:
        return list(self._items)

class Array(Generic[T]):
    def __init__(self):
        self._items: List[T] = []
    
    def append(self, item: T) -> None:
        """Add item to end of array"""
        self._items.append(item)
    
    def get(self, index: int) -> Optional[T]:
        """Get item at index"""
        if 0 <= index < len(self._items):
            return self._items[index]
        return None
    
    def set(self, index: int, item: T) -> bool:
        """Set item at index"""
        if 0 <= index < len(self._items):
            self._items[index] = item
            return True
        return False
    
    def remove(self, index: int) -> Optional[T]:
        """Remove and return item at index"""
        if 0 <= index < len(self._items):
            return self._items.pop(index)
        return None
    
    def find(self, predicate) -> Optional[T]:
        """Find first item matching predicate"""
        for item in self._items:
            if predicate(item):
                return item
        return None
    
    def size(self) -> int:
        return len(self._items)
    
    def get_all(self) -> List[T]:
        return self._items.copy()

app = Flask(__name__)

@dataclass
class Order:
    order_id: int
    customer_name: str
    table_number: str
    mobile_number: str
    items: List[Dict]
    total_amount: float
    timestamp: float = datetime.now().timestamp()

    def to_dict(self):
        return asdict(self)

# Stack for order history (LIFO)
order_history = Stack()

# Queue for pending orders (FIFO)
pending_orders = Queue()

# Array for customer records
customer_records = Array()

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
        pending_orders.enqueue(new_order)
        
        # Check if customer already exists in records
        customer_found = False
        existing_customer = customer_records.find(
            lambda record: record['customer_name'].lower() == new_order.customer_name.lower()
        )
        
        if existing_customer:
            existing_customer['total_orders'] += 1
            existing_customer['total_spent'] += new_order.total_amount
        else:
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
        if pending_orders.is_empty():
            return jsonify({'message': 'No pending orders'}), 404
        
        # Get next order from queue
        current_order = pending_orders.dequeue()
        
        # Add to order history stack
        order_history.push(current_order)
        
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
            filtered_orders = [order for order in order_history.get_all() if order.mobile_number == mobile_number]
            return jsonify([order.to_dict() for order in filtered_orders])
        return jsonify([order.to_dict() for order in order_history.get_all()])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customer_records', methods=['GET'])
def get_customer_records():
    try:
        return jsonify(customer_records.get_all())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pending_orders', methods=['GET'])
def get_pending_orders():
    try:
        return jsonify([order.to_dict() for order in pending_orders.get_all()])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/todays_orders', methods=['GET'])
def get_todays_orders():
    try:
        today = date.today()
        todays_orders = [
            order for order in order_history.get_all()
            if datetime.fromtimestamp(order.timestamp).date() == today
        ]
        # Convert orders to dictionary format
        orders_data = [order.to_dict() for order in todays_orders]
        return jsonify(orders_data)
    except Exception as e:
        print(f"Error in get_todays_orders: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 

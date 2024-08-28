from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS  # Import CORS
import os
import threading

app = Flask(__name__)

CORS(app)

# Setup database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///visitor-count.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class VisitorCount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    count = db.Column(db.Integer, default=0)

# Boolean to track if the app has run before
appHasRunBefore = False

@app.before_request
def firstRun():
    global appHasRunBefore
    if not appHasRunBefore:
        with app.app_context():
            db.create_all()
            # Initialize with a count of 0 if no records exist
            if not VisitorCount.query.first():
                db.session.add(VisitorCount(count=0))
                db.session.commit()
        appHasRunBefore = True

@app.route('/api/update-count', methods=['POST'])
def update_count():
    try:
        with app.app_context():
            visitor_count = VisitorCount.query.first()
            visitor_count.count += 1
            db.session.commit()
        return jsonify({"message": "Count updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update count"}), 500

@app.route('/api/visitor-count', methods=['GET'])
def get_count():
    try:
        with app.app_context():
            visitor_count = VisitorCount.query.first()
        return jsonify({"count": visitor_count.count}), 200
    except Exception as e:
        return jsonify({"error": "Failed to read count"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
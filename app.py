from flask import Flask, jsonify
import os

app = Flask(__name__)

# Path to your JSON file
count_file_path = os.path.join(os.path.dirname(__file__), 'visitor-count.json')

# Initialize the file with a count of 0 if it doesn't exist
if not os.path.exists(count_file_path):
    with open(count_file_path, 'w', encoding='utf-8') as f:
        f.write('0')

@app.route('/api/update-count', methods=['POST'])
def update_count():
    try:
        with open(count_file_path, 'r+', encoding='utf-8') as f:
            count = int(f.read().strip())
            count += 1
            f.seek(0)
            f.write(str(count))
            f.truncate()
        return jsonify({"message": "Count updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update count file", "details": str(e)}), 500

@app.route('/api/visitor-count', methods=['GET'])
def get_count():
    try:
        with open(count_file_path, 'r', encoding='utf-8') as f:
            count = int(f.read().strip()) 
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": "Failed to read count file", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

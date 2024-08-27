from flask import Flask, jsonify, request
import os

app = Flask(__name__)

# Path to your JSON file
count_file_path = 'visitor-count.json'

# Initialize the file with a count of 0 if it doesn't exist
if not os.path.exists(count_file_path):
    with open(count_file_path, 'w') as f:
        f.write('0')

@app.route('/api/update-count', methods=['POST'])
def update_count():
    try:
        with open(count_file_path, 'r+') as f:
            count = int(f.read())
            count += 1
            f.seek(0)
            f.write(str(count))
            f.truncate()
        return jsonify({"message": "Count updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update count file"}), 500

@app.route('/api/visitor-count', methods=['GET'])
def get_count():
    try:
        with open(count_file_path, 'r') as f:
            count = int(f.read())
        return jsonify({"count": count}), 200
    except Exception as e:
        return jsonify({"error": "Failed to read count file"}), 500
##
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

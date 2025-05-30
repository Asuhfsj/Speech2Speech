from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import uuid
from datetime import datetime

app = Flask(__name__, static_folder='static')

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe')
def transcribe():
    return render_template('transcribe.html')

@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file received'}), 400
    
    audio_file = request.files['audio']
    
    filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d%H%M%S')}.wav"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    audio_file.save(filepath)
    
    return jsonify({
        'success': True,
        'filename': filename,
        'message': 'Audio saved successfully'
    })

@app.route('/get-audio/<filename>')
def get_audio(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

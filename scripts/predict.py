import cv2
import numpy as np
import tensorflow as tf
import sys
import json
import base64
import re
import os
# from tensorflow.keras.applications.densenet import preprocess_input
from tensorflow.keras.applications.resnet50 import preprocess_input

# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
tf.get_logger().setLevel('ERROR')

def predict_mammogram(image_data):
    try:
        print("Starting mammogram prediction process...", file=sys.stderr)
        
        # Decode base64 image
        print("Decoding image...", file=sys.stderr)
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        # Remove any whitespace or newlines
        image_data = re.sub(r'\s+', '', image_data)
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            raise ValueError("Failed to decode image. Please check the image format.")
            
        print(f"Image decoded successfully. Shape: {img.shape}", file=sys.stderr)
        
        # Preprocess image
        print("Preprocessing image...", file=sys.stderr)
        if img is not None and img.size > 0:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
            print(f"After RGB conversion. Shape: {img.shape}", file=sys.stderr)
            img = cv2.resize(img, (224, 224))
            print(f"After resize. Shape: {img.shape}", file=sys.stderr)
            img = preprocess_input(img.astype(np.float32))
            img = np.expand_dims(img, axis=0)
            print(f"Final preprocessed shape: {img.shape}", file=sys.stderr)
        else:
            raise ValueError("Image is empty after decoding")
        
        print("Image preprocessing completed", file=sys.stderr)
        
        # Load model and predict
        print("Loading model...", file=sys.stderr)
        model = tf.keras.models.load_model('model.h5', compile=False)
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        print("Model loaded successfully", file=sys.stderr)
        
        print("Making prediction...", file=sys.stderr)
        # Disable progress bar for prediction
        prediction = model.predict(img, verbose=0)[0][0]
        print(f"Raw prediction value: {prediction}", file=sys.stderr)
        
        # Calculate confidence based on the new formula
        confidence = prediction * 100 if prediction > 0.7 else (1 - prediction) * 100
        
        # Format the prediction result
        result = f"Malignant ({confidence:.2f}% confidence)" if prediction > 0.7 else f"Benign ({confidence:.2f}% confidence)"
        
        print(f"Final prediction: {result}", file=sys.stderr)
        
        # Return result as a single line of JSON
        result_json = {
            "prediction": result,
            "confidence": f"{confidence:.2f}"
        }
        print("\nRESULT_JSON_START")  # Add marker for result
        print(json.dumps(result_json))
        print("RESULT_JSON_END")  # Add marker for result
        return

    except Exception as e:
        print(f"Error during prediction: {str(e)}", file=sys.stderr)
        error_json = {"error": str(e)}
        print("\nRESULT_JSON_START")
        print(json.dumps(error_json))
        print("RESULT_JSON_END")
        return

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        print(f"Received input length: {len(input_data)}", file=sys.stderr)
        parsed_data = json.loads(input_data)
        print(f"Image data length: {len(parsed_data['image'])}", file=sys.stderr)
        predict_mammogram(parsed_data["image"])
    except Exception as e:
        print("\nRESULT_JSON_START")
        print(json.dumps({"error": f"Input processing error: {str(e)}"}))
        print("RESULT_JSON_END") 
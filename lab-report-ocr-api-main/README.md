# Lab Report OCR API

This is a FastAPI-based project that extracts structured lab test results from scanned lab report images using Tesseract OCR.

## Features
- Accepts image uploads via `/get-lab-tests` endpoint
- Performs OCR using Tesseract
- Extracts test name, value, and (optionally) reference range
- Returns clean JSON output

## How to Run
1. Clone the repo
2. Install dependencies: pip install -r requirements.txt
3. Run the API: uvicorn main: app --reload
4. Open your browser and go to: http://127.0.0.1:8000/docs


## Sample Output
```json
{
"is_success": true,
"data": [
 {
   "test_name": "Hemoglobin",
   "value": 13.7,
   "bio_reference_range": "12.0 - 16.0",
   "lab_test_out_of_range": false
 }
]
}

## Credits

This project was developed as part of a Data Science assessment challenge by Bajaj Finserv Health.  
It was built using open-source tools including FastAPI, Tesseract OCR, and Python.



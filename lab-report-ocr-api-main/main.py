from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import cv2
import pytesseract
import numpy as np
from parse_utils import parse_lab_tests

# Set Tesseract path (for Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI()

@app.post("/get-lab-tests")
async def get_lab_tests(file: UploadFile = File(...)):
    try:
        # Read image bytes and convert to numpy array
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # OCR
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        ocr_text = pytesseract.image_to_string(img_rgb)

        print("----- OCR TEXT START -----")
        print(ocr_text)
        print("----- OCR TEXT END -----")

        # Parse lab tests
        parsed = parse_lab_tests(ocr_text)

        return JSONResponse(content={
            "is_success": True,
            "data": parsed
        })

    except Exception as e:
        return JSONResponse(content={
            "is_success": False,
            "error": str(e)
        })


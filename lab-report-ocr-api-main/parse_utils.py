import re

def clean_test_name(name):
    name = name.strip()
    # Remove starting special characters, digits, and spaces
    name = re.sub(r'^[#\d\s\-\.\,]*', '', name)
    return name

def parse_lab_tests(ocr_text):
    import re
    lab_tests = []
    lines = ocr_text.split('\n')

    for line in lines:
        if not line.strip():
            continue

        # Simplified pattern: Match test_name + value
        match = re.match(r"([\w\s\-()]+)\s+([0-9.]+)", line)
        if match:
            test_name = clean_test_name(match.group(1))
            value = float(match.group(2))
            lab_tests.append({
                "test_name": test_name,
                "value": value,
                "bio_reference_range": "N/A",
                "lab_test_out_of_range": None
            })

    return lab_tests

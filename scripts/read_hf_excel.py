import pandas as pd

file_path = "/home/marks/Development/nu6-phoneme-scorer/Rose Hil HF Word Lists 1B to 4B.xlsx"

try:
    # Read the Excel file
    xls = pd.ExcelFile(file_path)
    
    for sheet_name in xls.sheet_names:
        print(f"\n--- Sheet: {sheet_name} ---")
        df = pd.read_excel(xls, sheet_name=sheet_name)
        pd.set_option('display.max_rows', None)
        print(df) # Print all rows
        
except Exception as e:
    print(f"Error reading Excel file: {e}")

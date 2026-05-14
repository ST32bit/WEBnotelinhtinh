import PyPDF2
import pandas as pd
import json

# Extract PDF
try:
    with open('503073 - Final Project.pdf', 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        with open('pdf_content.txt', 'w', encoding='utf-8') as out:
            out.write(text)
except Exception as e:
    with open('pdf_content.txt', 'w', encoding='utf-8') as out:
        out.write('Error reading PDF: ' + str(e))

# Extract XLSX
try:
    # Read all sheets into a dictionary of dataframes
    xls = pd.read_excel('503073-Final-Project-Rubrik.xlsx', sheet_name=None)
    with open('xlsx_content.txt', 'w', encoding='utf-8') as out:
        for sheet_name, df in xls.items():
            out.write(f'--- Sheet: {sheet_name} ---\n')
            out.write(df.to_string())
            out.write('\n\n')
except Exception as e:
    with open('xlsx_content.txt', 'w', encoding='utf-8') as out:
        out.write('Error reading XLSX: ' + str(e))

print("Extraction complete.")

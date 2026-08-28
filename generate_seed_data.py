import os
import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Ensure public folder exists
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")
os.makedirs(PUBLIC_DIR, exist_ok=True)

# Updated standardized template output path
FILE_PATH = os.path.join(PUBLIC_DIR, "staff_allocation_template.xlsx")

# 1. SAMPLE DATA DEFINITIONS
staff_data = [
    {
        "ID": 1,
        "Name": "Jordan Ellis",
        "Designation": "SRA",
        "FTE": 1.0,
        "2026-Jan": 100, "2026-Feb": 100, "2026-Mar": 100, "2026-Apr": 100,
        "2026-May": 100, "2026-Jun": 100, "2026-Jul": 100, "2026-Aug": 100,
        "2026-Sep": 100, "2026-Oct": 100, "2026-Nov": 100, "2026-Dec": 100,
    },
    {
        "ID": 2,
        "Name": "Morgan Vance",
        "Designation": "RA",
        "FTE": 0.5,
        "2026-Jan": 50, "2026-Feb": 50, "2026-Mar": 50, "2026-Apr": 50,
        "2026-May": 50, "2026-Jun": 50, "2026-Jul": 50, "2026-Aug": 50,
        "2026-Sep": 50, "2026-Oct": 50, "2026-Nov": 50, "2026-Dec": 50,
    },
    {
        "ID": 3,
        "Name": "Taylor Chen",
        "Designation": "ADE",
        "FTE": 1.0,
        "2026-Jan": 100, "2026-Feb": 100, "2026-Mar": 100, "2026-Apr": 100,
        "2026-May": 100, "2026-Jun": 100, "2026-Jul": 100, "2026-Aug": 100,
        "2026-Sep": 100, "2026-Oct": 100, "2026-Nov": 100, "2026-Dec": 100,
    },
    {
        "ID": 4,
        "Name": "Alex Mercer",
        "Designation": "RA",
        "FTE": 1.0,
        "2026-Jan": 80, "2026-Feb": 80, "2026-Mar": 80, "2026-Apr": 80,
        "2026-May": 100, "2026-Jun": 100, "2026-Jul": 100, "2026-Aug": 100,
        "2026-Sep": 100, "2026-Oct": 100, "2026-Nov": 100, "2026-Dec": 100,
    },
    {
        "ID": 5,
        "Name": "Riley Harper",
        "Designation": "DOR",
        "FTE": 1.0,
        "2026-Jan": 100, "2026-Feb": 100, "2026-Mar": 100, "2026-Apr": 100,
        "2026-May": 100, "2026-Jun": 100, "2026-Jul": 100, "2026-Aug": 100,
        "2026-Sep": 100, "2026-Oct": 100, "2026-Nov": 100, "2026-Dec": 100,
    },
]

project_data = [
    {
        "ID": 101,
        "Name": "Project Polaris",
        "Start Month": "2026-January",
        "End Month": "2026-December",
    },
    {
        "ID": 102,
        "Name": "Aegis Core Modernization",
        "Start Month": "2026-March",
        "End Month": "2026-September",
    },
    {
        "ID": 103,
        "Name": "Helios Analytics Platform",
        "Start Month": "2026-June",
        "End Month": "2026-November",
    },
    {
        "ID": 104,
        "Name": "Vanguard Cloud Portal",
        "Start Month": "2026-January",
        "End Month": "2026-June",
    },
]

assignment_data = [
    {"Staff ID": 1, "Staff Name": "Jordan Ellis", "Project ID": 101, "Project Name": "Project Polaris", "Role": "PL"},
    {"Staff ID": 2, "Staff Name": "Morgan Vance", "Project ID": 101, "Project Name": "Project Polaris", "Role": "M"},
    {"Staff ID": 4, "Staff Name": "Alex Mercer", "Project ID": 101, "Project Name": "Project Polaris", "Role": "A"},
    {"Staff ID": 3, "Staff Name": "Taylor Chen", "Project ID": 102, "Project Name": "Aegis Core Modernization", "Role": "PL"},
    {"Staff ID": 1, "Staff Name": "Jordan Ellis", "Project ID": 102, "Project Name": "Aegis Core Modernization", "Role": "M"},
    {"Staff ID": 5, "Staff Name": "Riley Harper", "Project ID": 103, "Project Name": "Helios Analytics Platform", "Role": "PL"},
    {"Staff ID": 3, "Staff Name": "Taylor Chen", "Project ID": 103, "Project Name": "Helios Analytics Platform", "Role": "M"},
    {"Staff ID": 2, "Staff Name": "Morgan Vance", "Project ID": 103, "Project Name": "Helios Analytics Platform", "Role": "A"},
    {"Staff ID": 4, "Staff Name": "Alex Mercer", "Project ID": 104, "Project Name": "Vanguard Cloud Portal", "Role": "PL"},
    {"Staff ID": 5, "Staff Name": "Riley Harper", "Project ID": 104, "Project Name": "Vanguard Cloud Portal", "Role": "M"},
]

# 2. WRITE TO EXCEL
df_staff = pd.DataFrame(staff_data)
df_projects = pd.DataFrame(project_data)
df_assignments = pd.DataFrame(assignment_data)

with pd.ExcelWriter(FILE_PATH, engine="openpyxl") as writer:
    df_staff.to_excel(writer, sheet_name="Staff", index=False)
    df_projects.to_excel(writer, sheet_name="Projects", index=False)
    df_assignments.to_excel(writer, sheet_name="Assignments", index=False)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    thin_border = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="thin", color="CBD5E1"),
    )

    for sheet_name in writer.sheets:
        ws = writer.sheets[sheet_name]
        
        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
        
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                cell.border = thin_border
                if isinstance(cell.value, float):
                    cell.number_format = "0.0"
                elif isinstance(cell.value, int) and cell.column > 3 and sheet_name == "Staff":
                    cell.number_format = '0"%"'

        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

print(f"Successfully generated template at '{FILE_PATH}'!")
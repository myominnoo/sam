import json
import os
import random

DESIGNATIONS = ["RA", "SRA", "DOR"]
ROLES = ["PL", "M", "A"]

STAFF_NAMES = [
    "Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince", "Evan Wright",
    "Fiona Gallagher", "George Clark", "Hannah Abbott", "Ian Malcolm", "Julia Roberts"
]

PROJECT_NAMES = [
    "Project Alpha", "Project Beta", "Project Gamma", "Project Delta", "Project Epsilon"
]

def generate_seed_data():
    staff = []
    for i, name in enumerate(STAFF_NAMES, start=1):
        staff.append({
            "id": i,
            "name": name,
            "designation": random.choice(DESIGNATIONS),
            "fte": round(random.choice([0.5, 0.8, 1.0]), 1),
            "isActive": True,
            "monthlyCapacity": {}
        })

    projects = []
    for i, name in enumerate(PROJECT_NAMES, start=1):
        projects.append({
            "id": i,
            "name": name,
            "startMonth": "2026-01",
            "endMonth": "2026-12",
            "isActive": True
        })

    assignments = []
    assignment_id = 1
    for p in projects:
        assigned_staff = random.sample(staff, 3)
        assignments.append({
            "id": assignment_id,
            "staffId": assigned_staff[0]["id"],
            "projectId": p["id"],
            "role": "PL"
        })
        assignment_id += 1
        
        for s in assigned_staff[1:]:
            assignments.append({
                "id": assignment_id,
                "staffId": s["id"],
                "projectId": p["id"],
                "role": "M"
            })
            assignment_id += 1

    roles = [
        {"id": 1, "code": "RA", "name": "Research Associate"},
        {"id": 2, "code": "SRA", "name": "Senior Research Associate"},
        {"id": 3, "code": "DOR", "name": "Director of Research"}
    ]

    seed_dataset = {
        "staff": staff,
        "projects": projects,
        "assignments": assignments,
        "roles": roles
    }

    # Automatically create directory structure if missing
    output_dir = os.path.join("src", "db")
    os.makedirs(output_dir, exist_ok=True)

    file_path = os.path.join(output_dir, "seed_data.json")
    with open(file_path, "w") as f:
        json.dump(seed_dataset, f, indent=2)

    print(f"Successfully generated {file_path} with isActive status fields.")

if __name__ == "__main__":
    generate_seed_data()

# python3 generate_seed_data.py
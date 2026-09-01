import json
import os
import random

# Fixed Seed for Reproducible Data Generation
random.seed(42)

DESIGNATIONS = ["RA", "SRA", "DOR"]
ROLES = ["PL", "M", "A"]

STAFF_NAMES = [
    "Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince", "Evan Wright",
    "Fiona Gallagher", "George Clark", "Hannah Abbott", "Ian Malcolm", "Julia Roberts",
    "Kevin Bacon", "Laura Croft", "Marcus Vance", "Nina Simone", "Oscar Isaac", "Penelope Cruz"
]

PROJECT_NAMES = [
    "Project Alpha", "Project Beta", "Project Gamma", "Project Delta",
    "Project Epsilon", "Project Zeta", "Project Eta", "Project Theta"
]

# 24 Months Timeline: Jan 2026 to Dec 2027
MONTHS_2026 = [f"2026-{m:02d}" for m in range(1, 13)]
MONTHS_2027 = [f"2027-{m:02d}" for m in range(1, 13)]
ALL_MONTHS = MONTHS_2026 + MONTHS_2027

# Constrained capacity percentage choices: 0%, 25%, 75%, 100%
CAPACITY_CHOICES = [0.0, 0.25, 0.75, 1.0]

def generate_seed_data():
    # 1. Staff Generation (16 members with active/inactive statuses)
    staff = []
    for i, name in enumerate(STAFF_NAMES, start=1):
        # Keep most staff active, with a few inactive
        is_active = True if i <= 13 else False
        staff.append({
            "id": i,
            "name": name,
            "designation": random.choice(DESIGNATIONS),
            "fte": round(random.choice([0.5, 0.8, 1.0]), 1),
            "isActive": is_active
        })

    # Filter active staff for assignment pools
    active_staff = [s for s in staff if s["isActive"]]

    # 2. Project Generation (8 projects with varying start/end dates and statuses)
    projects = []
    for i, name in enumerate(PROJECT_NAMES, start=1):
        # Create varying project schedules across 2026-2027
        if i <= 5:
            start_m, end_m = "2026-01", "2027-12"
            is_act = True
        elif i == 6:
            start_m, end_m = "2026-01", "2026-12"
            is_act = False
        elif i == 7:
            start_m, end_m = "2026-06", "2027-06"
            is_act = True
        else:
            start_m, end_m = "2027-01", "2027-12"
            is_act = True

        projects.append({
            "id": i,
            "name": name,
            "startMonth": start_m,
            "endMonth": end_m,
            "isActive": is_act
        })

    assignments = []
    allocations = []
    assignment_id = 1
    allocation_id = 1

    # 3. Assignments & Allocations Generation
    for p in projects:
        # Sample 3 to 5 active staff members per project
        assigned_staff = random.sample(active_staff, random.randint(3, 5))
        
        # Ensure all three roles (PL, M, A) are represented across assigned team members
        roles_pool = ["PL", "M", "A"] + ["M"] * (len(assigned_staff) - 3)
        random.shuffle(roles_pool)

        # Get relevant active months for project duration
        project_months = [m for m in ALL_MONTHS if p["startMonth"] <= m <= p["endMonth"]]

        for staff_member, role in zip(assigned_staff, roles_pool):
            assignments.append({
                "id": assignment_id,
                "staffId": staff_member["id"],
                "projectId": p["id"],
                "role": role
            })

            # Generate monthly allocations using [0.0, 0.25, 0.75, 1.0]
            for m in project_months:
                # Weighted probability (70% chance of active allocation, 30% chance of 0%)
                percentage = random.choice([0.25, 0.75, 1.0]) if random.random() > 0.3 else 0.0

                allocations.append({
                    "id": allocation_id,
                    "assignmentId": assignment_id,
                    "staffId": staff_member["id"],
                    "projectId": p["id"],
                    "month": m,
                    "percentage": percentage
                })
                allocation_id += 1

            assignment_id += 1

    # 4. Metadata Lookup Lists
    designations = [
        {"id": 1, "code": "RA", "name": "Research Associate"},
        {"id": 2, "code": "SRA", "name": "Senior Research Associate"},
        {"id": 3, "code": "DOR", "name": "Director of Research"}
    ]

    project_roles = [
        {"code": "PL", "name": "Project Lead"},
        {"code": "M", "name": "Member"},
        {"code": "A", "name": "Advisor"}
    ]

    seed_dataset = {
        "staff": staff,
        "projects": projects,
        "assignments": assignments,
        "allocations": allocations,
        "designations": designations,
        "projectRoles": project_roles
    }

    # Save output to src/db/seed.json
    output_dir = os.path.join("src", "db")
    os.makedirs(output_dir, exist_ok=True)

    file_path = os.path.join(output_dir, "seed.json")
    with open(file_path, "w") as f:
        json.dump(seed_dataset, f, indent=2)

    print(f"Successfully generated {file_path} covering 2026-2027 timeline with {len(staff)} staff and {len(projects)} projects.")

if __name__ == "__main__":
    generate_seed_data()

# python3 generate_seed_data.py
import json
import os


# Planning horizon shown by default in the dashboard.
TIMELINE_MONTHS = [
    "2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01",
    "2027-02", "2027-03", "2027-04", "2027-05", "2027-06", "2027-07",
]

STAFF = [
    {"id": 1, "name": "Maya Chen", "designation": "DOR", "fte": 0.8, "isActive": True},
    {"id": 2, "name": "Liam Patel", "designation": "SRA", "fte": 1.0, "isActive": True},
    {"id": 3, "name": "Sofia Martinez", "designation": "DOR", "fte": 1.0, "isActive": True},
    {"id": 4, "name": "Noah Williams", "designation": "DOR", "fte": 1.0, "isActive": True},
    {"id": 5, "name": "Ava Thompson", "designation": "SRA", "fte": 1.0, "isActive": True},
    {"id": 6, "name": "Ethan Brooks", "designation": "SRA", "fte": 1.0, "isActive": True},
    {"id": 7, "name": "Grace Kim", "designation": "DOR", "fte": 0.8, "isActive": True},
    {"id": 8, "name": "Oliver Grant", "designation": "SRA", "fte": 1.0, "isActive": True},
    {"id": 9, "name": "Chloe Bennett", "designation": "RA", "fte": 0.6, "isActive": True},
    {"id": 10, "name": "Daniel Okafor", "designation": "SRA", "fte": 1.0, "isActive": True},
    {"id": 11, "name": "Emma Sinclair", "designation": "RA", "fte": 0.8, "isActive": True},
    {"id": 12, "name": "Lucas Reid", "designation": "RA", "fte": 0.8, "isActive": True},
]

# Each project stays entirely within the Aug 2026–Jul 2027 planning horizon.
PROJECTS = [
    {"id": 1, "name": "Northern Star Clinical Trial", "startMonth": "2026-08", "endMonth": "2027-02", "isActive": True},
    {"id": 2, "name": "Horizon Health Survey", "startMonth": "2026-08", "endMonth": "2026-11", "isActive": True},
    {"id": 3, "name": "Beacon Outcomes Registry", "startMonth": "2026-09", "endMonth": "2027-07", "isActive": True},
    {"id": 4, "name": "Prairie Access Study", "startMonth": "2026-10", "endMonth": "2027-03", "isActive": True},
    {"id": 5, "name": "Mosaic Data Platform", "startMonth": "2026-11", "endMonth": "2027-07", "isActive": True},
    {"id": 6, "name": "Community Wellbeing Evaluation", "startMonth": "2027-01", "endMonth": "2027-07", "isActive": True},
    {"id": 7, "name": "Atlas Implementation Pilot", "startMonth": "2027-02", "endMonth": "2027-06", "isActive": True},
    {"id": 8, "name": "Summit Knowledge Synthesis", "startMonth": "2027-05", "endMonth": "2027-07", "isActive": True},
]

# The allocation mix produces realistic monthly variation: inactive periods at
# 0%, focused project work at 50–90%, and a small number of fully booked months.
# The selected overlaps keep each person at or below their FTE capacity each month.
PROJECT_TEAMS = {
    1: [(1, "PL", 0.5), (2, "M", 0.3), (3, "M", 0.4), (8, "M", 0.4)],
    2: [(4, "PL", 0.5), (5, "M", 0.5), (6, "M", 0.5), (9, "A", 0.2)],
    3: [(7, "PL", 0.5), (2, "M", 0.4), (10, "M", 0.4), (11, "A", 0.3)],
    4: [(3, "PL", 0.5), (5, "M", 0.4), (12, "M", 0.4), (9, "A", 0.2)],
    5: [(8, "PL", 0.5), (6, "M", 0.5), (10, "M", 0.3), (4, "A", 0.2)],
    6: [(1, "PL", 0.3), (7, "M", 0.3), (11, "M", 0.5), (12, "A", 0.3)],
    7: [(4, "PL", 0.5), (2, "M", 0.3), (10, "M", 0.3), (9, "A", 0.2)],
    8: [(3, "PL", 0.5), (5, "M", 0.4), (6, "M", 0.4), (8, "A", 0.2)],
}


def months_in_project_timeline(project):
    return [
        month
        for month in TIMELINE_MONTHS
        if project["startMonth"] <= month <= project["endMonth"]
    ]


def generate_seed_data():
    assignments = []
    allocations = []
    assignment_id = 1
    allocation_id = 1

    for project in PROJECTS:
        for staff_id, role, percentage in PROJECT_TEAMS[project["id"]]:
            assignments.append({
                "id": assignment_id,
                "staffId": staff_id,
                "projectId": project["id"],
                "role": role,
            })

            # Store capacity only for months when the assigned project is active.
            for month in months_in_project_timeline(project):
                allocations.append({
                    "id": allocation_id,
                    "assignmentId": assignment_id,
                    "staffId": staff_id,
                    "projectId": project["id"],
                    "month": month,
                    "percentage": percentage,
                })
                allocation_id += 1

            assignment_id += 1

    seed_dataset = {
        "staff": STAFF,
        "projects": PROJECTS,
        "assignments": assignments,
        "allocations": allocations,
        "designations": [
            {"id": 1, "code": "RA", "name": "Research Associate"},
            {"id": 2, "code": "SRA", "name": "Senior Research Associate"},
            {"id": 3, "code": "DOR", "name": "Director of Research"},
        ],
        "projectRoles": [
            {"code": "PL", "name": "Project Lead"},
            {"code": "M", "name": "Member"},
            {"code": "A", "name": "Advisor"},
        ],
    }

    output_dir = os.path.join("src", "db")
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "seed.json")
    with open(file_path, "w") as file:
        json.dump(seed_dataset, file, indent=2)
        file.write("\n")

    print(
        f"Generated {file_path}: {len(STAFF)} staff, {len(PROJECTS)} projects, "
        f"{len(assignments)} assignments, and {len(allocations)} timeline-bound allocations."
    )


if __name__ == "__main__":
    generate_seed_data()

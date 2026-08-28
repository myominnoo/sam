import { db } from "../db";

export const seedSampleData = async () => {
  await db.transaction(
    "rw",
    db.staff,
    db.projects,
    db.assignments,
    async () => {
      await db.staff.clear();
      await db.projects.clear();
      await db.assignments.clear();

      const s1 = await db.staff.add({
        name: "Mahbub Zaman",
        designation: "RA",
        fte: 0.5,
        capacity: 100,
      });
      const s2 = await db.staff.add({
        name: "Alexander Gowriluk",
        designation: "SRA",
        fte: 1.0,
        capacity: 50,
      });
      const s3 = await db.staff.add({
        name: "Bryce Gallant",
        designation: "SRA",
        fte: 1.0,
        capacity: 100,
      });
      const s4 = await db.staff.add({
        name: "Camilla Atchison",
        designation: "RA",
        fte: 1.0,
        capacity: 100,
      });
      const s5 = await db.staff.add({
        name: "Kat Vu",
        designation: "RA",
        fte: 1.0,
        capacity: 0,
      });

      const p1 = await db.projects.add({
        name: "NAN Ed",
        activeMonths: ["Aug", "Sep", "Oct", "Nov", "Dec"],
      });
      const p2 = await db.projects.add({
        name: "CMM Justice",
        activeMonths: ["Aug", "Sep", "Oct"],
      });
      await db.projects.add({
        name: "CYFN",
        activeMonths: ["Aug", "Sep", "Oct", "Nov"],
      });
      await db.projects.add({
        name: "NAN Recovery",
        activeMonths: ["Aug", "Sep"],
      });
      const p5 = await db.projects.add({
        name: "UBC TRC",
        activeMonths: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
      });

      await db.assignments.add({ staffId: s1, projectId: p2, role: "M" });
      await db.assignments.add({ staffId: s2, projectId: p2, role: "PL" });
      await db.assignments.add({ staffId: s3, projectId: p1, role: "PL" });
      await db.assignments.add({ staffId: s3, projectId: p5, role: "PL" });
      await db.assignments.add({ staffId: s4, projectId: p1, role: "M" });
      await db.assignments.add({ staffId: s5, projectId: p5, role: "M" });
    },
  );
};

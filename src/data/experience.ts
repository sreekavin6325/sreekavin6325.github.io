import type { Experience } from "@/types";

// In career order: the first entry is where the Experience page's journey starts.
// The `highlights` are drafted from each role's summary — review and edit them to match your work.
export const experience: Experience[] = [
  {
    role: "Data Validator",
    company: "Srivari Information Technology",
    date: "2025",
    description: "Worked on data validation, verification and quality checking processes.",
    highlights: [
      "Validated data records for accuracy, completeness and consistency.",
      "Verified entries against their source information and flagged mismatches for correction.",
      "Ran quality checks on processed data before it moved to the next stage.",
      "Maintained and cross-checked records in Excel to keep the data clean and reliable.",
    ],
    skills: ["Data Validation", "Excel", "Quality Check"],
  },
  {
    role: "AIML Intern",
    company: "AI / ML Internship",
    date: "2026",
    description: "Worked on machine learning models, AI applications and experimentation.",
    highlights: [
      "Built and trained machine learning models using Python.",
      "Worked on AI applications, from preparing data to evaluating results.",
      "Ran experiments to compare approaches and improve model performance.",
      "Documented findings from experiments to guide the next iteration.",
    ],
    skills: ["Python", "Machine Learning", "AI"],
  },
  {
    role: "Project Associate",
    company: "C-DAC / HMIS",
    date: "2026",
    description:
      "Worked on HMIS support, configuration, hospital workflows and AI-related R&D.",
    highlights: [
      "Supported users of the Hospital Management Information System (HMIS) and resolved day-to-day issues.",
      "Configured HMIS modules to match hospital requirements.",
      "Mapped hospital workflows into the system so it fits how staff actually work.",
      "Contributed to AI-related research and development.",
    ],
    skills: ["HMIS", "AI/ML", "Support", "R&D"],
  },
];

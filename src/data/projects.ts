import type { Project } from "@/types";

// Put project images in public/images/projects/ and reference them as "/images/projects/<file>".
export const projects: Project[] = [
  {
    slug: "hospital-appointment-scheduling",
    title: "Hospital Appointment & Doctor Scheduling System",
    summary:
      "A full-stack healthcare management application that simplifies doctor availability tracking and patient appointment scheduling.",
    description: [
      "A full-stack healthcare management application designed to simplify doctor availability tracking and patient appointment scheduling.",
      "The system enables patients to view available doctors, select suitable time slots, and book, reschedule, or cancel appointments through a centralized platform.",
    ],
    image: "/images/projects/hospital-scheduling.webp",
    tags: ["React", "FastAPI", "PostgreSQL", "JWT", "Docker"],
    featured: true,
    features: [
      "Patient registration and authentication",
      "Doctor availability and schedule management",
      "Department-wise doctor listing",
      "Appointment booking, rescheduling, and cancellation",
      "Prevention of overlapping appointments",
      "Centralized patient and appointment records",
      "Admin dashboard for managing doctors and schedules",
      "Appointment confirmation and notification support",
    ],
    techStack: [
      { label: "Frontend", value: "React.js / Flutter" },
      { label: "Backend", value: "FastAPI / Node.js" },
      { label: "Database", value: "PostgreSQL / MySQL" },
      { label: "Authentication", value: "JWT" },
      { label: "API", value: "REST API" },
      { label: "Deployment", value: "Docker / Cloud Hosting" },
    ],
    objective:
      "To reduce manual appointment handling, minimize scheduling conflicts, and provide patients with a faster and more organized way to access healthcare services.",
    contribution: [
      "Designed the overall system workflow",
      "Developed appointment and doctor availability logic",
      "Planned frontend-backend integration",
      "Designed database structure for doctors, patients, schedules, and appointments",
      "Implemented API-based communication between system components",
    ],
  },
  {
    slug: "genai-fraud-investigation",
    title: "Fraud Investigation & Prevention Framework using GenAI",
    summary:
      "A Generative AI–based banking fraud analysis framework for fraud investigation, suspicious transaction analysis, and risk prevention.",
    description: [
      "A Generative AI–based banking fraud analysis framework designed to support fraud investigation, suspicious transaction analysis, and risk prevention.",
      "The system combines transaction data with AI-driven reasoning to help identify unusual patterns, summarize potential fraud cases, and assist investigators with faster decision-making.",
    ],
    image: "/images/projects/fraud-investigation.webp",
    tags: ["Python", "LangChain", "OpenAI API", "FastAPI", "Streamlit"],
    featured: true,
    categories: ["Generative AI", "Banking", "Fraud Analytics", "Decision Support"],
    features: [
      "Suspicious transaction identification",
      "Fraud pattern and anomaly analysis",
      "AI-assisted fraud investigation",
      "Automated case summarization",
      "Transaction risk assessment",
      "Detection of unusual customer or payment behaviour",
      "Investigator-focused reports and insights",
      "Fraud prevention recommendations",
      "Interactive analysis dashboard",
    ],
    techStack: [
      { label: "Programming", value: "Python" },
      { label: "AI / GenAI", value: "LLMs, OpenAI API / compatible GenAI models" },
      { label: "Frameworks", value: "LangChain / LangGraph" },
      { label: "Machine Learning", value: "Scikit-learn" },
      { label: "Data Processing", value: "Pandas, NumPy" },
      { label: "Backend", value: "FastAPI" },
      { label: "Database", value: "PostgreSQL / SQL" },
      { label: "Visualization", value: "Matplotlib / Streamlit" },
      { label: "Deployment", value: "Docker / Cloud" },
    ],
    objective:
      "To reduce the time required for manual fraud investigation by using Generative AI to analyze transaction information, highlight suspicious activity, generate investigation summaries, and support fraud prevention decisions.",
    workflow: [
      "Transaction Data",
      "Data Processing",
      "Fraud/Anomaly Detection",
      "GenAI Analysis",
      "Risk Assessment",
      "Investigation Summary",
      "Prevention Recommendation",
    ],
    contribution: [
      "Researched the use of GenAI in banking fraud investigation",
      "Designed the fraud investigation and prevention framework",
      "Studied suitable AI/ML models for transaction analysis",
      "Defined the workflow for risk analysis and case investigation",
      "Explored LLM integration for fraud-case summarization and recommendations",
      "Prepared project documentation around the framework",
    ],
  },
  {
    slug: "speaker-recognition",
    title: "Speaker Identification / Speaker Recognition System",
    summary:
      "A deep learning–based audio recognition system that identifies a person from their voice using ECAPA-TDNN embeddings and an SVM classifier.",
    description: [
      "A deep learning–based audio recognition system designed to identify a person from their voice.",
      "The system extracts speaker-specific characteristics from speech recordings, converts them into embeddings, and classifies the speaker using a machine learning model.",
    ],
    image: "/images/projects/speaker-recognition.webp",
    tags: ["Python", "ECAPA-TDNN", "SpeechBrain", "Scikit-learn", "Librosa"],
    featured: true,
    features: [
      "Speaker identification from voice recordings",
      "Audio preprocessing at 16 kHz mono",
      "Feature extraction using MFCC, Mel Spectrogram, and STFT",
      "Deep speaker embeddings using ECAPA-TDNN",
      "Speaker classification using SVM",
      "Closed-set identification across multiple speakers",
      "Waveform and spectrogram visualization",
      "Performance evaluation using accuracy, precision, recall, F1-score, ROC and PR curves",
    ],
    techStack: [
      { label: "Programming", value: "Python" },
      { label: "Deep Learning", value: "ECAPA-TDNN" },
      { label: "Machine Learning", value: "Scikit-learn, SVM" },
      { label: "Audio Processing", value: "Librosa, SpeechBrain, Torchaudio" },
      { label: "Data Processing", value: "NumPy, Pandas" },
      { label: "Visualization", value: "Matplotlib" },
      { label: "Model Files", value: "SVM classifier, scaler, label encoder" },
    ],
    dataset: {
      summary: "The system was trained using 7,501 speech clips from 5 speakers:",
      items: [
        "Benjamin Netanyahu",
        "Jens Stoltenberg",
        "Julia Gillard",
        "Margaret Thatcher",
        "Nelson Mandela",
      ],
    },
    metrics: [
      { label: "Best accuracy", value: "88.67%" },
      { label: "Precision", value: "89.33%" },
      { label: "Recall", value: "88.67%" },
      { label: "F1 score", value: "88.85%" },
    ],
    objective:
      "To build a reliable voice biometric system capable of identifying known speakers using deep speaker embeddings and machine learning classification.",
    workflow: [
      "Audio Input",
      "Preprocessing",
      "Feature Extraction",
      "ECAPA-TDNN Embedding",
      "Scaling",
      "SVM Classification",
      "Speaker Prediction",
    ],
    research:
      "This project was extended into my research work on closed-set and open-set speaker recognition using pre-trained speaker embedding models, prepared for ICACRS / IEEE submission.",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

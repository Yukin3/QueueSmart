const services = [
  {
    id: "svc-help-desk",
    organizationId: "org-uh",
    adminId: "admin-001",
    name: "General Help Desk",
    description: "General questions, account help, and basic support.",
    expectedDuration: 12,
    priority: "medium",
    isOpen: true,
  },
  {
    id: "svc-advising",
    organizationId: "org-uh",
    adminId: "admin-001",
    name: "Academic Advising",
    description: "Degree planning, registration, and graduation questions.",
    expectedDuration: 20,
    priority: "high",
    isOpen: true,
  },
  {
    id: "svc-financial",
    organizationId: "org-uh",
    adminId: "admin-001",
    name: "Financial Services",
    description: "Payments, billing, financial aid, and account questions.",
    expectedDuration: 15,
    priority: "medium",
    isOpen: false,
  },
];

module.exports = services;
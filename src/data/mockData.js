export const initialServices = [
  {
    id: 'svc-general',
    name: 'General Help Desk',
    description: 'General questions, account help, and basic support.',
    expectedDuration: 12,
    priority: 'medium',
    isOpen: true,
    queue: [
      { id: 'usr-101', name: 'Avery Johnson', joinedAt: '10:12 AM', priority: 'medium', status: 'waiting' },
      { id: 'usr-102', name: 'Jordan Lee', joinedAt: '10:18 AM', priority: 'low', status: 'waiting' },
      { id: 'usr-103', name: 'Taylor Smith', joinedAt: '10:23 AM', priority: 'high', status: 'waiting' },
    ],
  },
  {
    id: 'svc-advising',
    name: 'Academic Advising',
    description: 'Degree planning, registration, and graduation questions.',
    expectedDuration: 20,
    priority: 'high',
    isOpen: true,
    queue: [
      { id: 'usr-201', name: 'Morgan Davis', joinedAt: '9:56 AM', priority: 'high', status: 'waiting' },
      { id: 'usr-202', name: 'Casey Brown', joinedAt: '10:05 AM', priority: 'medium', status: 'waiting' },
    ],
  },
  {
    id: 'svc-financial',
    name: 'Financial Services',
    description: 'Payments, billing, financial aid, and account questions.',
    expectedDuration: 15,
    priority: 'medium',
    isOpen: false,
    queue: [],
  },
  {
    id: 'svc-tech',
    name: 'Technical Support',
    description: 'Password resets, device setup, and software troubleshooting.',
    expectedDuration: 10,
    priority: 'low',
    isOpen: true,
    queue: [
      { id: 'usr-301', name: 'Riley Wilson', joinedAt: '10:20 AM', priority: 'low', status: 'waiting' },
    ],
  },
];

// Stands in for the signed-in user until authentication is built. This id
// matches an existing queue entry so the queue screens have live data to show.
export const currentUser = {
  id: 'usr-101',
  name: 'Avery Johnson',
  email: 'avery.johnson@student.edu',
};

export const initialHistory = [
  { id: 'hist-1', serviceName: 'Financial Services', date: 'Jul 8, 2026', outcome: 'Served' },
  { id: 'hist-2', serviceName: 'Technical Support', date: 'Jul 5, 2026', outcome: 'Served' },
  { id: 'hist-3', serviceName: 'Academic Advising', date: 'Jul 1, 2026', outcome: 'Left' },
  { id: 'hist-4', serviceName: 'General Help Desk', date: 'Jun 28, 2026', outcome: 'No-show' },
];

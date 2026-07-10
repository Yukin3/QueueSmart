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

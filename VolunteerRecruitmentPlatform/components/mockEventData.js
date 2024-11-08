const mockEventData = {
    all: [
      {
        id: 1,
        title: 'Beach Cleanup',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/0000FF',
          'https://via.placeholder.com/150/FF0000',
          'https://via.placeholder.com/150/00FF00'
        ],
        description: 'Join us for a beach cleanup event to help the environment.',
        date: '2024-11-10',
        time: '10:00 AM',
        address: '123 Beach Ave',
        capacity: 50,
        status: 'Open',
        categories: ['Environment', 'Community', 'Outdoors']
      },
      {
        id: 2,
        title: 'Food Drive',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/555555',
          'https://via.placeholder.com/150/888888',
          'https://via.placeholder.com/150/AAAAAA'
        ],
        description: 'Help distribute food to those in need.',
        date: '2024-11-15',
        time: '2:00 PM',
        address: '456 Main St',
        capacity: 100,
        status: 'Open',
        categories: ['Charity', 'Community', 'Volunteer']
      },
      {
        id: 3,
        title: 'Park Restoration',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFFF00',
          'https://via.placeholder.com/150/FF8800',
          'https://via.placeholder.com/150/44FF88'
        ],
        description: 'Restore a local park and make it beautiful again.',
        date: '2024-11-20',
        time: '9:00 AM',
        address: '789 Park Rd',
        capacity: 30,
        status: 'Open',
        categories: ['Environment', 'Volunteer', 'Outdoors']
      },
      {
        id: 4,
        title: 'Animal Shelter Volunteering',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFFFAA',
          'https://via.placeholder.com/150/FFAAFF',
          'https://via.placeholder.com/150/88FFFF'
        ],
        description: 'Spend time helping care for animals in need.',
        date: '2024-11-22',
        time: '11:00 AM',
        address: '101 Animal St',
        capacity: 25,
        status: 'Open',
        categories: ['Animals', 'Community', 'Volunteer']
      }
    ],
    foryou: [
      {
        id: 5,
        title: 'Urban Gardening',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/007700',
          'https://via.placeholder.com/150/55FF55',
          'https://via.placeholder.com/150/AAFFAA'
        ],
        description: 'Help grow food in an urban environment.',
        date: '2024-11-25',
        time: '10:00 AM',
        address: '123 Urban Garden Rd',
        capacity: 15,
        status: 'Open',
        categories: ['Environment', 'Community', 'Gardening']
      }
    ],
    latest: [
      {
        id: 6,
        title: 'Beach Yoga',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/9999FF',
          'https://via.placeholder.com/150/FF99AA',
          'https://via.placeholder.com/150/66AAFF'
        ],
        description: 'Relax and rejuvenate at the beach with a yoga session.',
        date: '2024-11-12',
        time: '7:00 AM',
        address: '123 Ocean Blvd',
        capacity: 40,
        status: 'Open',
        categories: ['Health', 'Outdoors', 'Volunteer']
      }
    ],
    trending: [
      {
        id: 7,
        title: 'Food Bank Volunteering',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-30',
        time: '4:00 PM',
        address: '789 Foodbank Rd',
        capacity: 100,
        status: 'Open',
        categories: ['Charity', 'Community', 'Volunteer']
      }
    ],
    Upcoming: [
      {
        id: 8,
        title: 'City Park Cleanup',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-15',
        time: '9:00 AM',
        address: '101 Park Ave',
        capacity: 50,
        status: 'Upcoming',
        categories: ['Environment', 'Community', 'Outdoors']
      },
      {
        id: 9,
        title: 'Community Art Workshop',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-20',
        time: '11:00 AM',
        address: '456 Art St',
        capacity: 20,
        status: 'Upcoming',
        categories: ['Art', 'Community', 'Workshop']
      }
    ],
    'In Progress': [
      {
        id: 10,
        title: 'Food Bank Volunteering',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-10',
        time: '10:00 AM',
        address: '789 Food St',
        capacity: 30,
        status: 'In Progress',
        categories: ['Charity', 'Community', 'Volunteer']
      },
      {
        id: 11,
        title: 'Shelter Animal Care',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-08',
        time: '12:00 PM',
        address: '101 Animal Shelter Rd',
        capacity: 15,
        status: 'In Progress',
        categories: ['Animals', 'Community', 'Care']
      }
    ],
    Completed: [
      {
        id: 12,
        title: 'Park Tree Planting',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-01',
        time: '10:00 AM',
        address: '333 Park St',
        capacity: 40,
        status: 'Completed',
        categories: ['Environment', 'Outdoors', 'Planting']
      },
      {
        id: 13,
        title: 'Elderly Care Workshop',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-10-28',
        time: '2:00 PM',
        address: '222 Care St',
        capacity: 25,
        status: 'Completed',
        categories: ['Care', 'Community', 'Workshop']
      }
    ],
    Canceled: [
      {
        id: 14,
        title: 'Beach Yoga Class',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-05',
        time: '7:00 AM',
        address: '123 Ocean Blvd',
        capacity: 30,
        status: 'Canceled',
        categories: ['Health', 'Outdoors', 'Yoga']
      },
      {
        id: 15,
        title: 'Art for All Festival',
        image: 'https://via.placeholder.com/150',
        eventImages: [
          'https://via.placeholder.com/150/FFBB00',
          'https://via.placeholder.com/150/FFDD88',
          'https://via.placeholder.com/150/AA88CC'
        ],
        description: 'Join us in distributing food at the local food bank.',
        date: '2024-11-03',
        time: '5:00 PM',
        address: '789 Art St',
        capacity: 100,
        status: 'Canceled',
        categories: ['Art', 'Festival', 'Community']
      }
    ]
  };
  
  export default mockEventData;
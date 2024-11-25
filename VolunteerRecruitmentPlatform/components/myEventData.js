import { average } from "firebase/firestore";

// myEventData.js
const myEventData = {
    watchlist: [
        {
            id: 1,
            title: 'Community Cleanup',
            image:'https://via.placeholder.com/150/0000FF',
            imageEvent: [
                'https://via.placeholder.com/150/0000FF',
                'https://via.placeholder.com/150/FF0000',
                'https://via.placeholder.com/150/00FF00'
              ],
            description: 'A neighborhood cleanup event.',
            date: '2024-11-25',
            time: '9:00 AM',
            address: '123 Cleanup St',
            averageRating: 4,
            categories: ['Community', 'Environment'],
            status: "catalog"
        },
    ],
    pending: [
        {
            id: 2,
            title: 'Tree Planting Drive',
            image:'https://via.placeholder.com/150/0000FF',
            imageEvent: [
                'https://via.placeholder.com/150/0000FF',
                'https://via.placeholder.com/150/FF0000',
                'https://via.placeholder.com/150/00FF00'
              ],
            description: 'Join us in planting trees.',
            date: '2024-12-05',
            time: '10:00 AM',
            address: '456 Forest Rd',
            averageRating: 4,
            categories: ['Environment', 'Volunteer'],
            status: "pending"
        },
    ],
    active: [
        {
            id: 3,
            title: 'Food Distribution',
            image:'https://via.placeholder.com/150/0000FF',
            imageEvent: [
                'https://via.placeholder.com/150/0000FF',
                'https://via.placeholder.com/150/FF0000',
                'https://via.placeholder.com/150/00FF00'
              ],
            description: 'Help distribute food to those in need.',
            date: '2024-11-10',
            time: '2:00 PM',
            address: '789 Foodbank Rd',
            averageRating: 4,
            categories: ['Charity', 'Community'],
            status: "active"
        },
    ],
    expired: [
        {
            id: 4,
            title: 'Charity Walkathon',
            image:'https://via.placeholder.com/150/0000FF',
            imageEvent: [
                'https://via.placeholder.com/150/0000FF',
                'https://via.placeholder.com/150/FF0000',
                'https://via.placeholder.com/150/00FF00'
              ],
            description: 'A charity event for health awareness.',
            date: '2024-10-01',
            time: '8:00 AM',
            address: '101 Health St',
            averageRating: 4,
            categories: ['Health', 'Charity'],
            status: "expired"
        },
    ],
    upcoming: [
        {
          id: 8,
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
          averageRating: 4,
          categories: ['Environment', 'Community', 'Gardening'],
          status: "catalog"
        }
      ],
      inProgress: [
        {
          id: 9,
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
          averageRating: 4,
          categories: ['Health', 'Outdoors', 'Volunteer'],
          status: "catalog"
        }
      ],
      completed: [
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
          date: '2024-11-30',
          time: '4:00 PM',
          address: '789 Foodbank Rd',
          capacity: 100,
          status: 'Open',
          averageRating: 4,
          categories: ['Charity', 'Community', 'Volunteer'],
          status: "catalog"
        }
      ],
      canceled: [
        {
          id: 11,
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
          averageRating: 4,
          categories: ['Environment', 'Community', 'Gardening'],
          status: "catalog"
        }
      ],
};

export default myEventData;
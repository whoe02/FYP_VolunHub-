// myEventData.js
const myEventData = {
    watchlist: [
        {
            id: 1,
            title: 'Community Cleanup',
            image: 'https://via.placeholder.com/150',
            description: 'A neighborhood cleanup event.',
            date: '2024-11-25',
            time: '9:00 AM',
            address: '123 Cleanup St',
            categories: ['Community', 'Environment'],
            status: "catalog"
        },
    ],
    pending: [
        {
            id: 2,
            title: 'Tree Planting Drive',
            image: 'https://via.placeholder.com/150',
            description: 'Join us in planting trees.',
            date: '2024-12-05',
            time: '10:00 AM',
            address: '456 Forest Rd',
            categories: ['Environment', 'Volunteer'],
            status: "pending"
        },
    ],
    active: [
        {
            id: 3,
            title: 'Food Distribution',
            image: 'https://via.placeholder.com/150',
            description: 'Help distribute food to those in need.',
            date: '2024-11-10',
            time: '2:00 PM',
            address: '789 Foodbank Rd',
            categories: ['Charity', 'Community'],
            status: "active"
        },
    ],
    expired: [
        {
            id: 4,
            title: 'Charity Walkathon',
            image: 'https://via.placeholder.com/150',
            description: 'A charity event for health awareness.',
            date: '2024-10-01',
            time: '8:00 AM',
            address: '101 Health St',
            categories: ['Health', 'Charity'],
            status: "expired"
        },
    ],
};

export default myEventData;
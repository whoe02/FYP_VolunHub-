const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDQXdMGS7wiBcpbcrH9_yGNdakRCOTwA70",
    authDomain: "test-e6569.firebaseapp.com",
    projectId: "test-e6569",
    storageBucket: "test-e6569.appspot.com",
    messagingSenderId: "682695166796",
    appId: "1:682695166796:android:0b707e91e3286335ff9de9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generate users
const generateUsers = async () => {
    const volunteers = [
        {
            userId: 'VL00001',
            name: 'Chew Jia Xian',
            password: 'chew1234',
            address: 'dudsudsjdsjdjs dsudsdsj dusdusjdsjd',
            email: 'jxchew2015@gmail.com',
            icNum: '010203101852',
            phoneNum: '0123456789',
            rewardPoint: 250,
            role: 'volunteer',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/fx8qvjepyyb4ifakjv3i.jpg',
            lastCheckInDate: '',
            usersReward: [
                {
                    rewardCode: 'RW12345',
                    userRewardId: 'RWD00001',
                    title: 'Free Coffee Voucher',
                    description: 'Enjoy a free cup of coffee at participating locations.',
                    expirationDate: '2024-12-31',
                    pointsRequired: 50,
                    image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/fx8qvjepyyb4ifakjv3i.jpg',
                }
            ],
            location: ['location_Kota Kinabalu', 'location_Alor Setar', 'location_Johor Bahru'],
            preference: ['preference_Art', 'preference_Community Service', 'preference_Education', 'preference_Sports', 'preference_Health'],
            skills: ['skills_Event Management', 'skills_First Aid'],
            userHistory: [
                {
                    historyId: 'HIST00001',
                    date: '2024-11-22',
                    title: 'Reward Redemption',
                    description: 'Redeemed a Free Coffee Voucher',
                    pointsUsed: 50
                }
            ],
            userEvent: [
                {
                    applicationStatus: '',
                    eventId: '',
                    lastUpdated: '',
                    status: ''
                }
            ]
        },
        {
            userId: 'VL00002',
            name: 'Chew Jia Xian',
            password: 'chew1234',
            address: 'dudsudsjdsjdjs dsudsdsj dusdusjdsjd',
            email: 'jxchew2016@gmail.com',
            icNum: '010203101852',
            phoneNum: '0123456789',
            rewardPoint: 1250,
            role: 'volunteer',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/daeogkboj4lzmx6mkrqk.jpg',
            lastCheckInDate: '',
            usersReward: [
                {
                    rewardCode: 'RW67890',
                    userRewardId: 'RWD00002',
                    title: 'Discount Voucher',
                    description: 'Get 20% off your next purchase.',
                    expirationDate: '2024-12-31',
                    pointsRequired: 100,
                    image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/daeogkboj4lzmx6mkrqk.jpg',
                }
            ],
            location: ['location_Kuala Lumpur', 'location_Penang'],
            preference: ['preference_Technology', 'preference_Environment', 'preference_Sports'],
            skills: ['skills_Programming', 'skills_Public Speaking'],
            userHistory: [
                {
                    historyId: 'HIST00002',
                    date: '2024-11-22',
                    title: 'Reward Redemption',
                    description: 'Redeemed a Discount Voucher',
                    pointsUsed: 100
                }
            ],
            userEvent: [
                {
                    applicationStatus: '',
                    eventId: '',
                    lastUpdated: '',
                    status: ''
                }
            ]
        }
    ];

    const organizations = [
        {
            userId: 'OG00001',
            name: 'Org Name',
            password: 'orgpass123',
            address: 'organization address example',
            email: 'orgemail@example.com',
            phoneNum: '0198765432',
            role: 'organization',
            businessType: 'example',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/xctd0jtkbbvteiag6546.jpg'
        },
        {
            userId: 'OG00002',
            name: 'Org Name',
            password: 'orgpass123',
            address: 'organization address example',
            email: 'orgemail1@example.com',
            phoneNum: '0198765432',
            role: 'organization',
            businessType: 'example',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/izmo9ofcbhn7zygxvcsu.jpg'
        }
    ];

    const admins = [
        {
            userId: 'AD00001',
            name: 'Admin Name',
            password: 'adminpass123',
            address: 'admin address example',
            email: 'adminemail@example.com',
            icNum: '030203101852',
            phoneNum: '0171234567',
            role: 'admin',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/l3hcsly51prvzrirbliq.jpg'
        },
        {
            userId: 'AD00002',
            name: 'Admin Name',
            password: 'adminpass123',
            address: 'admin address example',
            email: 'adminemail2@example.com',
            icNum: '030203101852',
            phoneNum: '0171234567',
            role: 'admin',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663773/UserProfilePic/njehb69k53qb45rrdrm2.jpg'
        }
    ];

    const allUsers = [...volunteers, ...organizations, ...admins];

    // Insert users into Firestore
    for (const user of allUsers) {
        try {
            const userRef = doc(db, 'User', user.userId);
            // Add user document
            await setDoc(userRef, {
                name: user.name,
                password: user.password,
                address: user.address,
                email: user.email,
                icNum: user.icNum,
                phoneNum: user.phoneNum,
                rewardPoint: user.rewardPoint,
                role: user.role,
                status: user.status,
                birthDate: user.birthDate,
                image: user.image,
                lastCheckInDate: user.lastCheckInDate,
                location: user.location,
                preference: user.preference,
                skills: user.skills
            });
            console.log(`User ${user.userId} added successfully`);

            // Add rewards as a subcollection for volunteers
            if (user.role === 'volunteer') {
                for (const reward of user.usersReward) {
                    const rewardDocRef = doc(collection(db, `User/${user.userId}/usersReward`));
                    await setDoc(rewardDocRef, reward);
                    console.log(`Reward ${reward.userRewardId} added under User ${user.userId}`);
                }

                // Add user history as a subcollection for volunteers
                for (const history of user.userHistory) {
                    const historyDocRef = doc(collection(db, `User/${user.userId}/userHistory`));
                    await setDoc(historyDocRef, history);
                    console.log(`History ${history.historyId} added under User ${user.userId}`);
                }

                // Add UserEvent subcollection with initial empty values
                for (const userEvent of user.userEvent) {
                    const userEventDocRef = doc(collection(db, `User/${user.userId}/UserEvent`));
                    await setDoc(userEventDocRef, userEvent);
                    console.log(`UserEvent added under User ${user.userId}`);
                }
            }
        } catch (error) {
            console.error(`Error adding user ${user.userId}:`, error);
        }
    }
};

// Run the function
generateUsers().then(() => {
    console.log('Data insertion complete.');
    process.exit();
});

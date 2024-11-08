import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReviewScreen = ({ route, user = { id:'a001', name: 'Hoe', role: 'Volunteer' } }) => {
    const { event } = route.params;

    const [reviews, setReviews] = useState([
        { id: 1, name: 'Alice', rating: 5, date: '2024-11-01', description: 'Great event! Learned a lot.' },
        { id: 2, name: 'Bob', rating: 4.5, date: '2024-11-02', description: 'Very informative and engaging.' },
        { id: 3, name: 'Charlie', rating: 3, date: '2024-11-03', description: 'The event was okay, could be better.' },
        { id: 4, name: 'David', rating: 5, date: '2024-11-04', description: 'Amazing! Highly recommend.' },
        { id: 5, name: 'Eve', rating: 1, date: '2024-11-05', description: 'Not what I expected. Very disappointed.' },
    ]);

    const [selectedTab, setSelectedTab] = useState('all');
    const [replies, setReplies] = useState({});
    const [isReplyVisible, setIsReplyVisible] = useState(null);
    const [newReview, setNewReview] = useState('testing 123');
    const [userRating, setUserRating] = useState(3);

    const calculateAverageRating = () => {
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return (total / reviews.length).toFixed(1);
    };

    const ratingCounts = [5, 4, 3, 2, 1].map(
        star => reviews.filter(review => Math.floor(review.rating) === star).length
    );

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const stars = [];

        for (let i = 0; i < fullStars; i++) {
            stars.push(<Ionicons key={i} name="star" size={20} color="#f5c518" />);
        }

        if (hasHalfStar) {
            stars.push(<Ionicons key="half" name="star-half" size={20} color="#f5c518" />);
        }

        return stars;
    };

    const toggleReplyVisibility = (reviewId) => {
        setIsReplyVisible(isReplyVisible === reviewId ? null : reviewId);
    };

    const handleReplyChange = (reviewId, text) => {
        setReplies((prevReplies) => ({
            ...prevReplies,
            [reviewId]: text,
        }));
    };

    const handleSubmitReply = (reviewId) => {
        console.log(`Reply to review ${reviewId}: ${replies[reviewId]}`);
        setIsReplyVisible(null);
    };

    const addReview = () => {
        const newId = reviews.length + 1;
        const date = new Date().toISOString().split('T')[0];
        const newReviewData = { id: newId, name: user.name, rating: userRating, date, description: newReview };
        setReviews([...reviews, newReviewData]);
        setNewReview('');
        setUserRating(0);
    };

    return (
        <View style={styles.container}>
            {/* Title and Average Rating */}
            <View style={styles.ratingSection}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.ratingText}>Rating and Reviews</Text>
                <View style={styles.ratingDetailsRow}>
                    <View style={styles.averageRatingContainer}>
                        <Text style={styles.averageRating}>{calculateAverageRating()}</Text>
                        <Text style={styles.ratingCount}>({reviews.length} ratings)</Text>
                    </View>
                    <View style={styles.starsContainer}>
                        {renderStars(parseFloat(calculateAverageRating()))}
                    </View>
                </View>

                {/* Rating Chart */}
                <View style={styles.ratingChartContainer}>
                    {[5, 4, 3, 2, 1].map((star, index) => (
                        <View key={star} style={styles.ratingChartRow}>
                            <Text style={styles.starText}>{star} Star</Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${(ratingCounts[index] / reviews.length) * 100}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.ratingCount}>{ratingCounts[index]}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Tabbed Rating Filter */}
            <View style={styles.tabsContainer}>
                {['all', '1', '5'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab === 'all' ? 'All' : `${tab} Star`}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Review List */}
            <FlatList
                data={selectedTab === 'all' ? reviews : reviews.filter(r => Math.floor(r.rating) === parseInt(selectedTab))}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.reviewContainer}>
                        <Text style={styles.reviewerName}>{item.name}</Text>
                        <View style={styles.reviewRating}>{renderStars(item.rating)}</View>
                        <Text style={styles.reviewDate}>{item.date}</Text>
                        <Text style={styles.reviewDescription}>{item.description}</Text>

                        {/* Reply Section */}
                        {user.role === 'Organization' && (
                            <View style={styles.replyContainer}>
                                <TouchableOpacity onPress={() => toggleReplyVisibility(item.id)} style={styles.replyButton}>
                                    <Text style={styles.replyButtonText}>Reply</Text>
                                </TouchableOpacity>

                                {isReplyVisible === item.id && (
                                    <View style={styles.replyInputContainer}>
                                        <TextInput
                                            style={styles.replyInput}
                                            placeholder="Write a reply..."
                                            value={replies[item.id] || ''}
                                            onChangeText={(text) => handleReplyChange(item.id, text)}
                                        />
                                        <TouchableOpacity style={styles.submitReplyButton} onPress={() => handleSubmitReply(item.id)}>
                                            <Text style={styles.submitReplyButtonText}>Submit</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {replies[item.id] && !isReplyVisible && (
                                    <Text style={styles.replyText}>
                                        <Text style={{ fontWeight: 'bold' }}>Organization</Text>: {replies[item.id]}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
                ListFooterComponent={<View style={{ height: 10 }} />}
                extraData={selectedTab}
            />

            {/* Add Review Section */}
            {user.role === 'Volunteer' && (
                <View style={styles.addReviewSection}>
                    <Text style={styles.addReviewTitle}>Review</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                                <Ionicons name={userRating >= star ? 'star' : 'star-outline'} size={20} color="#f5c518" />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="Write your review..."
                        value={newReview}
                        onChangeText={setNewReview}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={addReview}>
                        <Text style={styles.submitButtonText}>Submit Review</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    ratingSection: {
        marginBottom: 20,
    },
    ratingDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    averageRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    averageRating: {
        fontSize: 28,
        fontWeight: 'bold',
        marginRight: 5,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom:10,
    },
    ratingChartContainer: {
        marginTop: 10,
    },
    ratingChartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    starText: {
        width: 60,
    },
    progressBar: {
        flex: 1,
        height: 10,
        backgroundColor: '#ddd',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#6a8a6d',
    },
    ratingCount: {
        marginLeft: 10,
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: -5,
    },
    tabButton: {
        padding: 6,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        alignItems: 'center',
        width: '30%',
    },
    activeTab: {
        backgroundColor: '#6a8a6d',
    },
    tabText: {
        fontSize: 14,
        color: '#333',
    },
    activeTabText: {
        color: '#fff',
    },
    reviewContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    reviewRating: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
        marginVertical: 5,
    },
    reviewDescription: {
        fontSize: 14,
        color: '#333',
    },
    replyContainer: {
        marginTop: 10,
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
    },
    replyButtonText: {
        fontSize: 14,
        marginLeft: -3,
        color: '#6a8a6d',
    },
    replyInputContainer: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyInput: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    submitReplyButton: {
        marginLeft: 10,
        backgroundColor: '#6a8a6d',
        padding: 8,
        borderRadius: 5,
    },
    submitReplyButtonText: {
        color: '#fff',
    },
    replyText: {
        marginTop: 5,
        fontSize: 14,
        color: '#333',
    },
    addReviewSection: {
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
    },
    addReviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    userRole: {
        fontSize: 14,
        marginBottom: 10,
        color: '#555',
    },
    ratingInput: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
        keyboardType: 'numeric',
    },
    descriptionInput: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: '#6a8a6d',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});


export default ReviewScreen;

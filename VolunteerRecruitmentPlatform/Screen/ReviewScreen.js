import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs, addDoc, query, where, Timestamp, updateDoc,doc,deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';  // Ensure firestore is imported from your firebase config
import { useUserContext } from '../UserContext'; // User context for getting user details
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native'; 


const ReviewScreen = ({ route }) => {
  const { user } = useUserContext();  // User data from context
  const { event } = route.params;  // Event details passed via route

  const [reviews, setReviews] = useState([]);  // State for reviews
  const [loading, setLoading] = useState(true);  // Loading state
  const [newReview, setNewReview] = useState('');  // New review text input
  const [userRating, setUserRating] = useState(3);  // User rating for review
  const [userReviewExists, setUserReviewExists] = useState(false);  // Check if user has already reviewed
  const [selectedTab, setSelectedTab] = useState('all');  // Tab for filtering reviews
  const [replies, setReplies] = useState({});  // State for replies
  const [isReplyVisible, setIsReplyVisible] = useState(null);  // Show/hide reply input
  const [userReview, setUserReview] = useState(null); 

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

  const generateReviewId = async () => {
    // Query the Firestore collection for reviews related to the specific event
    const reviewsRef = collection(firestore, 'Review');
    const reviewsSnapshot = await getDocs(reviewsRef);
    
    // Generate new review ID based on the number of reviews in the collection
    const newReviewId = `RV${(reviewsSnapshot.size + 1).toString().padStart(5, '0')}`;
    
    console.log('Generated Review ID:', newReviewId);
    return newReviewId;
  };

  const addReview = async () => {
    if (!newReview.trim()) {
      alert('Your review is empty');
      return; // Prevent empty reviews
    }
  
    const reviewId = userReviewExists ? userReview.reviewId : await generateReviewId(); // If review exists, update; else generate a new ID
  
    const reviewData = {
      reviewId: reviewId,
      userId: user.userId,
      userName: user.name,
      description: newReview.trim(),
      eventId: event.id,
      rating: userRating,
      date: Timestamp.fromDate(new Date()),
    };
  
    try {
      if (userReviewExists) {
        // Update existing review
        await updateDoc(doc(firestore, 'Review', userReview.id), reviewData);
        alert('Review updated!');
      } else {
        // Add new review
        await addDoc(collection(firestore, 'Review'), reviewData);
        alert('Review added!');
      }
  
      // Update the local reviews state after adding or updating
      setReviews((prevReviews) => {
        if (userReviewExists) {
          // Update the existing review in the state
          return prevReviews.map((review) =>
            review.id === userReview.id ? { ...review, ...reviewData } : review
          );
        } else {
          // Add the new review to the state
          return [{ id: Date.now().toString(), ...reviewData, date: new Date() }, ...prevReviews];
        }
      });

      setNewReview(''); 
      setUserRating(3); 
      setUserReviewExists(true); 
  
    } catch (error) {
      console.error('Error adding/updating review:', error);
    }
  };
  
  
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const reviewsRef = collection(firestore, 'Review');
      const q = query(reviewsRef, where('eventId', '==', event.id));
      const reviewsSnapshot = await getDocs(q);
      const reviewsData = reviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(), // Convert Firestore timestamp to JS Date
      }));
      setReviews(reviewsData);

      // Check if the user has already submitted a review
      const existingUserReview = reviewsData.find((review) => review.userId === user.userId);
      if (existingUserReview) {
        setUserReview(existingUserReview); // Store the review data for the user
        setNewReview(existingUserReview.description); // Pre-fill the review text
        setUserRating(existingUserReview.rating); // Pre-fill the rating
        setUserReviewExists(true); // Mark that the user has reviewed
      } else {
        setUserReview(null); // If no review, make sure it's null
        setUserReviewExists(false); // Mark that the user hasn't reviewed
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async () => {
    if (!userReview) return;
  
    try {
      // Use Alert to confirm the delete action
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete your review?',
        [
          {
            text: 'Cancel',  // Button to cancel the action
            onPress: () => console.log('Delete cancelled'),
            style: 'cancel',
          },
          {
            text: 'OK',  // Button to confirm the deletion
            onPress: async () => {
              // Delete the review from Firestore
              await deleteDoc(doc(firestore, 'Review', userReview.id));
        
              // Remove the review from the local state
              setReviews((prevReviews) =>
                prevReviews.filter((review) => review.id !== userReview.id)
              );
        
              // Reset the user's review state
              setUserReview(null);
              setUserReviewExists(false);
              setNewReview('');
              setUserRating(3);
        
              alert('Review deleted successfully!');
            },
          },
        ],
        { cancelable: true }  // Allow cancellation if user taps outside
      );
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete the review.');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderReview = ({ item }) => {
    
    let date = item.date;
    
    // If it's a Firestore Timestamp, convert it to Date object
    if (date && date.toDate) {
      date = date.toDate();
    } else {
      date = new Date(date);
    }
    
    // Ensure it's a valid Date object
    const formattedDateTime = date instanceof Date && !isNaN(date) 
      ? date.toLocaleString() // This will display both date and time
      : 'Invalid date and time';
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewerName}>{item.userName}</Text>
          <View style={styles.reviewRating}>{renderStars(item.rating)}</View>
        </View>
        <Text style={styles.reviewDate}>{formattedDateTime}</Text>
        <Text style={styles.reviewDescription}>{item.description}</Text>
      </View>
    );
  };
  
  


  return (
    <View style={{ flex: 1,padding:10 }}>
      {/* Main Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Static Title and Average Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.ratingText}>Rating and Reviews</Text>
          <View style={styles.ratingDetailsRow}>
            <View style={styles.averageRatingContainer}>
              <Text style={styles.averageRating}>
                {calculateAverageRating()}
              </Text>
              <Text style={styles.ratingCount}>
                ({reviews.length} ratings)
              </Text>
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
                      {
                        width: `${
                          (ratingCounts[index] / reviews.length) * 100
                        }%`,
                      },
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
          {['all', '1', '5'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.activeTab,
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab === 'all' ? 'All' : `${tab} Star`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
          data={
            selectedTab === 'all'
              ? reviews
              : reviews.filter((r) => Math.floor(r.rating) === parseInt(selectedTab))
          }
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReview}
          contentContainerStyle={{ paddingBottom: 100 }} // To ensure space for Add Review Section
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
  
      {/* Fixed Add Review Section */}
      {user.role === 'volunteer' && (
        <View style={styles.addReviewSection}>
          <Text style={styles.addReviewTitle}>Review</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                <Ionicons
                  name={userRating >= star ? 'star' : 'star-outline'}
                  size={20}
                  color="#f5c518"
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Write your review..."
            value={newReview}
            onChangeText={setNewReview}
          />
          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.submitButton} onPress={addReview}>
              <Text style={styles.submitButtonText}>
                {userReviewExists ? 'Update Review' : 'Submit Review'}
              </Text>
            </TouchableOpacity>

            {/* Delete button only if the user has already submitted a review */}
            {userReviewExists && (
              <TouchableOpacity
                style={[styles.deleteButton]}
                onPress={deleteReview}  // Call the delete function
              >
                <Text style={styles.submitButtonText}>Delete Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

    </View>
  );
  
  
};

const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: '#FFFFFF',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    ratingSection: {
      padding: 15,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
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
      marginBottom: 10,
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
      justifyContent: 'space-around',
      paddingVertical: 10,
      backgroundColor: '#fff',
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
    reviewCard: {
      padding: 20,
      marginBottom: 15,
      borderBottomWidth: 1,  
      borderBottomColor: '#ccc',  
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    reviewerName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    reviewRating: {
      fontSize: 14,
      color: '#f5c518',
      flexDirection: 'row',
    },
    reviewDate: {
      fontSize: 12,
      color: 'gray',
    },
    reviewDescription: {
      fontSize: 14,
      marginTop: 5,
    },
    addReviewSection: {
      position: 'absolute',
      height:220,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 5,
      elevation: 3, 
      padding:15,
    },
    addReviewTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    descriptionInput: {
      height: 70,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: '#6a8a6d',
      paddingVertical: 10,
      width:120,
      borderRadius: 10,
      marginTop: 10,
    },
    submitButtonText: {
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#fff',
    },
    flatList: {
      flex: 1,
    },
    scrollView: {
      flexGrow: 1, // Allow the ScrollView to grow and fill the screen
    },
    reviewActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center', 
      marginTop: 10,
    },
    deleteButton: {
      backgroundColor: '#ff4d4d',
      marginLeft:10,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 10,
      width:120,
    },
    deleteButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });
  
export default ReviewScreen;

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
import { collection, getDocs, addDoc, query, where, Timestamp, updateDoc,doc,deleteDoc,getDoc,setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';  // Ensure firestore is imported from your firebase config
import { useUserContext } from '../UserContext'; // User context for getting user details
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native'; 


const ReviewScreen = ({ route }) => {
  const { user } = useUserContext();  
  const { event } = route.params;  

  const [reviews, setReviews] = useState([]); 
  const [loading, setLoading] = useState(true);  
  const [newReview, setNewReview] = useState('');  
  const [userRating, setUserRating] = useState(3); 
  const [userReviewExists, setUserReviewExists] = useState(false);  
  const [selectedTab, setSelectedTab] = useState('all');  
  const [userReview, setUserReview] = useState(null); 
  //reply
  const [replies, setReplies] = useState({});  
  const [isReplyVisible, setIsReplyVisible] = useState(null);  
  const isEventEligibleForReview = event.status === 'inprogress' || event.status === 'complete';


  //star
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
  //reply
  const toggleReplyVisibility = (reviewId) => {
    setIsReplyVisible(isReplyVisible === reviewId ? null : reviewId);
  };
  const handleReplyChange = (reviewId, text) => {
    setReplies((prevReplies) => ({
      ...prevReplies,
      [reviewId]: text,
    }));
  };
  const generateReplyId = async (reviewId) => {
    const replyRef = collection(firestore, 'Review', reviewId, 'Reply');
    const repliesSnapshot = await getDocs(replyRef);
  
    // Generate new reply ID based on the number of replies for the review
    const newReplyId = `RPL${(repliesSnapshot.size + 1).toString().padStart(5, '0')}`;
    return newReplyId;
  };
    const handleDeleteReply = (reviewId, replyId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const replyDocRef = doc(firestore, 'Review', reviewId, 'Reply', replyId);
              console.log('Attempting to delete document:', replyDocRef.path);
  
              // Confirm document exists
              const docSnapshot = await getDoc(replyDocRef);
              if (!docSnapshot.exists()) {
                console.log('Document does not exist:', replyDocRef.path);
                Alert.alert('Error', 'The reply does not exist or has already been deleted.');
                return;
              }
  
              // Delete the document
              await deleteDoc(replyDocRef);
              console.log('Document deleted successfully');
  
              // Update local state
              setReviews((prevReviews) =>
                prevReviews.map((review) =>
                  review.id === reviewId
                    ? {
                        ...review,
                        replies: review.replies.filter((reply) => reply.id !== replyId),
                      }
                    : review
                )
              );
  
              Alert.alert('Success', 'Reply deleted successfully!');
            } catch (error) {
              console.error('Error deleting reply:', error);
              Alert.alert('Error', 'Failed to delete the reply. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  const handleSubmitReply = async (reviewId) => {
    if (user.role !== 'organization') {
      alert('Only organization users can reply to reviews');
      return; 
    }
    const replyText = replies[reviewId];
    
    if (!replyText) {
      alert('Reply cannot be empty!');
      return;
    }
    
    try {
      const reviewRef = doc(firestore, 'Review', reviewId);
      const reviewSnapshot = await getDoc(reviewRef);

      if (!reviewSnapshot.exists()) {
          alert('Review does not exist!');
          return;
      }

      const reviewData = reviewSnapshot.data();
      const reviewUserId = reviewData.userId; // Assuming `userId` field exists in the review document
      // Check if a reply already exists for this review
      const replyRef = collection(firestore, 'Review', reviewId, 'Reply');
      const existingRepliesSnapshot = await getDocs(replyRef);
      const existingReplyDoc = existingRepliesSnapshot.docs.find(
        (doc) => doc.data().userId === user.userId
      );
      
      if (existingReplyDoc) {
        // Update existing reply
        const replyDocRef = doc(
          firestore,
          'Review',
          reviewId,
          'Reply',
          existingReplyDoc.id
        );
        await updateDoc(replyDocRef, { replyText, date: Timestamp.fromDate(new Date()) });
        
        // Update local state
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  replies: review.replies.map((reply) =>
                    reply.id === existingReplyDoc.id
                      ? { ...reply, replyText, date: new Date() }
                      : reply
                  ),
                }
              : review
          )
        );
      } else {
        // Generate custom reply ID
        const newReplyId = await generateReplyId(reviewId); // Use custom ID generation logic
        const replyData = {
          id: newReplyId,
          userId: user.userId,
          replyText,
          date: Timestamp.fromDate(new Date()),
        };
        
        // Add new reply with custom ID
        const replyDocRef = doc(firestore, 'Review', reviewId, 'Reply', newReplyId);
        await setDoc(replyDocRef, replyData);
        
        // Update local state
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === reviewId
              ? { ...review, replies: [...(review.replies || []), replyData] }
              : review
          )
        );
      }

      try {
        // Fetch the recipient's device token from Firestore
        const recipientRef = doc(firestore, 'User', reviewUserId);
        const recipientDoc = await getDoc(recipientRef);
  
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          const recipientToken = recipientData.deviceToken;
  
          if (recipientToken) {
            const notificationData = {
              title: 'New Review Reply',
              body: `A new review reply for ${event.title}.`,
              content: ``,
              type: 'review',
              eventId: event.eventId,
              timestamp: new Date(),
              read: false,
            };
  
            await sendNotification(recipientToken, notificationData.body, notificationData, reviewUserId);
          }
        }
      } catch (error) {
        console.error('Error fetching recipient data:', error);
      }
      
      setReplies((prevReplies) => ({ ...prevReplies, [reviewId]: '' })); // Clear reply input
      setIsReplyVisible(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply.');
    }
  };

  const generateReviewId = async () => {
    // Query the Firestore collection for reviews related to the specific event
    const reviewsRef = collection(firestore, 'Review');
    const reviewsSnapshot = await getDocs(reviewsRef);
    
    // Generate new review ID based on the number of reviews in the collection
    const newReviewId = `RV${(reviewsSnapshot.size + 1).toString().padStart(5, '0')}`;
    
    return newReviewId;
  };

      // Save the notification to Firestore
      const saveNotificationToFirestore = async (userId, notificationData) => {
        try {
          const userRef = doc(firestore, 'User', userId);
          const notificationRef = collection(userRef, 'Notification');
          await addDoc(notificationRef, notificationData);
          console.log('Notification saved to Firestore successfully');
        } catch (error) {
          console.error('Error saving notification to Firestore:', error);
        }
      };
      
      const sendNotification = async (recipientToken, message, notificationData, recipientId) => {
        try {
          const messageBody = {
            to: recipientToken,
            sound: 'default',
            title: notificationData.title,
            body: notificationData.body,
            data: {
              type: notificationData.type,
              content: notificationData.content,
            },
          };
      
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageBody),
          });
      
          // Save notification to Firestore
          await saveNotificationToFirestore(recipientId, notificationData);
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      };
  //add and update
  const addReview = async () => {
    if (user.role !== 'volunteer') {
      alert('Only volunteers can add or update reviews');
      return; 
    }
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
        if (!userReview.reviewId) {
          console.error("Error: Review ID is missing when updating");
          return; 
        }
        await updateDoc(doc(firestore, 'Review', userReview.id), reviewData);
        alert('Review updated!');
      } else {
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
          
      try {
        // Fetch the recipient's device token from Firestore
        const recipientRef = doc(firestore, 'User', event.userId);
        const recipientDoc = await getDoc(recipientRef);
  
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          const recipientToken = recipientData.deviceToken;
  
          if (recipientToken) {
            const notificationData = {
              title: 'New Review',
              body: `A new review for ${event.title}.`,
              content: ``,
              type: 'review',
              eventId: event.eventId,
              timestamp: new Date(),
              read: false,
            };
  
            await sendNotification(recipientToken, notificationData.body, notificationData, event.userId);
          }
        }
      } catch (error) {
        console.error('Error fetching recipient data:', error);
      }

      setNewReview(''); 
      setUserRating(3); 
      setUserReviewExists(true); 
      fetchReviews();
  
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
  
      // Fetch reviews and their replies
      const reviewsData = await Promise.all(
        reviewsSnapshot.docs.map(async (doc) => {
          const reviewData = {
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(), // Convert Firestore timestamp to JS Date
          };
  
          // Fetch replies subcollection for the review
          const repliesRef = collection(firestore, 'Review', doc.id, 'Reply');
          const repliesSnapshot = await getDocs(repliesRef);
  
          // Map replies data
          const repliesData = repliesSnapshot.docs.map((replyDoc) => ({
            id: replyDoc.id,
            ...replyDoc.data(),
            date: replyDoc.data().date.toDate(), // Convert Firestore timestamp to JS Date
          }));
  
          return {
            ...reviewData,
            replies: repliesData, // Attach replies to the review
          };
        })
      );
  
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
    if (user.role !== 'volunteer') {
      alert('Only volunteers can delete their reviews');
      return; 
    }

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

  const renderReplies = (review) => {
    if (review.replies && review.replies.length > 0) {
      const reply = review.replies[0]; // Ensure only one reply is handled
      const replyDate = reply.date.toDate ? reply.date.toDate() : new Date(reply.date);
  
      return (
        <View style={styles.replyCard}>
          <Text style={styles.replyText}>
            <Text style={{ fontWeight: 'bold' }}>Reply:</Text> {reply.replyText}
          </Text>
          <Text style={styles.replyDate}>{replyDate.toLocaleString()}</Text>
          <View style={styles.replyActions}>
          {/* Only show the reply edit and delete buttons if user is an organization */}
          {user.role === 'organization' && (
            <>
              <TouchableOpacity
                style={styles.replyEditButton}
                onPress={() => {
                  setReplies({ [review.id]: reply.replyText }); // Pre-fill the reply input
                  setIsReplyVisible(review.id);
                }}
              >
                <Text style={styles.replyEditButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.replyDeleteButton}
                onPress={() => handleDeleteReply(review.id, reply.id)}
              >
                <Text style={styles.replyDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
          </View>
        </View>
      );
    }
  
    return null;
  };

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.userName}</Text>
        <View style={styles.reviewRating}>{renderStars(item.rating)}</View>
      </View>
      <Text style={styles.reviewDescription}>{item.description}</Text>
      {renderReplies(item)}
  
      {!item.replies?.length && user.role === 'organization' && (
        <TouchableOpacity
          onPress={() => toggleReplyVisibility(item.id)}
          style={styles.replyButton}
        >
          <Text style={styles.replyButtonText}>
            {isReplyVisible === item.id ? 'Cancel' : 'Reply'}
          </Text>
        </TouchableOpacity>
      )}
  
      {isReplyVisible === item.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            value={replies[item.id] || ''}
            onChangeText={(text) => handleReplyChange(item.id, text)}
          />
          <TouchableOpacity
            onPress={() => handleSubmitReply(item.id)}
            style={styles.submitReplyButton}
          >
            <Text style={styles.submitReplyButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1,paddingHorizontal:10 }}>
      {/* Main Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Static Title and Average Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={{fontSize:13}}>Rating and Reviews</Text>
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
      {user.role === 'volunteer' && (event.status === 'inprogress' || event.status === 'completed') &&  (
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
      fontSize: 20,
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
      marginBottom: 5,
    },
    ratingChartContainer: {
      marginTop: 10,
    },
    ratingChartRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    starText: {
      width: 60,
    },
    progressBar: {
      flex: 1,
      height: 7,
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
      paddingVertical: 8,
      backgroundColor: '#fff',
    },
    tabButton: {
      padding: 6,
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
      padding: 10,
      paddingTop:7,
      marginBottom: 15,
      borderBottomWidth: 1,  
      borderBottomColor: '#ccc',  
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
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
      flexGrow: 1, 
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
    repliesContainer: {
      marginTop: 10,
      paddingLeft: 20,
      borderLeftWidth: 2,
      borderLeftColor: '#ccc',
    },
    replyCard: {
      marginBottom: 10,
      backgroundColor: '#f9f9f9',
      padding: 10,
      borderRadius: 5,
    },
    replyText: {
      fontSize: 14,
      color: '#333',
    },
    replyDate: {
      fontSize: 12,
      color: 'gray',
      marginTop: 5,
    },
    replyButton: {
      marginTop: 10,
      alignSelf: 'flex-end',
    },
    replyButtonText: {
      fontSize: 14,
      color: '#6a8a6d',
      fontWeight: 'bold',
    },
    replyInputContainer: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    replyInput: {
      flex: 1,
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
    },
    submitReplyButton: {
      backgroundColor: '#6a8a6d',
      marginLeft: 10,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 5,
    },
    submitReplyButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    replyActions: {
      flexDirection: 'row', 
      justifyContent: 'flex-end', 
      alignItems: 'center', 
      marginTop: 5, 
    },
    replyEditButtonText: {
      marginRight:15,
      color: '#6a8a6d',
      fontWeight: 'bold',
    },
    replyDeleteButtonText: {
      color: '#6a8a6d',
      fontWeight: 'bold',
    }
});
  
export default ReviewScreen;

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split  # Import train_test_split
from collections import defaultdict


# Load Data
events_df = pd.read_csv('events.csv')
users_df = pd.read_csv('users.csv')
user_interactions_df = pd.read_csv('user_interactions.csv')

# Handle missing values for Preferences and Skills
users_df['Preferences'] = users_df['Preferences'].fillna('')
users_df['Skills'] = users_df['Skills'].fillna('')
users_df['Location'] = users_df['Location'].fillna('')
events_df['Preferences'] = events_df['Preferences'].fillna('')
events_df['Skills Required'] = events_df['Skills Required'].fillna('')
events_df['Location'] = events_df['Location'].fillna('')

# Combine Preferences and Skills
users_combined = (users_df['Preferences'].str.split(';') + 
                  users_df['Skills'].str.split(';') + 
                  users_df['Location'].str.split(';')).apply(lambda x: list(filter(None, x)))
events_combined = (events_df['Preferences'].str.split(';') + 
                   events_df['Skills Required'].str.split(';') + 
                   events_df['Location'].str.split(';')).apply(lambda x: list(filter(None, x)))

# Convert to binary matrix using MultiLabelBinarizer
mlb = MultiLabelBinarizer()
user_data_binarized = mlb.fit_transform(users_combined)
event_data_binarized = mlb.transform(events_combined)

# Create DataFrames for analysis
user_data_df = pd.DataFrame(user_data_binarized, columns=mlb.classes_)
event_data_df = pd.DataFrame(event_data_binarized, columns=mlb.classes_)

# Train-Test Split on User Interactions
# Here, we split the user interactions into train and test sets
train_df, test_df = train_test_split(user_interactions_df, test_size=0.2, random_state=42)

# Use train_df for training the recommendation system and test_df for evaluation
print(f"Training set size: {len(train_df)}")
print(f"Test set size: {len(test_df)}")

# Content-Based Filtering (CBF)
def recommend_events(user_id, top_n=5):
    if user_id not in users_df['User ID'].values:
        print(f"User ID {user_id} not found.")
        return pd.DataFrame(columns=['Event ID', 'Title'])

    user_idx = users_df[users_df['User ID'] == user_id].index[0]
    user_similarities = cosine_similarity(user_data_df, event_data_df)[user_idx]

    # Get top N similar events
    event_indices = np.argsort(user_similarities)[::-1][:top_n]
    recommended_events = events_df.iloc[event_indices].copy()
    recommended_events['Score'] = user_similarities[event_indices]
    return recommended_events[['Event ID', 'Title', 'Score']].sort_values(by='Score', ascending=False)

# Collaborative Filtering (CF)
def user_user_collaborative_filtering(user_interactions_df):
    interaction_weights = {
        'view': 0.5,
        'review': 2,
        'watchlisted': 3,
        'enquiry': 4,
        'apply': 5
    }

    interaction_matrix = pd.pivot_table(
        user_interactions_df,
        values='Type',
        index='User ID',
        columns='Event ID',
        aggfunc=lambda x: interaction_weights[x.iloc[0]],
        fill_value=0
    )

    user_similarity = cosine_similarity(interaction_matrix)
    user_similarity_df = pd.DataFrame(user_similarity, index=interaction_matrix.index, columns=interaction_matrix.index)

    return user_similarity_df, interaction_matrix

# Fix for Collaborative Recommendations
def collaborative_recommendation_user(user_id, user_similarity_df, interaction_matrix, top_n=20):
    if user_id not in user_similarity_df.index:
        print(f"User ID {user_id} not found.")
        return pd.DataFrame(columns=['Event ID', 'Title', 'Score'])

    # Get the most similar users
    similar_users = user_similarity_df[user_id].sort_values(ascending=False).iloc[1:]  # Exclude the user themselves
    event_scores = defaultdict(float)

    # Score events based on similar users
    for similar_user, similarity in similar_users.items():
        user_events = interaction_matrix.loc[similar_user]
        for event_id, interaction_score in user_events.items():
            if interaction_matrix.loc[user_id, event_id] == 0:  # Only recommend unseen events
                event_scores[event_id] += similarity * interaction_score

    if not event_scores:
        print("No recommended events found for collaborative filtering.")
        return pd.DataFrame(columns=['Event ID', 'Title', 'Score'])

    # Normalize scores for consistent formatting
    max_score = max(event_scores.values()) if event_scores else 1
    event_scores = {k: v / max_score for k, v in event_scores.items()}

    # Convert to DataFrame and sort by score
    scored_events = pd.DataFrame(list(event_scores.items()), columns=['Event ID', 'Score'])
    scored_events = scored_events.sort_values(by='Score', ascending=False).reset_index(drop=True)

    # Select top_n events
    scored_events = scored_events.head(top_n)

    # Fetch event details
    recommended_events = events_df[events_df['Event ID'].isin(scored_events['Event ID'])].copy()
    recommended_events['Score'] = recommended_events['Event ID'].map(dict(zip(scored_events['Event ID'], scored_events['Score'])))

    # Sort by score and return
    return recommended_events[['Event ID', 'Title', 'Score']].sort_values(by='Score', ascending=False)

## Popularity Recommendations (Not based on User ID)
def popularity_recommendation(top_n=20):
    interaction_weights = {
        'view': 0.5,
        'review': 2,
        'watchlisted': 3,
        'enquiry': 4,
        'apply': 5
    }

    # Calculate interaction scores for each event (aggregate across all users)
    interaction_scores = user_interactions_df.groupby('Event ID')['Type'].apply(
        lambda x: sum(interaction_weights[interaction] for interaction in x)
    ).sort_values(ascending=False)

    # Select top_n most popular events
    popular_events = events_df[events_df['Event ID'].isin(interaction_scores.head(top_n).index)].copy()
    popular_events['Score'] = popular_events['Event ID'].map(interaction_scores)

    # Return sorted events by score
    return popular_events[['Event ID', 'Title', 'Score']].sort_values(by='Score', ascending=False)

# Hybrid Recommendations
# Fix for Hybrid Recommendations
def merge_and_score_recommendations(cbf_recs, cf_recs, user_id, alpha=0.5):
    # Normalize CBF scores
    if not cbf_recs.empty:
        cbf_recs['Normalized Score'] = cbf_recs['Score'] / cbf_recs['Score'].max()
    else:
        cbf_recs['Normalized Score'] = 0

    # Normalize CF scores
    if not cf_recs.empty:
        cf_recs['Normalized Score'] = cf_recs['Score'] / cf_recs['Score'].max()
    else:
        cf_recs['Normalized Score'] = 0

    # Merge and calculate weighted scores
    combined_recs = pd.concat([cbf_recs[['Event ID', 'Title', 'Normalized Score']],
                               cf_recs[['Event ID', 'Title', 'Normalized Score']]])
    combined_recs = combined_recs.groupby(['Event ID', 'Title']).sum().reset_index()
    combined_recs['Final Score'] = (alpha * combined_recs['Normalized Score'] +
                                    (1 - alpha) * combined_recs['Normalized Score'])

    # Sort by the final score
    combined_recs = combined_recs.sort_values(by='Final Score', ascending=False).head(20)
    return combined_recs[['Event ID', 'Title', 'Final Score']].rename(columns={'Final Score': 'Score'})


def hybrid_recommendation(user_id, top_n=20, alpha=0.5):
    cbf_recommendations = recommend_events(user_id, top_n)
    user_similarity_df, interaction_matrix = user_user_collaborative_filtering(user_interactions_df)
    cf_recommendations = collaborative_recommendation_user(user_id, user_similarity_df, interaction_matrix, top_n)
    return merge_and_score_recommendations(cbf_recommendations, cf_recommendations, user_id, alpha)

def evaluate_recommendations(user_id, top_n=20):
    # Get the ground truth (user's actual interactions with events)
    actual_interactions = test_df[test_df['User ID'] == user_id]['Event ID'].values

    # Get the recommended events from the hybrid recommendation system
    recommended_events = hybrid_recommendation(user_id, top_n)

    # Get the top N recommended event IDs
    recommended_event_ids = recommended_events['Event ID'].values

    # Calculate Precision and Recall
    precision = len(set(recommended_event_ids) & set(actual_interactions)) / len(recommended_event_ids) if len(recommended_event_ids) > 0 else 0
    recall = len(set(recommended_event_ids) & set(actual_interactions)) / len(actual_interactions) if len(actual_interactions) > 0 else 0

    print(f"Precision at {top_n}: {precision:.2f}")
    print(f"Recall at {top_n}: {recall:.2f}")

# Example Usage
user_id = 'VL00001'

cbf_recs = recommend_events(user_id)
print("\nContent-Based Recommendations:\n", cbf_recs)

# Train the model on the train_df (e.g., using collaborative recommendations)
user_similarity_df, interaction_matrix = user_user_collaborative_filtering(train_df)

# Get recommendations for a user from collaborative filtering
cf_recs = collaborative_recommendation_user(user_id, user_similarity_df, interaction_matrix)
print("\nCollaborative Recommendations:\n", cf_recs)

pop_recs = popularity_recommendation()
print("\nPopularity Recommendations:\n", pop_recs)

hybrid_recs = hybrid_recommendation(user_id)
print("\nHybrid Recommendations:\n", hybrid_recs)
evaluate_recommendations(user_id)


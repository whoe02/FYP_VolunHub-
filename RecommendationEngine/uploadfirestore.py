import firebase_admin
import csv
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase app
cred = credentials.Certificate("C:/Users/jxche/OneDrive/Documents/FYP_VolunHub-/RecommendationEngine/test-e6569-firebase-adminsdk-2pshh-c356a436fc.json")
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()

# Read CSV Function
def read_csv(file_path):
    data = []
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            data.append(row)
    return data

# Upload Users to Firestore
def upload_users_to_firestore(file_path):
    users = read_csv(file_path)
    for user in users:
        try:
            if user["Role"] == "volunteer":
                user_data = {
                    "userId": user["User ID"],
                    "name": user["Name"],
                    "role": user["Role"],
                    "email": user["Email"],
                    "password": user["Password"],
                    "address": user["Address"],
                    "phoneNum": user["Phone Number"],
                    "icNum": user["IC Number"],
                    "birthDate": user["Birth Date"],
                    "image": user["Image"],
                    "status": user["Status"],
                    "checkInStreak": int(user["Check In Streak"]),
                    "rewardPoint": int(user["Reward Points"]),
                    "lastCheckInDate": user["Last Check-In Date"],
                    "location": user["Location"].split(";") if user["Location"] else [],
                    "preference": user["Preferences"].split(";") if user["Preferences"] else [],
                    "skills": user["Skills"].split(";") if user["Skills"] else [],
                    "secretAnswer": user["Secret Answer"],
                    "secretQuestion": user["Secret Question"],
                }

                # Initialize usersReward subcollection for volunteers
                usersReward_data = {
                    "userRewardId": '',            
                    "rewardCode": '',         
                    "title": '',              
                    "description": '',         
                    "expirationDate": '',      
                    "pointsRequired": 0,        
                    "image": ''                
                }

                doc_ref = db.collection("User").document(user_data["userId"])
                doc_ref.set(user_data)

                # Adding the usersReward subcollection if the role is volunteer
                usersReward_ref = doc_ref.collection('usersReward').document('usersReward')
                usersReward_ref.set(usersReward_data)

                print(f"Uploaded {user['User ID']} ({user['Role']}) successfully.")
            elif user["Role"] == "organization":
                user_data = {
                    "userId": user["User ID"],
                    "name": user["Name"],
                    "role": user["Role"],
                    "email": user["Email"],
                    "password": user["Password"],
                    "address": user["Address"],
                    "phoneNum": user["Phone Number"],
                    "icNum": user["IC Number"],
                    "birthDate": user["Birth Date"],
                    "image": user["Image"],
                    "status": user["Status"],
                    "autoReplyMsg": user["Auto Reply Message"],
                    "businessType": user["Business Type"],
                    "secretAnswer": user["Secret Answer"],
                    "secretQuestion": user["Secret Question"],
                }

                doc_ref = db.collection("User").document(user_data["userId"])
                doc_ref.set(user_data)
                print(f"Uploaded {user['User ID']} ({user['Role']}) successfully.")
            else:
                print(f"Unknown role for user ID {user['User ID']}. Skipping...")
                continue
        except Exception as e:
            print(f"Error uploading user {user['User ID']}: {e}")


# Upload Events to Firestore
def upload_events_to_firestore(file_path):
    events = read_csv(file_path)
    for event in events:
        try:
            category_ids = (
                event["Location"].split(";") + 
                event["Preferences"].split(";") +
                event["Skills Required"].split(";")
            )
            event_data = {
                "eventId": event["Event ID"],
                "title": event["Title"],
                "address": event["Address"],
                "description": event["Description"],
                "createdAt": datetime.fromisoformat(event["Created At"]),
                "startDate": datetime.fromisoformat(event["Start Date"]),
                "endDate": datetime.fromisoformat(event["End Date"]),
                "startTime": datetime.fromisoformat(event["Start Time"]),
                "endTime": datetime.fromisoformat(event["End Time"]),
                "capacity": int(event["Capacity"]),
                "location": event["Location"],
                "preferences": event["Preferences"].split(";") if event["Preferences"] else [],
                "skills": event["Skills Required"].split(";") if event["Skills Required"] else [],
                "categoryIds": category_ids,
                "status": event["Status"],
                "rating": float(event["Rating"]),
                "userId": event["User ID"],
                "latitude": float(event["Latitude"]),
                "longitude": float(event["Longitude"]),
            }

            doc_ref = db.collection("Event").document(event_data["eventId"])
            doc_ref.set(event_data)
            print(f"Uploaded {event['Event ID']} successfully.")
        except Exception as e:
            print(f"Error uploading event {event['Event ID']}: {e}")

# Upload User Interactions to Firestore
def upload_interactions_to_firestore(file_path):
    interactions = read_csv(file_path)
    for interaction in interactions:
        try:
            interaction_data = {
                "eventId": interaction["Event ID"],
                "userId": interaction["User ID"],
                "type": interaction["Type"],
                "timestamp": datetime.fromisoformat(interaction["Timestamp"]),
            }

            doc_ref = db.collection("Interactions").document()
            doc_ref.set(interaction_data)
            print(f"Uploaded interaction for event {interaction['Event ID']} and user {interaction['User ID']} successfully.")
        except Exception as e:
            print(f"Error uploading interaction for event {interaction['Event ID']} and user {interaction['User ID']}: {e}")

# Main script execution
if __name__ == "__main__":
    user_csv_file = "users.csv"
    event_csv_file = "events.csv"
    interaction_csv_file = "user_interactions.csv"

    upload_users_to_firestore(user_csv_file)
    upload_events_to_firestore(event_csv_file)


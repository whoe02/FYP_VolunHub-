import random
import csv
from faker import Faker

# Initialize Faker
faker = Faker()

# Define Locations, Preferences, and Skills
LOCATIONS = [
    "location_Alor Setar", "location_George Town", "location_Ipoh", "location_Johor Bahru", "location_Kota Kinabalu",
    "location_Kuala Lumpur", "location_Kuching", "location_Malacca", "location_Sandakan", "location_Shah Alam"
]

PREFERENCES = [
    "preference_Art", "preference_Community Service", "preference_Education", "preference_Environment", "preference_Health",
    "preference_Sports", "preference_Volunteer"
]

SKILLS = [
    "skills_Event Management", "skills_First Aid", "skills_Fundraising", "skills_Teaching", "skills_Communication",
    "skills_Cooking", "skills_Technical Support", "skills_Leadership", "skills_Marketing"
]

STATUSES = ["active"]
ROLES = ["volunteer", "organization"]

# Define interaction types with adjusted probabilities (weights)
INTERACTION_TYPES = ["view", "review", "watchlisted", "apply", "enquiry"]
INTERACTION_WEIGHTS = {
    "view": 0.6,        # 60% of interactions will be views (most common)
    "review": 0.1,      # 10% of interactions will be reviews (less common)
    "watchlisted": 0.15, # 15% of interactions will be watchlisted (indicates interest)
    "apply": 0.05,      # 5% of interactions will be applies (high commitment)
    "enquiry": 0.1      # 10% of interactions will be enquiries (moderate engagement)
}

# Normalize the weights to sum to 1
total_weight = sum(INTERACTION_WEIGHTS.values())
normalized_weights = {key: value / total_weight for key, value in INTERACTION_WEIGHTS.items()}

# Generate Random Event Data
def generate_events(num_events):
    events = []
    for i in range(num_events):
        event_id = f"EV{str(i+1).zfill(5)}"
        title = f"Event {event_id}"
        address = faker.address().replace("\n", " ")
        description = faker.paragraph(nb_sentences=5)
        created_at = faker.date_time_this_year()
        start_date = faker.date_time_between(start_date=created_at, end_date="+10d")
        end_date = faker.date_time_between(start_date=start_date, end_date="+5d")
        start_time = faker.date_time_between(start_date=created_at, end_date="+10d")
        end_time = faker.date_time_between(start_date=start_date, end_date="+5d")
        capacity = random.randint(10, 100)
        location = random.choice(LOCATIONS)
        preference = random.sample(PREFERENCES, random.randint(1, 2))
        skills_required = random.sample(SKILLS, random.randint(1, 3))
        status = random.choices(
            ["upcoming"], weights=[1.0]
        )[0]
        rating = round(random.uniform(1, 5), 1)
        user_id = f"OG{str(random.randint(1, num_events)).zfill(5)}"
        latitude = round(random.uniform(-90, 90), 6)  # Latitude between -90 and 90
        longitude = round(random.uniform(-180, 180), 6)  # Longitude between -180 and 180

        events.append({
            "Event ID": event_id,
            "Title": title,
            "Address": address,
            "Description": description,
            "Created At": created_at.isoformat(),
            "Start Date": start_date.isoformat(),
            "End Date": end_date.isoformat(),
            "Start Time": start_time.isoformat(),
            "End Time": end_time.isoformat(),
            "Capacity": capacity,
            "Location": location,
            "Latitude": latitude,
            "Longitude": longitude,
            "Preferences": ";".join(preference),
            "Skills Required": ";".join(skills_required),
            "Status": status,
            "Rating": rating,
            "User ID": user_id,
        })
    return events

# Generate Random User Data
def generate_users(num_users):
    users = []
    num_volunteers = int(num_users * 0.8)

    volunteer_counter = 1
    organization_counter = 1

    for i in range(num_users):
        if i < num_volunteers:
            # Generate a volunteer
            role = "volunteer"
            user_id = f"VL{str(volunteer_counter).zfill(5)}"
            volunteer_counter += 1
            preferences = random.sample(PREFERENCES, random.randint(1, 3))
            skills = random.sample(SKILLS, random.randint(1, 4))
            location = random.sample(LOCATIONS, random.randint(1, 3))
            auto_reply_msg = ""
            business_type = ""
        else:
            # Generate an organization
            role = "organization"
            user_id = f"OG{str(organization_counter).zfill(5)}"
            organization_counter += 1
            preferences = []
            skills = []
            location = []
            auto_reply_msg = faker.sentence(nb_words=10)
            business_type = faker.company()

        name = faker.name()
        address = faker.address().replace("\n", " ")
        birth_date = faker.date_of_birth(minimum_age=18, maximum_age=65).strftime("%Y-%m-%d")
        email = faker.email()
        ic_num = ''.join(random.choices("0123456789", k=12))
        phone_num = faker.phone_number()
        check_in_streak = random.randint(0, 6)
        reward_points = random.randint(0, 500)
        password = faker.password()
        image = "https://via.placeholder.com/150/0000FF"
        status = random.choice(STATUSES)
        last_check_in_date = faker.date_this_year().strftime("%Y-%m-%d")
        secret_question = faker.paragraph(nb_sentences=5)
        secret_answer = faker.paragraph(nb_sentences=2)

        users.append({
            "User ID": user_id,
            "Name": name,
            "Role": role,
            "Email": email,
            "Password": password,
            "Address": address,
            "Phone Number": phone_num,
            "IC Number": ic_num,
            "Birth Date": birth_date,
            "Image": image,
            "Status": status,
            "Check In Streak": check_in_streak,
            "Reward Points": reward_points,
            "Last Check-In Date": last_check_in_date,
            "Preferences": ";".join(preferences),
            "Skills": ";".join(skills),
            "Location": ";".join(location),
            "Auto Reply Message": auto_reply_msg,
            "Business Type": business_type,
            "Secret Answer": secret_answer,
            "Secret Question": secret_question
        })

    return users

# Generate User Interaction Data with adjusted distribution
def generate_user_interactions(users, events, num_interactions):
    # Filter users to include only volunteers
    volunteers = [user for user in users if user["Role"] == "volunteer"]

    interactions = []
    for _ in range(num_interactions):
        user = random.choice(volunteers)  # Only select volunteers
        event = random.choice(events)
        interaction_type = random.choices(INTERACTION_TYPES, weights=[normalized_weights[it] for it in INTERACTION_TYPES])[0]
        timestamp = faker.date_time_this_year().isoformat()

        interactions.append({
            "Event ID": event["Event ID"],
            "User ID": user["User ID"],
            "Type": interaction_type,
            "Timestamp": timestamp
        })

    return interactions


# Save Data to CSV
def save_to_csv(file_name, fieldnames, data):
    with open(file_name, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

# Main Function
def main():
    # Parameters
    num_events = 10
    num_users = 100
    num_interactions = 500

    # Generate Data
    events = generate_events(num_events)
    users = generate_users(num_users)
    interactions = generate_user_interactions(users, events, num_interactions)

    # Save to CSV
    save_to_csv(
        "users.csv",
        [
            "User ID", "Name", "Role", "Email", "Password", "Address", "Phone Number", "IC Number", "Birth Date", "Image",
            "Status", "Check In Streak", "Reward Points", "Last Check-In Date", "Preferences", "Skills", "Location",
            "Auto Reply Message", "Business Type", "Secret Answer", "Secret Question" 
        ],
        users,
    )
    save_to_csv(
        "events.csv",
        [
            "Event ID", "Title", "Address", "Description", "Created At", "Start Date", "End Date", "Start Time", "End Time",
            "Capacity", "Preferences", "Skills Required", "Location", "Latitude", "Longitude", "Category IDs", "Status", "Rating", "User ID"
        ],
        events,
    )
    save_to_csv("user_interactions.csv", ["Event ID", "User ID", "Type", "Timestamp"], interactions)

    print("Data generated and saved to CSV files!")

if __name__ == "__main__":
    main()

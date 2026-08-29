# generate_dummy.py
# Generates a dummy directory CSV file with 10,000 rows for local performance testing.

import csv
import random

# List of dummy names to randomly select from
first_names = ["John", "Jane", "Anoush", "Teju", "Michael", "Sarah", "David", "Emma", "Robert", "Emily", "James", "Olivia", "Daniel", "Sophia", "William", "Isabella", "Richard", "Mia", "Joseph", "Charlotte"]
last_names = ["Smith", "Doe", "Johnson", "Brown", "Taylor", "Miller", "Wilson", "Davis", "Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Moore", "Martin", "Jackson"]
cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "London", "Toronto", "Sydney", "Mumbai", "Tokyo", "Berlin", "Paris"]
countries = ["USA", "Canada", "Australia", "UK", "India", "Germany", "France", "Japan"]

def generate_phone():
    # Generates a random 10-digit phone number format
    return f"{random.randint(600, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"

def main():
    filename = "dummy_directory.csv"
    print(f"Generating 10,000 records into {filename}...")
    
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        # Header Row
        writer.writerow(["ID", "Full Name", "Email", "Mobile Phone", "City", "Country", "Notes"])
        
        # Insert a specific known test case at the start (Record 1)
        writer.writerow([
            "10001",
            "Anoush Sharma",
            "anoush.sharma@example.local",
            "98765-43210", # Known phone format
            "Mumbai",
            "India",
            "Urgent contact for priority projects. Prefers text messages."
        ])

        # Insert a second specific known test case (Record 2)
        writer.writerow([
            "10002",
            "Teju Patel",
            "teju.patel@example.local",
            "+91 99887 76655", # Alternate phone format with country code
            "Ahmedabad",
            "India",
            "Key engineering manager. Works timezone UTC+5.5."
        ])

        # Generate remaining 9,998 random rows
        for i in range(10003, 20001):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            fullname = f"{fname} {lname}"
            email = f"{fname.lower()}.{lname.lower()}{random.randint(1, 99)}@example.local"
            phone = generate_phone()
            city = random.choice(cities)
            country = random.choice(countries)
            notes = f"Random generated profile for testing search speeds of client-side web workers. Record #{i}."
            
            writer.writerow([str(i), fullname, email, phone, city, country, notes])
            
    print(f"Successfully generated {filename}!")

if __name__ == "__main__":
    main()

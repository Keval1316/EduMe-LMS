import pandas as pd
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv()

# Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "edume")
COLLECTION_NAME = "recommended_courses"
CSV_FILE_PATH = "../udemy_courses.csv"  # Path relative to the script location


def load_data_to_mongodb():
    """
    Reads course data from a CSV file and loads it into a MongoDB collection.
    """
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        # Drop the collection if it already exists to avoid duplicates on re-runs
        if COLLECTION_NAME in db.list_collection_names():
            print(f"Collection '{COLLECTION_NAME}' already exists. Dropping it.")
            collection.drop()
            print("Collection dropped.")

        # Read the CSV file
        print(f"Reading data from {CSV_FILE_PATH}...")
        df = pd.read_csv(CSV_FILE_PATH)

        # Convert dataframe to a list of dictionaries (JSON records)
        records = json.loads(df.to_json(orient='records'))

        # Insert data into the collection
        print(f"Inserting {len(records)} records into '{COLLECTION_NAME}' collection...")
        collection.insert_many(records)

        print("Data loaded successfully to MongoDB!")
        print(f"Total documents in collection: {collection.count_documents({})})")

    except FileNotFoundError:
        print(f"Error: The file {CSV_FILE_PATH} was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'client' in locals() and client:
            client.close()

if __name__ == "__main__":
    load_data_to_mongodb()

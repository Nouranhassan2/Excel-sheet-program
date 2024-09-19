const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin SDK
const serviceAccount = require("./excel-sheet-737fa-firebase-adminsdk-doyit-1dac89e498.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load the JSON data from the file
const jsonData = require('./converted_companies_employees_corrected (1).json');

// Function to import data into Firestore
async function importData() {
  try {
    for (const [companyName, employees] of Object.entries(jsonData)) {
      // Create a new document in the 'companies' collection
      const companyRef = db.collection('companies').doc(); // Generates a new company document reference

      // Set the company document data
      await companyRef.set({
        "اسم الشركة": companyName
      });

      // Loop through the employees and add each to the sub-collection
      for (const employee of employees) {
        const employeeRef = companyRef.collection('employees').doc(); // New employee document reference
        await employeeRef.set({
          "اسم الموظف": employee["اسم الموظف"], // Store the employee name
          "المسمى الوظيفي": employee["المسمى الوظيفي"] // Store the job title
        });
      }

      console.log(`Data imported for company: ${companyName}`);
    }

    console.log('All data successfully imported!');
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

// Run the import function
importData();

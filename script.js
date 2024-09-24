// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBMzWcjvTStYVHy-BxN2hpMTSQxCBN3nXk",
    authDomain: "excel-sheet-737fa.firebaseapp.com",
    projectId: "excel-sheet-737fa",
    storageBucket: "excel-sheet-737fa.appspot.com",
    messagingSenderId: "202807179886",
    appId: "1:202807179886:web:a3b4c83de711fc4648847f",
    measurementId: "G-YG34XVCJ3X"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Initialize Firestore
  const db = firebase.firestore();
  // companies name 
  // Function to handle tab switching
  function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
  }
  
// Function to load table data from Firestore

  // Function to add a new row to Firestore
// Function to add a new row to Firestore and the internal task table
// Function to add a new row to Firestore and display it in the clientTaskTable
// Function to add a new row to Firestore
function addRow(tableId) {
  const formId = tableId === 'internalTaskTable' ? 'internalTaskForm' : 'clientTaskForm';
  const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';

  const form = document.getElementById(formId);
  
  // جمع البيانات من النموذج
  const newRowData = Array.from(form.elements).reduce((data, element) => {
      if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
          data[element.id] = element.type === 'checkbox' ? element.checked : element.value;
      }
      return data;
  }, {});

  // **حذف الحقول غير المستخدمة مثل `رقم المهمة الحالية`**
  delete newRowData['رقم_المهمة_الحالية'];
  delete newRowData['رقم_المهمة_القادمة'];

  // Add data to Firestore
  db.collection(collectionName).add(newRowData)
    .then(() => {
        console.log("Document successfully written!");
        loadTableData(tableId, collectionName);
        form.reset();
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
    });
}






// Function to add data to the clientTaskTable dynamically
function addDataToTable(tableId, rowData) {
  const tableBody = document.getElementById(`${tableId}Body`);
  const row = document.createElement("tr");

  // Define the ordered keys for both internal and client tables
  const orderedKeys = tableId === 'internalTaskTable'
    ? ['employeeFilter', 'jobTitleFilter', 'مرحلة_التدريب', 'تاريخ_المهمة', 'رقم_المهمة_الحالية', 'رقم_المهمة_القادمة', 'اسم_المهمة', 'مرفق_المهمة', 'رابط_المرفق', 'اسناد_المهمة', 'ملاحظات_الاسناد']
    : ['employeeFilterClient', 'jobTitleFilterClient', 'مرحلة_التدريب_عميل', 'تاريخ_المهمة_عميل', 'اسم_المهمة_عميل', 'حالة_المهمة_عميل', 'التفاعل_عميل', 'ملاحظات_المهام_عميل'];

  // Loop through ordered keys and generate table cells for each column
  orderedKeys.forEach(key => {
    const cell = document.createElement("td");
    if (key === 'رابط_المرفق') {
      const link = document.createElement("a");
      link.href = rowData[key] || "#";
      link.textContent = "رابط";
      link.target = "_blank";
      cell.appendChild(link);
    } else if (typeof rowData[key] === 'boolean') {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = rowData[key];
      checkbox.disabled = true;
      cell.appendChild(checkbox);
    } else {
      cell.textContent = rowData[key] || "";
    }
    row.appendChild(cell);
  });

  // Add the actions cell with the buttons after all other cells
  const actionsCell = document.createElement("td");

  // Create and append the Edit button
  const editButton = document.createElement("button");
  editButton.textContent = "تعديل";
  editButton.onclick = () => editRow(rowData.id, tableId);
  actionsCell.appendChild(editButton);

  // Create and append the Delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "حذف";

  // Determine the correct collection name dynamically
  const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';

  // Attach delete function to the delete button
  deleteButton.onclick = () => deleteRow(rowData.id, tableId, collectionName);
  actionsCell.appendChild(deleteButton);

  // Append the actions cell as the last column (under "الإجراءات")
  row.appendChild(actionsCell);

  // Append the row to the table body
  tableBody.appendChild(row);
}









// Load the company names and employee/job title data for ClientSheet
document.addEventListener("DOMContentLoaded", function() {
  loadCompanyNames();
  loadCompanyNamesClient(); // Ensure the ClientSheet gets populated with companies

  loadTableData('clientTaskTable', 'clientTasks'); // Ensure data loads for client tasks
});



  // Load data from Firestore when the page loads
  document.addEventListener("DOMContentLoaded", function() {
    loadTableData('internalTaskTable', 'internalTasks');
    loadTableData('clientTaskTable', 'clientTasks');
  
    // Open the first tab by default
    document.getElementsByClassName("tablinks")[0].click();
  });
  
  // Function to export table data to CSV
  function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tr');
    let csvContent = "\uFEFF"; // Adding BOM for UTF-8 encoding
  
    // Iterate over each row in the table
    rows.forEach((row) => {
      const cells = row.querySelectorAll('th, td');
      const rowData = [];
  
      // Iterate over each cell in the row
      cells.forEach((cell) => {
        let cellContent = cell.innerText.replace(/"/g, '""'); // Escape double quotes
        rowData.push(`"${cellContent}"`); // Wrap cell content in quotes
      });
  
      csvContent += rowData.join(",") + "\n"; // Join cells with commas and add a newline
    });
  
    // Create a blob from the CSV content and trigger a download
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = csvUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // Function to filter tasks by month
// Function to filter internal tasks by month
function filterByInternalMonth() {
  const selectedMonth = document.getElementById("monthFilterInternal").value;
  const collectionName = 'internalTasks';

  if (!selectedMonth) {
    // إذا لم يتم اختيار شهر، قم بتحميل جميع البيانات
    loadTableData('internalTaskTable', collectionName);
    return;
  }

  const tableBody = document.getElementById('internalTaskTableBody');
  tableBody.innerHTML = ""; // مسح الجدول قبل إضافة البيانات المُفلترة

  // جلب البيانات من Firestore وتصفية حسب الشهر
  db.collection(collectionName).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const task = doc.data();
      const taskDate = new Date(task['تاريخ_المهمة']); // تعديل لحقل تاريخ المهمة

      // استخراج الشهر بصيغة رقمية ثنائية (01، 02، إلخ)
      const taskMonth = ("0" + (taskDate.getMonth() + 1)).slice(-2);

      if (taskMonth === selectedMonth) {
        const row = document.createElement("tr");

        // قائمة المفاتيح المرتبة لتناسب أعمدة الجدول
        const orderedKeys = ['اسم_الموظف', 'المسمى_الوظيفي', 'مرحلة_التدريب', 'تاريخ_المهمة', 'رقم_المهمة', 'اسم_المهمة', 'مرفق_المهمة', 'رابط_المرفق', 'اسناد_المهمة', 'ملاحظات_الاسناد'];

        // إضافة خلايا البيانات بترتيب الأعمدة
        orderedKeys.forEach(key => {
          const cell = document.createElement("td");
          if (key === 'رابط_المرفق') {
            const link = document.createElement("a");
            link.href = task[key] || "#";
            link.textContent = "رابط";
            link.target = "_blank";
            cell.appendChild(link);
          } else if (typeof task[key] === 'boolean') {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task[key];
            checkbox.disabled = true;
            cell.appendChild(checkbox);
          } else {
            cell.textContent = task[key] || "";
          }
          row.appendChild(cell);
        });

        // إضافة أزرار الإجراءات (تعديل، حذف)
        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.textContent = "تعديل";
        editButton.onclick = () => editRow(doc.id, 'internalTaskTable');

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "حذف";
        deleteButton.onclick = () => deleteRow(doc.id, 'internalTaskTable', collectionName);

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        tableBody.appendChild(row); // إضافة الصف إلى الجدول
      }
    });
  }).catch((error) => {
    console.error("Error filtering internal tasks by month from Firestore: ", error);
  });
}


// Function to filter client tasks by month
function filterByClientMonth() {
  const selectedMonth = document.getElementById("monthFilterClient").value;
  const collectionName = 'clientTasks';

  if (!selectedMonth) {
    // If no month is selected, load all data
    loadTableData('clientTaskTable', collectionName);
    return;
  }

  const tableBody = document.getElementById('clientTaskTableBody');
  tableBody.innerHTML = ""; // Clear the table before adding filtered data

  // Fetch data from Firestore and filter by month
  db.collection(collectionName).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const task = doc.data();
      const taskDate = new Date(task['تاريخ_المهمة_عميل']); // Adjust to the client task date field

      // Extract month in two digits (01, 02, etc.)
      const taskMonth = ("0" + (taskDate.getMonth() + 1)).slice(-2);

      if (taskMonth === selectedMonth) {
        const row = document.createElement("tr");

        // Define the ordered list of keys to match table columns
        const orderedKeys = ['اسم_الموظف_عميل', 'المسمي_الوظيفي_عميل', 'مرحلة_التدريب_عميل', 'تاريخ_المهمة_عميل', 'اسم_المهمة_عميل', 'حالة_المهمة_عميل', 'التفاعل_عميل', 'ملاحظات_المهام_عميل'];

        // Create table cells in the correct order
        orderedKeys.forEach(key => {
          const cell = document.createElement("td");
          if (key.includes('رابط')) {
            const link = document.createElement("a");
            link.href = task[key] || "#";
            link.textContent = "رابط";
            link.target = "_blank";
            cell.appendChild(link);
          } else if (typeof task[key] === 'boolean') {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task[key];
            checkbox.disabled = true; // Make the checkbox read-only
            cell.appendChild(checkbox);
          } else {
            cell.textContent = task[key] || ""; // Set empty string if key is missing
          }
          row.appendChild(cell);
        });

        tableBody.appendChild(row);
      }
    });
  }).catch((error) => {
    console.error("Error filtering client tasks by month from Firestore: ", error);
  });
}

  // delete row
  function loadTableData(tableId, collectionName) {
    const tableBody = document.getElementById(tableId + 'Body');
    tableBody.innerHTML = ""; // Clear the table to avoid duplication
  
    db.collection(collectionName).get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        task.id = doc.id; // Add the document ID to the task data
        
        addDataToTable(tableId, task); // Insert data into the table
      });
    }).catch((error) => {
      console.error("Error loading data from Firestore: ", error);
    });
  }
  

  
// edit row
// Function to delete a row from Firestore
// Function to delete a row from Firestore and remove it from the table
function deleteRow(docId, tableId, collectionName) {
  // Log the document ID and collection name for debugging
  console.log("Attempting to delete document with ID:", );
  console.log("From collection:", collectionName);

  if (confirm("هل أنت متأكد من أنك تريد حذف هذا السجل؟")) {
    // Attempt to delete the document from Firestore
    db.collection(collectionName).doc(docId).delete()
      .then(() => {
        console.log("Document successfully deleted!");

        // Reload table data after successful deletion
        loadTableData(tableId, collectionName); // This will refresh the table
      })
      .catch((error) => {
        console.error("Error deleting document: ", error);
      });
  }
}




// Function to edit a row
// Function to edit a row in Firestore
// Function to edit a row in Firestore
function editRow(docId, tableId) {
  const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';
  const formId = tableId === 'internalTaskTable' ? 'internalTaskForm' : 'clientTaskForm';
  const form = document.getElementById(formId);

  // Load the document data from Firestore into the form
  db.collection(collectionName).doc(docId).get().then((doc) => {
      if (doc.exists) {
          const data = doc.data();
          Object.keys(data).forEach(key => {
              const formElement = form.querySelector(`#${key}`);
              if (formElement) {
                  if (formElement.type === 'checkbox') {
                      formElement.checked = data[key];
                  } else {
                      formElement.value = data[key];
                  }
              }
          });

          // Change the add button to a save button to update the row
          const addButton = form.querySelector("button[onclick^='addRow']");
          addButton.textContent = "حفظ التغييرات";
          addButton.onclick = () => saveChanges(docId, tableId);
      } else {
          console.error("No such document!");
      }
  }).catch((error) => {
      console.error("Error getting document:", error);
  });
}

// Function to save changes after editing a row
function saveChanges(docId, tableId) {
  const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';
  const formId = tableId === 'internalTaskTable' ? 'internalTaskForm' : 'clientTaskForm';
  const form = document.getElementById(formId);

  // Gather updated data from the form
  const updatedData = Array.from(form.elements).reduce((data, element) => {
      if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
          data[element.id] = element.type === 'checkbox' ? element.checked : element.value;
      }
      return data;
  }, {});

  // Update the document in Firestore
  db.collection(collectionName).doc(docId).update(updatedData).then(() => {
      console.log("Document successfully updated!");
      loadTableData(tableId, collectionName); // Reload table data
      form.reset(); // Clear the form

      // Revert the button text back to "إضافة مهمة جديدة"
      const addButton = form.querySelector("button[onclick^='saveChanges']");
      addButton.textContent = "إضافة مهمة جديدة";
      addButton.onclick = () => addRow(tableId);
  }).catch((error) => {
      console.error("Error updating document: ", error);
  });
}


// 
// Function to add a company and its employees (only storing names)
function addCompanyWithEmployees(companyName, employees) {
  // Create a new document in the 'companies' collection
  const companyRef = db.collection('companies').doc(); // Generates a new company document reference
  const companyId = companyRef.id; // Get the generated ID for the company

  // Set the company document data with "اسم الشركة"
  companyRef.set({
    "اسم الشركة": companyName // Store the company name as "اسم الشركة"
  }).then(() => {
    console.log("Company added: ", companyName);

    // Loop through the employees and add each to the sub-collection
    employees.forEach(employee => {
      const employeeRef = companyRef.collection('employees').doc(); // New employee document reference
      employeeRef.set({
        "اسم الشركة": companyName, // Store the company name for each employee
        "اسم الموظف": employee.name, // Store the employee name as "اسم الموظف"
        "المسمى الوظيفي": employee.jobTitle // Store the job title as "المسمى الوظيفي"
      }).then(() => {
        console.log("Employee added: ", employee.name);
      }).catch(error => {
        console.error("Error adding employee: ", error);
      });
    });
  }).catch(error => {
    console.error("Error adding company: ", error);
  });
}


// Load all company names and add them to the dropdown
function loadCompanyNames() {
  const companyFilter = document.getElementById("companyFilter");

  // Clear existing options
  companyFilter.innerHTML = '<option value="">اختر الشركة</option>';

  db.collection('companies').get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const companyName = doc.data()["اسم الشركة"];
      const option = document.createElement('option');
      option.value = doc.id; // Use the company document ID as the value
      option.textContent = companyName;
      companyFilter.appendChild(option);
    });
  }).catch((error) => {
    console.error("Error loading companies: ", error);
  });
}

// Function to populate employee and job title dropdowns based on selected company
function filterData() {
  const companyId = document.getElementById("companyFilter").value;
  const employeeFilter = document.getElementById("employeeFilter");
  const jobTitleFilter = document.getElementById("jobTitleFilter");

  // Clear previous employee and job title options
  employeeFilter.innerHTML = '<option value="">اختر الموظف</option>';
  jobTitleFilter.innerHTML = '<option value="">اختر المسمى الوظيفي</option>';

  if (!companyId) {
    return; // If no company is selected, exit the function
  }

  // Fetch employees for the selected company
  db.collection('companies').doc(companyId).collection('employees').get().then((querySnapshot) => {
    const jobTitles = new Set(); // Use a set to store unique job titles

    querySnapshot.forEach((doc) => {
      const employeeData = doc.data();
      const employeeName = employeeData["اسم الموظف"];
      const jobTitle = employeeData["المسمى الوظيفي"];

      // Populate employee dropdown
      const employeeOption = document.createElement('option');
      employeeOption.value = employeeName;
      employeeOption.textContent = employeeName;
      employeeFilter.appendChild(employeeOption);

      // Add the job title to the set
      jobTitles.add(jobTitle);
    });

    // Populate job title dropdown
    jobTitles.forEach((title) => {
      const jobTitleOption = document.createElement('option');
      jobTitleOption.value = title;
      jobTitleOption.textContent = title;
      jobTitleFilter.appendChild(jobTitleOption);
    });
  }).catch((error) => {
    console.error("Error loading employees: ", error);
  });
}
// 
// Load company names for ClientSheet
function loadCompanyNamesClient() {
  const companyFilterClient = document.getElementById("companyFilterClient");

  // Clear existing options
  companyFilterClient.innerHTML = '<option value="">اختر الشركة</option>';

  db.collection('companies').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
          const companyName = doc.data()["اسم الشركة"];
          const option = document.createElement('option');
          option.value = doc.id; // Use the company document ID as the value
          option.textContent = companyName;
          companyFilterClient.appendChild(option);
      });
  }).catch((error) => {
      console.error("Error loading companies: ", error);
  });
}

// Function to filter employees and job titles in ClientSheet
function filterDataClient() {
  const companyId = document.getElementById("companyFilterClient").value;
  const employeeFilterClient = document.getElementById("employeeFilterClient");
  const jobTitleFilterClient = document.getElementById("jobTitleFilterClient");

  // Clear previous employee and job title options
  employeeFilterClient.innerHTML = '<option value="">اختر الموظف</option>';
  jobTitleFilterClient.innerHTML = '<option value="">اختر المسمى الوظيفي</option>';

  if (!companyId) {
      return; // If no company is selected, exit the function
  }

  // Fetch employees for the selected company
  db.collection('companies').doc(companyId).collection('employees').get().then((querySnapshot) => {
      const jobTitles = new Set(); // Use a set to store unique job titles

      querySnapshot.forEach((doc) => {
          const employeeData = doc.data();
          const employeeName = employeeData["اسم الموظف"];
          const jobTitle = employeeData["المسمى الوظيفي"];

          // Populate employee dropdown
          const employeeOption = document.createElement('option');
          employeeOption.value = employeeName;
          employeeOption.textContent = employeeName;
          employeeFilterClient.appendChild(employeeOption);

          // Add the job title to the set
          jobTitles.add(jobTitle);
      });

      // Populate job title dropdown
      jobTitles.forEach((title) => {
          const jobTitleOption = document.createElement('option');
          jobTitleOption.value = title;
          jobTitleOption.textContent = title;
          jobTitleFilterClient.appendChild(jobTitleOption);
      });
  }).catch((error) => {
      console.error("Error loading employees: ", error);
  });
}

// Call the function to load company names when the page loads
document.addEventListener("DOMContentLoaded", function() {
  loadCompanyNames();
  loadCompanyNamesClient(); // For ClientSheet
});
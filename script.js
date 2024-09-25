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

function addRow(tableId) {
  const formId = tableId === 'internalTaskTable' ? 'internalTaskForm' : 'clientTaskForm';
  const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';

  const form = document.getElementById(formId);
  const employeeFilter = tableId === 'internalTaskTable' ? document.getElementById("employeeFilter") : document.getElementById("employeeFilterClient");

  // Collect data from the form
  const newRowData = Array.from(form.elements).reduce((data, element) => {
    if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
      data[element.id] = element.type === 'checkbox' ? element.checked : element.value;
    }
    return data;
  }, {});

  // Store the selected employee's Document ID
  if (employeeFilter.selectedIndex > 0) {
    newRowData["employeeFilter"] = employeeFilter.value; // Use Document ID for internal tasks
  } else {
    newRowData["employeeFilter"] = ""; // Empty string if no employee is selected
  }

  // Add data to Firestore
  db.collection(collectionName).add(newRowData)
    .then(() => {
      console.log("Document successfully written!");
      loadTableData(tableId, collectionName);  // Reload the table data
      form.reset();  // Reset the form
    })
    .catch((error) => {
      console.error("Error writing document: ", error);
    });
}
  
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

function filterByInternalMonth() {
  const selectedMonth = document.getElementById("monthFilterInternal").value;
  const collectionName = 'internalTasks';

  if (!selectedMonth) {
    // Load all data if no month is selected
    loadTableData('internalTaskTable', collectionName);
    return;
  }

  const tableBody = document.getElementById('internalTaskTableBody');
  tableBody.innerHTML = ""; // Clear the table before adding filtered data

  // Fetch data from Firestore and filter by month
  db.collection(collectionName).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const task = doc.data();
      console.log("Fetched task:", task); // DEBUG: Log the fetched task data

      const taskDate = new Date(task['تاريخ_المهمة']);
      const taskMonth = ("0" + (taskDate.getMonth() + 1)).slice(-2); // Extract month in two digits

      if (taskMonth === selectedMonth) {
        // Fetch the employee name from Firestore using the employeeFilter document ID
        if (task['employeeFilter'] && task['employeeFilter'].length === 20) {
          db.collection('companies').doc(task['companyFilter']).collection('employees').doc(task['employeeFilter']).get()
            .then((employeeDoc) => {
              if (employeeDoc.exists) {
                console.log(`Employee data for ID ${task['employeeFilter']}:`, employeeDoc.data());
                task['employeeFilter'] = employeeDoc.data()['اسم الموظف']; // Replace document ID with employee's name
              } else {
                console.warn(`Employee not found for ID: ${task['employeeFilter']}`);
                task['employeeFilter'] = 'اسم غير موجود'; // Handle case where employee doesn't exist
              }
              addFilteredTaskToTable(task); // Insert data into the table
            })
            .catch((error) => {
              console.error("Error fetching employee data:", error);
              task['employeeFilter'] = 'خطأ في تحميل الاسم'; // Handle fetch error
              addFilteredTaskToTable(task); // Insert data into the table even if there's an error fetching the employee name
            });
        } else {
          addFilteredTaskToTable(task); // Insert data into the table directly if there's no employeeFilter
        }
      }
    });
  }).catch((error) => {
    console.error("Error filtering internal tasks by month from Firestore: ", error);
  });
}

function addFilteredTaskToTable(task) {
  const tableBody = document.getElementById('internalTaskTableBody');
  const row = document.createElement("tr");

  // Define the ordered keys for internal task table
  const orderedKeys = ['employeeFilter', 'jobTitleFilter', 'مرحلة_التدريب', 'تاريخ_المهمة', 'رقم_المهمة_الحالية', 'رقم_المهمة_القادمة', 'اسم_المهمة', 'مرفق_المهمة', 'رابط_المرفق', 'اسناد_المهمة'];

  // Loop through ordered keys and generate table cells for each column
  orderedKeys.forEach(key => {
    const cell = document.createElement("td");

    // Handle employee name for internal task table
    if (key === 'employeeFilter') {
      const employeeName = task[key] || 'اسم غير موجود';
      cell.textContent = employeeName;
    } else if (key === 'رابط_المرفق') {
      // Create a clickable link for 'رابط_المرفق'
      const link = document.createElement("a");
      link.href = task[key] || "#";
      link.textContent = "رابط";
      link.target = "_blank";
      cell.appendChild(link);
    } else if (typeof task[key] === 'boolean') {
      // Create a checkbox for boolean fields
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task[key];
      checkbox.disabled = true;
      cell.appendChild(checkbox);
    } else {
      // Default case: plain text content for other columns
      cell.textContent = task[key] || "";
    }

    row.appendChild(cell);
  });

  // Add the actions cell with the buttons after all other cells
  const actionsCell = document.createElement("td");

  // Create and append the Edit button
  const editButton = document.createElement("button");
  editButton.textContent = "تعديل";
  editButton.onclick = () => editRow(task.id, 'internalTaskTable');
  actionsCell.appendChild(editButton);

  // Create and append the Delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "حذف";

  // Attach delete function to the delete button
  deleteButton.onclick = () => deleteRow(task.id, 'internalTaskTable', 'internalTasks');
  actionsCell.appendChild(deleteButton);

  // Append the actions cell as the last column (under "الإجراءات")
  row.appendChild(actionsCell);

  // Append the row to the table body
  tableBody.appendChild(row);
}

// function filterByClientMonth() {
//   const selectedMonth = document.getElementById("monthFilterClient").value;
//   const collectionName = 'clientTasks';

//   if (!selectedMonth) {
//     // Load all data if no month is selected
//     loadTableData('clientTaskTable', collectionName);
//     return;
//   }

//   const tableBody = document.getElementById('clientTaskTableBody');
//   tableBody.innerHTML = ""; // Clear the table before adding filtered data

//   // Fetch data from Firestore and filter by month
//   db.collection(collectionName).get().then((querySnapshot) => {
//     querySnapshot.forEach((doc) => {
//       const task = doc.data();
//       console.log("Fetched client task:", task); // DEBUG: Log the fetched client task data

//       const taskDate = new Date(task['تاريخ_المهمة_عميل']);
//       const taskMonth = ("0" + (taskDate.getMonth() + 1)).slice(-2); // Extract month in two digits

//       if (taskMonth === selectedMonth) {
//         // Fetch the employee name from Firestore using the employeeFilterClient document ID
//         if (task['employeeFilterClient'] && task['employeeFilterClient'].length === 20) {
//           db.collection('companies').doc(task['companyFilterClient']).collection('employees').doc(task['employeeFilterClient']).get()
//             .then((employeeDoc) => {
//               if (employeeDoc.exists) {
//                 console.log(`Employee data for ID ${task['employeeFilterClient']}:`, employeeDoc.data());
//                 task['employeeFilterClient'] = employeeDoc.data()['اسم الموظف']; // Replace document ID with employee's name
//               } else {
//                 console.warn(`Employee not found for ID: ${task['employeeFilterClient']}`);
//                 task['employeeFilterClient'] = 'اسم غير موجود'; // Handle case where employee doesn't exist
//               }
//               addFilteredClientTaskToTable(task); // Insert data into the table
//             })
//             .catch((error) => {
//               console.error("Error fetching employee data:", error);
//               task['employeeFilterClient'] = 'خطأ في تحميل الاسم'; // Handle fetch error
//               addFilteredClientTaskToTable(task); // Insert data into the table even if there's an error fetching the employee name
//             });
//         } else {
//           addFilteredClientTaskToTable(task); // Insert data into the table directly if there's no employeeFilterClient
//         }
//       }
//     });
//   }).catch((error) => {
//     console.error("Error filtering client tasks by month from Firestore: ", error);
//   });
// }


function filterByClientMonth() {
  const selectedMonth = document.getElementById("monthFilterClient").value;
  const collectionName = 'clientTasks';

  if (!selectedMonth) {
    // Load all data if no month is selected
    loadTableData('clientTaskTable', collectionName);
    return;
  }

  const tableBody = document.getElementById('clientTaskTableBody');
  tableBody.innerHTML = ""; // Clear the table before adding filtered data

  // Fetch data from Firestore and filter by month
  db.collection(collectionName).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const task = doc.data();
      task.id = doc.id; // Ensure the document ID is saved in the task object

      const taskDate = new Date(task['تاريخ_المهمة_عميل']);
      const taskMonth = ("0" + (taskDate.getMonth() + 1)).slice(-2); // Extract month in two digits

      if (taskMonth === selectedMonth) {
        // Fetch the employee name from Firestore using the employeeFilterClient document ID
        if (task['employeeFilterClient'] && task['employeeFilterClient'].length === 20) {
          db.collection('companies').doc(task['companyFilterClient']).collection('employees').doc(task['employeeFilterClient']).get()
            .then((employeeDoc) => {
              if (employeeDoc.exists) {
                task['employeeFilterClient'] = employeeDoc.data()['اسم الموظف']; // Replace document ID with employee's name
              } else {
                task['employeeFilterClient'] = 'اسم غير موجود'; // Handle case where employee doesn't exist
              }
              addFilteredClientTaskToTable(task); // Insert data into the table
            })
            .catch((error) => {
              task['employeeFilterClient'] = 'خطأ في تحميل الاسم'; // Handle fetch error
              addFilteredClientTaskToTable(task); // Insert data into the table even if there's an error fetching the employee name
            });
        } else {
          addFilteredClientTaskToTable(task); // Insert data into the table directly if there's no employeeFilterClient
        }
      }
    });
  }).catch((error) => {
    console.error("Error filtering client tasks by month from Firestore: ", error);
  });
}


function addFilteredClientTaskToTable(task) {
  const tableBody = document.getElementById('clientTaskTableBody');
  const row = document.createElement("tr");

  // Define the ordered keys for client task table
  const orderedKeys = ['employeeFilterClient', 'jobTitleFilterClient', 'مرحلة_التدريب_عميل', 'تاريخ_المهمة_عميل', 'اسم_المهمة_عميل', 'حالة_المهمة_عميل', 'التفاعل_عميل', 'ملاحظات_المهام_عميل'];

  // Loop through ordered keys and generate table cells for each column
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

  // Add the actions cell with the buttons after all other cells
  const actionsCell = document.createElement("td");

  const editButton = document.createElement("button");
  editButton.textContent = "تعديل";
  editButton.onclick = () => editRow(task.id, 'clientTaskTable');
  actionsCell.appendChild(editButton);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "حذف";
  deleteButton.onclick = () => deleteRow(task.id, 'clientTaskTable', 'clientTasks');
  actionsCell.appendChild(deleteButton);

  row.appendChild(actionsCell);

  // Append the row to the table body
  tableBody.appendChild(row);
}

function loadTableData(tableId, collectionName) {
  const tableBody = document.getElementById(tableId + 'Body');
  tableBody.innerHTML = ""; // Clear the table to avoid duplication

  // Log the collection name being queried
  console.log(`Fetching data from collection: ${collectionName}`);

  db.collection(collectionName).get().then((querySnapshot) => {
      // Log the size of the result set
      console.log("Number of documents retrieved:", querySnapshot.size);

      if (querySnapshot.empty) {
          console.warn("No documents found in the collection.");
      }

      querySnapshot.forEach((doc) => {
          const task = doc.data();
          task.id = doc.id; // Add the document ID to the task data
          console.log(`Document ID: ${doc.id}`, task); // Log document ID and data

          // Fetch employee name for internal tasks
          if (tableId === 'internalTaskTable' && task['employeeFilter'] && task['employeeFilter'].length === 20) {
              console.log(`Fetching employee data for Internal Task. Employee ID: ${task['employeeFilter']}, Company ID: ${task['companyFilter']}`);

              // Fetch the employee name from Firestore
              db.collection('companies').doc(task['companyFilter']).collection('employees').doc(task['employeeFilter']).get()
                  .then((employeeDoc) => {
                      if (employeeDoc.exists) {
                          console.log(`Employee data for ID ${task['employeeFilter']}:`, employeeDoc.data());
                          task['employeeFilter'] = employeeDoc.data()['اسم الموظف']; // Replace document ID with the employee's name
                      } else {
                          console.warn(`Employee not found for ID: ${task['employeeFilter']}`);
                          task['employeeFilter'] = 'اسم غير موجود'; // Handle case where employee doesn't exist
                      }
                      addDataToTable(tableId, task); // Insert data into the table after replacing the employee ID with the name
                  })
                  .catch((error) => {
                      console.error("Error fetching employee data for internal task:", error);
                      task['employeeFilter'] = 'خطأ في تحميل الاسم'; // Handle fetch error
                      addDataToTable(tableId, task); // Insert data into the table even if there's an error fetching the employee name
                  });
          }
          // Fetch employee name for client tasks
          else if (tableId === 'clientTaskTable' && task['employeeFilterClient'] && task['employeeFilterClient'].length === 20) {
              console.log(`Fetching employee data for Client Task. Employee ID: ${task['employeeFilterClient']}, Company ID: ${task['companyFilter']}`);

              // Check if the companyFilter exists first
              if (task['companyFilterClient']) {
                  // Fetch the employee name from Firestore
                  db.collection('companies').doc(task['companyFilterClient']).collection('employees').doc(task['employeeFilterClient']).get()
                      .then((employeeDoc) => {
                          if (employeeDoc.exists) {
                              console.log(`Employee data for ID ${task['employeeFilterClient']}:`, employeeDoc.data());
                              task['employeeFilterClient'] = employeeDoc.data()['اسم الموظف']; // Replace document ID with the employee's name
                          } else {
                              console.warn(`Employee not found in company ${task['companyFilter']} for ID: ${task['employeeFilterClient']}`);
                              task['employeeFilterClient'] = 'اسم غير موجود'; // Handle case where employee doesn't exist
                          }
                          addDataToTable(tableId, task); // Insert data into the table after replacing the employee ID with the name
                      })
                      .catch((error) => {
                          console.error("Error fetching employee data for client task:", error);
                          task['employeeFilterClient'] = 'خطأ في تحميل الاسم'; // Handle fetch error
                          addDataToTable(tableId, task); // Insert data into the table even if there's an error fetching the employee name
                      });
              } else {
                  console.error(`Company ID is missing or invalid for Document ID: ${doc.id}`);
                  task['employeeFilterClient'] = 'خطأ في بيانات الشركة'; // Show this message only if company ID is missing
                  addDataToTable(tableId, task); // Add the row with the error message
              }
          } else {
              console.log(`Inserting task data without employee lookup:`, task);
              addDataToTable(tableId, task); // Insert data into the table directly if there's no employeeFilterClient
          }
      });
  }).catch((error) => {
      console.error("Error loading data from Firestore: ", error);
  });
}

function addDataToTable(tableId, task) {
  const tableBody = document.getElementById(`${tableId}Body`);
  const row = document.createElement("tr");

  // Define the ordered keys for both internal and client tables
  const orderedKeys = tableId === 'internalTaskTable'
      ? ['employeeFilter', 'jobTitleFilter', 'مرحلة_التدريب', 'تاريخ_المهمة', 'رقم_المهمة_الحالية', 'رقم_المهمة_القادمة', 'اسم_المهمة', 'مرفق_المهمة', 'رابط_المرفق', 'اسناد_المهمة']
      : ['employeeFilterClient', 'jobTitleFilterClient', 'مرحلة_التدريب', 'تاريخ_المهمة_عميل', 'اسم_المهمة_عميل', 'حالة_المهمة_عميل', 'التفاعل_عميل', 'ملاحظات_المهام_عميل'];

  // Loop through ordered keys and generate table cells for each column
  orderedKeys.forEach(key => {
      const cell = document.createElement("td");

      // Handle employee name for both internal and client sheets
      if (key === 'employeeFilter' || key === 'employeeFilterClient') {
          const employeeName = task[key] || 'اسم غير موجود';
          cell.textContent = employeeName;
      } else if (key === 'رابط_المرفق') {
          // Create a clickable link for 'رابط_المرفق'
          const link = document.createElement("a");
          link.href = task[key] || "#";
          link.textContent = "رابط";
          link.target = "_blank";
          cell.appendChild(link);
      } else if (typeof task[key] === 'boolean') {
          // Create a checkbox for boolean fields
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = task[key];
          checkbox.disabled = true;
          cell.appendChild(checkbox);
      } else {
          // Default case: plain text content for other columns
          cell.textContent = task[key] || "";
      }

      row.appendChild(cell);
  });

  // Add the actions cell with the buttons after all other cells
  const actionsCell = document.createElement("td");

  // Create and append the Edit button
  const editButton = document.createElement("button");
  editButton.textContent = "تعديل";
  editButton.onclick = () => editRow(task.id, tableId);
  actionsCell.appendChild(editButton);

  // Create and append the Delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "حذف";

  // Attach delete function to the delete button
  deleteButton.onclick = () => deleteRow(task.id, tableId, tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks');
  actionsCell.appendChild(deleteButton);

  // Append the actions cell as the last column (under "الإجراءات")
  row.appendChild(actionsCell);

  // Append the row to the table body
  tableBody.appendChild(row);
}

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

// function editRow(docId, tableId) {
//   const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';
//   const formId = tableId === 'internalTaskTable' ? 'internalTaskForm' : 'clientTaskForm';
//   const form = document.getElementById(formId);

//   // Load the document data from Firestore into the form
//   db.collection(collectionName).doc(docId).get().then((doc) => {
//       if (doc.exists) {
//           const data = doc.data();
//           Object.keys(data).forEach(key => {
//               const formElement = form.querySelector(`#${key}`);
//               if (formElement) {
//                   if (formElement.type === 'checkbox') {
//                       formElement.checked = data[key];
//                   } else {
//                       formElement.value = data[key];
//                   }
//               }
//           });

//           // Change the add button to a save button to update the row
//           const addButton = form.querySelector("button[onclick^='addRow']");
//           addButton.textContent = "حفظ التغييرات";
//           addButton.onclick = () => saveChanges(docId, tableId);
//       } else {
//           console.error("No such document!");
//       }
//   }).catch((error) => {
//       console.error("Error getting document:", error);
//   });
// }

function editRow(docId, tableId) {
  const collectionName = tableId === 'internalTaskTable' ? 'internalTasks' : 'clientTasks';
  const formId = tableId === 'internalTaskTable' ? 'internalTaskForm' : 'clientTaskForm';
  const form = document.getElementById(formId);

  // Load the document data from Firestore into the form using the document ID
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

function addCompanyWithEmployees(companyName, employees) {
  const companyRef = db.collection('companies').doc(); // Generates a new company document reference

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

function filterData() {
  const companyId = document.getElementById("companyFilter").value;
  const employeeFilter = document.getElementById("employeeFilter");
  const jobTitleInput = document.getElementById("jobTitleFilter"); // Job title input field

  // Clear previous employee options and reset job title input
  employeeFilter.innerHTML = '<option value="">اختر الموظف</option>';
  jobTitleInput.value = ""; // Clear job title input

  if (!companyId) {
    return; // If no company is selected, exit the function
  }

  // Fetch employees for the selected company
  db.collection('companies').doc(companyId).collection('employees').get().then((querySnapshot) => {
    const employeeDataList = []; // Store employee data

    querySnapshot.forEach((doc) => {
      const employeeData = doc.data();
      const employeeName = employeeData["اسم الموظف"];
      const jobTitle = employeeData["المسمى الوظيفي"];

      // Populate employee dropdown
      const employeeOption = document.createElement('option');
      employeeOption.value = doc.id; // Use employee document ID as the value
      employeeOption.textContent = employeeName;
      employeeFilter.appendChild(employeeOption);

      // Store employee data for later use
      employeeDataList.push({
        id: doc.id,
        name: employeeName,
        jobTitle: jobTitle
      });
    });

    // When an employee is selected, find and display the corresponding job title
    employeeFilter.addEventListener('change', function() {
      const selectedEmployeeId = employeeFilter.value;
      const selectedEmployee = employeeDataList.find(emp => emp.id === selectedEmployeeId);

      if (selectedEmployee) {
        jobTitleInput.value = selectedEmployee.jobTitle; // Set the job title input field
      } else {
        jobTitleInput.value = ""; // Clear the field if no employee is selected
      }
    });
  }).catch((error) => {
    console.error("Error loading employees: ", error);
  });
}

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

function filterDataClient() {
  const companyId = document.getElementById("companyFilterClient").value;
  const employeeFilterClient = document.getElementById("employeeFilterClient");
  const jobTitleInputClient = document.getElementById("jobTitleFilterClient");

  // مسح الاختيارات السابقة
  employeeFilterClient.innerHTML = '<option value="">اختر الموظف</option>';
  jobTitleInputClient.value = ""; // تفريغ حقل المسمى الوظيفي

  if (!companyId) {
    return; // إذا لم يتم تحديد شركة، خروج من الدالة
  }

  // جلب الموظفين للشركة المحددة
  db.collection('companies').doc(companyId).collection('employees').get().then((querySnapshot) => {
    const employeeDataList = []; // قائمة لتخزين بيانات الموظفين

    querySnapshot.forEach((doc) => {
      const employeeData = doc.data();
      const employeeName = employeeData["اسم الموظف"];
      const jobTitle = employeeData["المسمى الوظيفي"];

      // إضافة خيار الموظف إلى القائمة المنسدلة
      const employeeOption = document.createElement('option');
      employeeOption.value = doc.id; // استخدام الـ Document ID كقيمة للـ option
      employeeOption.textContent = employeeName;
      employeeFilterClient.appendChild(employeeOption);

      // تخزين بيانات الموظفين لاستخدامها لاحقًا
      employeeDataList.push({
        id: doc.id,
        name: employeeName,
        jobTitle: jobTitle
      });
    });

    // عند اختيار موظف، يتم عرض المسمى الوظيفي المقابل
    employeeFilterClient.addEventListener('change', function() {
      const selectedEmployeeId = employeeFilterClient.value;
      const selectedEmployee = employeeDataList.find(emp => emp.id === selectedEmployeeId);

      if (selectedEmployee) {
        jobTitleInputClient.value = selectedEmployee.jobTitle; // عرض المسمى الوظيفي
      } else {
        jobTitleInputClient.value = ""; // تفريغ الحقل إذا لم يتم اختيار موظف
      }
    });
  }).catch((error) => {
    console.error("Error loading employees: ", error);
  });
}

const firebaseConfig = {
  apiKey: "AIzaSyBMzWcjvTStYVHy-BxN2hpMTSQxCBN3nXk",
  authDomain: "excel-sheet-737fa.firebaseapp.com",
  projectId: "excel-sheet-737fa",
  storageBucket: "excel-sheet-737fa.appspot.com",
  messagingSenderId: "202807179886",
  appId: "1:202807179886:web:a3b4c83de711fc4648847f",
  measurementId: "G-YG34XVCJ3X"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function() {
    loadTableData('internalTaskTable', 'internalTasks');
    loadTableData('clientTaskTable', 'clientTasks');
  
    // Open the first tab by default
    document.getElementsByClassName("tablinks")[0].click();
});

document.addEventListener("DOMContentLoaded", function() {
  loadCompanyNames();
  loadCompanyNamesClient(); // For ClientSheet
});

let db;

const request = indexedDB.open('budget_tracker', 1)

// event will trigger on database version change
request.onupgradeneeded = function(event) {
    // save reference to the database
    const db = event.target.result

    // create an object store
    db.createObjectStore('new_budget', { autoIncrement: true })
}

// successful request
request.onsuccess = function(event) {
    // save reference to db in global variable
    db = event.target.result

    // check if app is online
    if(navigator.onLine) {
        uploadBudget()
    }
}

// this function will execute if there is a new transaction created and there is no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction([ 'new_transaction'], 'readwrite')

    // access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction')

    // add record to store
    transactionObjectStore.add(record)
}

function uploadTransaction() {
    // open a transaction in the db
    const transaction = db.transaction(['new_transaction'], 'readwrite')

    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction')

    // get all records form store
    const getAll = transactionObjectStore.getAll()

    // on successful 'getAll'
    getAll.onsuccess = function() {
        // if data in store, send to the api
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST', 
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json)
                .then(serverResponse => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse)
                    }

                    // open another transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite')

                    // clear items in store
                    transactionObjectStore.clear()

                    alert('all saved transactions have been submitted')
                })
                .catch(err => {
                    console.log(err)
                })
        }
    }
}

// listen for app coming back online
window.addEventListener("online", uploadTransaction)
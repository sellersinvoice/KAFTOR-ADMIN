
// const API = 'https://script.google.com/macros/s/AKfycbyq25w6-wKAgYJM4U33E9YFwTx1XOLaRd0ONwYyZqcZWMyGjjBi4n-MJBAT1nuCbgir/exec';
const API ='https://script.google.com/macros/s/AKfycby3ersEf7mYnjqH7zLqsVU8jwHCOpLnWMAhmDglC9YRL3-cMHdXVKZbGx_K9FmbIeQU/exec'
let ORDER_ITEMS_CACHE = [];
let INVENTORY_CACHE = [];
let INVENTORY_BY_BARCODE = {};
let UPLOADED_URLS_CACHE = [];


// const firebaseConfig = {
//     apiKey: "AIzaSyB3wWzFFTJtgihdHtwrBc3QGUlC0ylDygg",
//     authDomain: "kaftor-il.firebaseapp.com",
//     projectId: "kaftor-il",
//     storageBucket: "kaftor-il.firebasestorage.app",
//     messagingSenderId: "509331651280",
//     appId: "1:509331651280:web:02c76afc0dc27c059f3cd5"
//   };
const firebaseConfig = {
  apiKey: "AIzaSyDQVEpmUGZ-ipTY0D9yzxxW4hoOjPUl1JQ",
  authDomain: "kaftor-usa.firebaseapp.com",
  projectId: "kaftor-usa",
  storageBucket: "kaftor-usa.firebasestorage.app",
  messagingSenderId: "870840382352",
  appId: "1:870840382352:web:bec543c4c1e36d4f143915"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


function loadInventory() {
  showLoading("Loading inventory…");

  fetch(API + '?action=inventory')
    .then(res => res.json())
    .then(data => {
      INVENTORY_CACHE = data;

      INVENTORY_BY_BARCODE = {};
      data.forEach(p => {
        INVENTORY_BY_BARCODE[p.barcode] = p;
      });

      const tbody = document.querySelector('#inventoryTable tbody');
      tbody.innerHTML = '';

      data.forEach(p => {
        tbody.innerHTML += `
          <tr class="hover:bg-gray-50">
            <td class="p-3">${p.barcode}</td>
            <td class="p-3 font-medium">${p.name}</td>
            <td class="p-3">${p.category}</td>
            <td class="p-3">$${p.price}</td>
            <td class="p-3">
              <input type="number"
                value="${p.stock}"
                class="border rounded w-20 p-1"
                onchange="updateStock('${p.barcode}', this.value)">
            </td>
          </tr>`;
      });

      hideLoading();
    });
}


function loadOrders() {
  showLoading("Loading orders…");

  db.collection("orders")
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => {
      const tbody = document.querySelector('#ordersTable tbody');
      tbody.innerHTML = '';

      snapshot.forEach(doc => {
        const o = doc.data();
        console.log(JSON.stringify(doc))
        const isReturn = o.isReturn === true;

        const rowClass = isReturn
          ? "bg-red-100 text-red-700"
          : "hover:bg-gray-50";

        const statusText = isReturn
          ? "החזרה"
          : o.status;
        tbody.innerHTML += `
          <tr id="order-${doc.id}"
            class="${rowClass} cursor-pointer"
          >
            <td><button onclick="toggleOrderDetails('${doc.id}', 'order-${doc.id}')" class="text-gray-400 hover:text-red-600 transition-colors text-sm"> לפרטי ההזמנה  </button></td>
            <td class="p-3 font-mono text-xs">${doc.id}</td>
            <td class="p-3">${o.customer}</td>
            <td class="p-3">${o.store}</td>
            <td class="p-3">${o.address}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3">${o.email}</td>
            <td class="p-3 font-semibold ${isReturn ? 'text-red-600' : 'text-orange-600'}">
              ${statusText}
            </td>
            <td>
              <button onclick="deleteOrder('${doc.id}')"
                class="text-gray-400 hover:text-red-600 transition-colors text-sm">
                ביטול הזמנה🗑
              </button>
            </td>
            <td class="p-3">
              <button
                class="px-3 py-1 bg-green-600 text-white rounded"
                onclick="approveOrder('${doc.id}',${isReturn})">
                אשר הזמנה
              </button>
            </td>
          </tr>
        `;
      });

      hideLoading();
    })
    .catch(err => {
      hideLoading();
      alert("Failed to load orders");
      console.error(err);
    });
}


async function loadAllOrders() {
  try {
    // 1. Fetch orders
    const res = await fetch(API + '?action=allOrders');
    const data = await res.json();
    
    const tbody = document.querySelector('#allOrdersTable tbody');
    tbody.innerHTML = '';
    
    // 2. This now works because the parent is async!
    ordersData = data;
    paymentsData = await fetchPayments(); 
    


    // 3. Render rows
    data.forEach(o => {
      tbody.innerHTML += `
        <tr class="hover:bg-gray-50">
          <td class="p-3">${o.orderId}</td>
          <td class="p-3">${o.customer}</td>
          <td class="p-3">
            <span class="px-2 py-1 rounded text-xs font-semibold
              ${o.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
              ${o.status}
            </span>
          </td>
          <td class="p-3">${new Date(o.created).toLocaleString()}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("Error loading data:", error);
  }
}

async function fetchPayments() {
  try {
    const response = await fetch(`${API}?action=payments`);
    const payments = await response.json();
    console.log("All Payments:", payments);
    return payments;
  } catch (error) {
    console.error("Failed to fetch payments", error);
  }
}

// function loadOrdersFromFirebase() {
//   showLoading("Loading orders…");

//   db.collection("orders")
//     .where("status", "==", "PENDING")
//     .orderBy("createdAt", "desc")
//     .get()
//     .then(snapshot => {
//       const tbody = document.querySelector('#ordersTable tbody');
//       tbody.innerHTML = '';

//       snapshot.forEach(doc => {
//         const o = doc.data();
//         tbody.innerHTML += `
//           <tr id="order-${doc.id}">
//             <td>${doc.id}</td>
//             <td>${o.customer}</td>
//             <td>${o.status}</td>
//             <td>
//               <button onclick="approveOrder('${doc.id}')">
//                 Approve
//               </button>
//             </td>
//           </tr>
//         `;
//       });

//       hideLoading();
//     });
// }


// function preloadOrderItems() {
//   return fetch(API + '?action=allorderItems')
//     .then(res => res.json())
//     .then(data => {
//       ORDER_ITEMS_CACHE = data;
//       console.log('Order items cached:', ORDER_ITEMS_CACHE.length);
//     });
// }


// function approve(orderId) {
//   if (!confirm('Approve this order?')) return;

//   showLoading("Approving order…");

//   fetch(API, {
//     method: 'POST',
//     body: JSON.stringify({
//       action: 'approveOrder',
//       orderId
//     })
//   })
//   .then(res => res.json())
//   .then(() => {
//     loadOrders();
//     loadAllOrders();
//     loadInventory();
//     hideLoading();
//   });
// }

let CURRENT_APPROVE = {}; // store product totals for this approval
let CURRENT_ORDER_ITEMS = []; // store items for this order
let CURRENT_DOC_ID = ""
let CURRENT_ORDER = null;        // store current order object

function deleteOrder(orderId) {

  if (!confirm("למחוק ההזמנה?")) {
    return;
  }

  showLoading("מוחק הזמנה...");

  db.collection("orders")
    .doc(orderId)
    .delete()
    .then(() => {
      hideLoading();
      alert("Order deleted successfully");
      loadOrders();
    })
    .catch((error) => {
      hideLoading();
      alert("Delete failed");
      console.error(error);
    });
}



function approveOrder(orderId,isReturn) {
  const multiplier = isReturn ? -1 : 1;
  showLoading("Loading order…");

  // 1️⃣ Load selected order
  db.collection("orders").doc(orderId).get()
    .then(doc => {
      const order = doc.data();
      if (!order || !order.items) throw new Error("No items found");

      CURRENT_ORDER = order;
      CURRENT_ORDER_ITEMS = order.items;
      CURRENT_APPROVE = {};
      CURRENT_DOC_ID = orderId
      CURRENT_ORDER.isReturn =isReturn
      // 2️⃣ Get totals across all pending orders
      return db.collection("orders")
               .where("status", "==", "PENDING")
               .get()
               .then(snapshot => {
                 const totalsAcrossOrders = {};
                 snapshot.forEach(d => {
                   const o = d.data();
                   o.items.forEach(i => {
                     if (!totalsAcrossOrders[i.barcode]) totalsAcrossOrders[i.barcode] = 0;
                     totalsAcrossOrders[i.barcode] += i.qty;
                   });
                 });
                 return totalsAcrossOrders;
               });
    })
    .then(totalsAcrossOrders => {
      const container = document.getElementById("approveItems");
      container.innerHTML = '';
      container.innerHTML +=`<p class="font-medium">הזמנה של תאריך : ${CURRENT_ORDER.createdAt.toDate().toLocaleString()}</p>`
      // Render modal rows
      CURRENT_ORDER_ITEMS.forEach(i => {
        const barcode = i.barcode;
        const name = getProductName(barcode);
        const price = i.price
        const stock = INVENTORY_BY_BARCODE[barcode]?.stock || 0;
        const qtyThisOrder = i.qty;
        const qtyAllOrders = totalsAcrossOrders[barcode] || 0;

        CURRENT_APPROVE[barcode] = qtyThisOrder;

        container.innerHTML += `
          <div class="flex justify-between items-center border-b py-1 gap-2">
            <div class="flex-1">
              <p class="font-medium">${name}</p>
              <input type="number"
              step="0.01"
              value="${Number(String(price).replace(/[^\d.-]/g, ''))}"
              class="border rounded w-24 p-1 text-right"
              oninput="
                const item = CURRENT_ORDER_ITEMS.find(i => i.barcode === '${barcode}');
                if (item) {
                  item.price = Number(this.value) || 0;
                  console.log('Updated ${barcode} price to:', item.price);
                }">
              <p class="text-xs text-gray-500">${barcode}</p>
              <p class="text-xs text-gray-500">${getProductCatalog(barcode)}</p>
            </div>

            <div class="text-sm w-16 text-center">מלאי: ${stock}</div>
            <div class="text-sm w-16 text-center">סה"כ להזמנה: ${qtyThisOrder}</div>
            <div class="text-sm w-16 text-center">סה"כ לכל ההזמנות: ${qtyAllOrders}</div>

            <input type="number"
                   min="0"
                   oninput="
                    const item = CURRENT_ORDER_ITEMS.find(i => i.barcode === '${barcode}');
                    if (item) {
                      item.qty = Number(this.value ) || 0;
                      console.log('Updated ${barcode} qty to:', item.qty);
                    }"
                   value="${qtyThisOrder * multiplier}"
                   data-barcode="${barcode}"
                   class="border rounded w-20 p-1 text-right">
          </div>
        `;
      });
      container.innerHTML += `
        <div class="mt-4">
          <button onclick="openAddItemModal()"
                  class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
            ➕ הוסף פריט להזמנה
          </button>
        </div>
      `;
      // Checkbox for remaining quantities
      container.innerHTML += `
        <div class="mt-2 flex items-center gap-2">
          <input type="checkbox" id="partialRemaining">
          <label for="partialRemaining" class="text-sm">
            צור הזמנה לפריטים הנשארים
          </label>
        </div>
      `;

      // Comment field
      container.innerHTML += `
        <div class="mt-3">
          <label class="text-sm font-medium block mb-1">הערות להזמנה:</label>
          <textarea id="approveComment"
                    class="w-full border rounded p-2 text-sm"
                    rows="3"
                    placeholder="כתוב כאן הערות שיצורפו למייל..."></textarea>
        </div>
      `;

      document.getElementById("approveModal").classList.remove("hidden");
      hideLoading();
    })
    .catch(err => {
      hideLoading();
      console.error(err);
      alert("Failed to load order approval modal");
    });
}

function submitApproval() {
  const multiplier = CURRENT_ORDER.isReturn ? -1 : 1;
  console.log(CURRENT_ORDER.isReturn)
  const comment = document.getElementById("approveComment")?.value || "";
  const inputs = document.querySelectorAll("#approveItems input[type=number]");
  let element = document .getElementById("approveItems").innerHTML
  const approved = {};
  let total = 0
  inputs.forEach(input => {
    const barcode = input.dataset.barcode;
    const qty = Math.abs(Number(input.value)) || 0;
    const orderedQty = CURRENT_ORDER_ITEMS.find(i => i.barcode === barcode)?.qty || 0;
    const price = Number(
      CURRENT_ORDER_ITEMS.find(i => i.barcode === barcode)?.price
    ) || 0;
    if (qty > 0 && qty <= orderedQty){
      let sum = Number((qty * price * multiplier).toFixed(2));
      approved[barcode] = {
        amount: qty * multiplier,
        price: Number(price.toFixed(2)),
        total: sum
      };
      console.log(approved)
      total += sum
    };
  });

  if (!Object.keys(approved).length) {
    alert("You must approve at least one item");
    return;
  }

  showLoading("Submitting approval…");

  // 1️⃣ Send to Google Sheets using exact old route
  fetch(API, {
    method: 'POST',
    body: JSON.stringify({
      action: 'approveFirebaseOrder',
      orderId: CURRENT_DOC_ID,
      customer: [{name:CURRENT_ORDER.customer,email:CURRENT_ORDER.email,orderTotal:total,comment:comment,createAt :CURRENT_ORDER.createAt,isReturn:CURRENT_ORDER.isReturn}],
      items: [approved]
      
    })
  })
  .then(res => res.json())
  .then(result => {
    if (!result.success) throw new Error("Approval failed");
    sendOrderEmail(CURRENT_ORDER.email,approved,total,comment)
      // 2️⃣ Delete original order
      return db.collection("orders").doc(CURRENT_DOC_ID).delete()
        .then(() => {
          return result; // pass through
        });
    })
    .then(() => {
      // 3️⃣ Handle remaining quantities if checkbox is checked
      const createRemaining = document.getElementById("partialRemaining").checked;
      if (createRemaining) {
        const remainingItems = CURRENT_ORDER_ITEMS.map(i => {
          const approvedQty = approved[i.barcode] || 0;
          const remainingQty = i.qty - approvedQty;
          if (remainingQty > 0) return { ...i, qty: remainingQty };
          return null;
        }).filter(Boolean);

        if (remainingItems.length) {
          // create a new order in Firebase
                db.collection("orders").add({
          customer: CURRENT_ORDER?.customer ?? "",
          email: CURRENT_ORDER?.email ?? "",
          phone: CURRENT_ORDER?.phone ?? "",
          store: CURRENT_ORDER?.store ?? "",
          items: remainingItems,
          status: "PENDING",
          createdAt: Date.now()
        });

        }
    }

    closeApproveModal();
    loadOrders();
    loadInventory();
    hideLoading();
    alert("Approval submitted");
  })
  .catch(err => {
    hideLoading();
    console.error(err);
    alert("Failed to submit approval");
  });
}



function closeApproveModal() {
  document.getElementById("approveModal").classList.add("hidden");
}

function renderInventoryList(searchTerm) {

  const list = document.getElementById("inventoryList");
  list.innerHTML = '';

  const term = searchTerm.toLowerCase();

  Object.values(INVENTORY_BY_BARCODE).forEach(item => {

    if (
      !item.name.toLowerCase().includes(term) &&
      !String(item.barcode).includes(term)
    ) return;

    list.innerHTML += `
      <div class="flex justify-between items-center border-b py-2 gap-2">

        <div class="flex-1">
          <p class="font-medium">${item.name}</p>
          <p class="text-xs text-gray-500">${item.barcode}</p>
          <p class="text-xs text-gray-400">מלאי: ${item.stock}</p>
        </div>

        <input type="number"
               min="0"
               placeholder="0"
               class="border rounded w-20 p-1 text-center"
               onchange="addItemToCurrentOrder('${item.barcode}', this.value)">
      </div>
    `;
  });
}

function addItemToCurrentOrder(barcode, qty) {
  qty = Number(qty) || 0;
  if (qty <= 0) return;

  const product = INVENTORY_BY_BARCODE[barcode];
  if (!product) return;

  // Check if already exists in CURRENT_ORDER_ITEMS
  let existing = CURRENT_ORDER_ITEMS.find(i => i.barcode === barcode);

  if (existing) {
    existing.qty += qty;
    // Update the input in the modal if it exists
    const inputEl = document.querySelector(`#approveItems input[data-barcode='${barcode}']`);
    if (inputEl) inputEl.value = existing.qty;
  } else {
    // Add new item to CURRENT_ORDER_ITEMS
    const newItem = {
      barcode: barcode,
      name: product.name,
      price: product.price,
      qty: qty
    };
    CURRENT_ORDER_ITEMS.push(newItem);
    CURRENT_APPROVE[barcode] = qty;

    // Append a new row to the modal instead of reloading
    const container = document.getElementById("approveItems");
    const stock = product.stock || product.availble || 0;
    container.innerHTML += `
      <div class="flex justify-between items-center border-b py-1 gap-2">
        <div class="flex-1">
          <p class="font-medium">${newItem.name}</p>
          <p class="font-medium">${newItem.price}</p>
          <p class="text-xs text-gray-500">${newItem.barcode}</p>
        </div>
        <div class="text-sm w-16 text-center">מלאי: ${stock}</div>
        <div class="text-sm w-16 text-center">סה"כ להזמנה: ${qty}</div>
        <div class="text-sm w-16 text-center">סה"כ לכל ההזמנות: 0</div>

        <input type="number"
               min="0"
               value="${qty}"
               data-barcode="${barcode}"
               class="border rounded w-20 p-1 text-right"
               oninput="
                 const item = CURRENT_ORDER_ITEMS.find(i => i.barcode === '${barcode}');
                 if (item) item.qty = Number(this.value) || 0;
               ">
      </div>
    `;
  }

  closeAddItemModal();
}

async function sendOrderEmail(customerEmail, cart ,orderTotal,comment) {
  await loadCustomerAliases();
  customerEmail = getCustomerDetails(customerEmail).email;
  // Build a clean table for the email
let emailTable = `
  <table dir="rtl" style="width: 100%; border-collapse: collapse; font-family: sans-serif;text-align: right;">
    <thead>
      <tr style="background-color: #f3f4f6; text-align: right;direction: rtl;">
        <th style="padding: 10px; border: 1px solid #ddd;text-align: right;">מוצר</th>
        <th style="padding: 10px; border: 1px solid #ddd;text-align: right;">כמות</th>
        <th style="padding: 10px; border: 1px solid #ddd;text-align: right;">מחיר</th>
      </tr>
    </thead>
    <tbody>
`;

// Loop through your cart items to add rows
// Assuming 'cartItems' is your array of products
for (const barcode in cart){
  const data = cart[barcode];
  emailTable += `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;">${getProductName(barcode)}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${data.amount}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${data.price}</td>
    </tr>
  `;
};

emailTable += `
    </tbody>
  </table>
  <h3 style="margin-top: 20px;text-align: right;">סה"כ: ${orderTotal} ₪</h3>
`;

  if (comment) {
    emailTable +=   `<p style="margin-top: 20px;text-align: right;"><strong style="margin-top: 20px;text-align: right;">הערות:</strong><br>${comment}</p>`;
  }
  // const webAppUrl = "https://script.google.com/macros/s/AKfycbz0By59bIOfUjD2WC5BwNzjt8tV8HP06j2YEmfltcfuVBj811OaNafhjRIVG8R8e2Xj4w/exec";
  const webAppUrl ="https://script.google.com/macros/s/AKfycbw25OR24sMnKnEe8V7UfjTQumLRf0PwlO4Z0Ri3eljKm0fyy5B-PAcEEt3yI1VVhK9_/exec"

  const payload = {
    email: customerEmail,
    htmlBody: `<h1>סיכום הזמנה</h1>${emailTable}<p>מייל: ${customerEmail}</p>`
  };

 try {
  await fetch(webAppUrl, {
  method: 'POST',
  mode: 'no-cors',
  headers: {
    'Content-Type': 'text/plain'
  },
  body: JSON.stringify(payload)
});

alert("Order sent successfully!");


} catch (error) {
  console.error("Email failed:", error);
}
}
function approveOrderB(orderId) {
  if (!confirm("Approve this order?")) return;

  showLoading("Approving order…");

  db.collection("orders").doc(orderId).get()
    .then(doc => {
      const order = doc.data();

      return fetch(API, {
        method: 'POST',
        body: JSON.stringify({
          action: 'approveFirebaseOrder',
          orderId,
          customer: order.customer,
          items: order.items
        })
      });
    })
    .then(res => res.json())
    .then(result => {
      if (!result.success) throw new Error("Approval failed");

      // ✅ delete from Firebase AFTER sheet success
      return db.collection("orders").doc(orderId).delete();
    })
    .then(() => {
      hideLoading();
      alert("Order approved");
    })
    .catch(err => {
      hideLoading();
      alert("Failed to approve order");
      console.error(err);
    });
}




showLoading();
let orders = [];
let ordersData = [];
let paymentsData = [];
Promise.all([
  // preloadOrderItems(),
  loadOrders(),
  loadInventory()
]).finally(hideLoading);

const customerDataReady = loadAllOrders();

function showLoading(message = "Friendly hold on 🙂<br>We’re loading things for you...") {
  const overlay = document.getElementById('loadingOverlay');
  overlay.querySelector('p').innerHTML = message;
  overlay.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function switchTab(tab) {
  const inventory = document.getElementById('inventorySection');
  const orders = document.getElementById('ordersSection');
  const allOrders = document.getElementById('allOrdersSection');
  const customers =document.getElementById("customersSection")
  const urls = document.getElementById("urlsSection");

  const btnInv = document.getElementById('tabInventory');
  const btnOrd = document.getElementById('tabOrders');
  const btnAllOrd = document.getElementById('tabAllOrders');
  const btnCst = document.getElementById("tabCustomers");
  const btnUrls = document.getElementById("tabUrls");

  // hide all sections
  inventory.classList.add('hidden');
  orders.classList.add('hidden');
  allOrders.classList.add('hidden');
  customers.classList.add("hidden");
  urls.classList.add("hidden");

  // reset all buttons
  [btnInv, btnOrd,btnCst, btnAllOrd, btnUrls].forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-gray-200');
  });

  // show selected tab
  if (tab === 'inventory') {
    inventory.classList.remove('hidden');
    btnInv.classList.add('bg-blue-600', 'text-white');
    btnInv.classList.remove('bg-gray-200');
  }
  else if (tab === 'allorders') {
    allOrders.classList.remove('hidden');
    btnAllOrd.classList.add('bg-blue-600', 'text-white');
    btnAllOrd.classList.remove('bg-gray-200');

    // loadAllOrders(); // 👈 important
  }
  else if (tab === 'customers') {
    customers.classList.remove('hidden');
    btnCst.classList.add('bg-blue-600', 'text-white');
    btnCst.classList.remove('bg-gray-200');
    renderCustomers()

   
  }
  else if (tab === 'urls') {
    urls.classList.remove('hidden');
    btnUrls.classList.add('bg-blue-600', 'text-white');
    btnUrls.classList.remove('bg-gray-200');
    loadUploadedUrls();
  }
  else {
    orders.classList.remove('hidden');
    btnOrd.classList.add('bg-blue-600', 'text-white');
    btnOrd.classList.remove('bg-gray-200');

    loadOrders(); // 👈 important
  }
}

document.getElementById('tabInventory').onclick = () => switchTab('inventory');
document.getElementById('tabOrders').onclick = () => switchTab('orders');
document.getElementById('tabAllOrders').onclick = () => switchTab('allorders');
document.getElementById('tabCustomers').onclick = () => switchTab('customers');
document.getElementById('tabUrls').onclick = () => switchTab('urls');

async function uploadUrlsToFirebase() {
  const input = document.getElementById("urlsInput");
  const status = document.getElementById("urlsUploadStatus");
  const button = document.getElementById("uploadUrlsBtn");

  const urls = input.value
    .split(/[\n,]+/)
    .map(url => url.trim())
    .filter(Boolean);

  const invalidUrl = urls.find(url => {
    try {
      new URL(url);
      return false;
    } catch (error) {
      return true;
    }
  });

  if (!urls.length) {
    status.innerText = "Paste at least one URL.";
    status.className = "text-sm text-red-600";
    return;
  }

  if (invalidUrl) {
    status.innerText = `Invalid URL: ${invalidUrl}`;
    status.className = "text-sm text-red-600";
    return;
  }

  button.disabled = true;
  button.classList.add("opacity-60", "cursor-not-allowed");
  status.innerText = "Uploading...";
  status.className = "text-sm text-gray-500";

  try {
    await db.collection("uploadedUrls").doc("urls").set({
      urls: firebase.firestore.FieldValue.arrayUnion(...urls),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    input.value = "";
    status.innerText = `Uploaded ${urls.length} URL${urls.length === 1 ? "" : "s"} to Firebase.`;
    status.className = "text-sm text-green-600";
    await loadUploadedUrls();
  } catch (error) {
    console.error("Failed to upload URLs:", error);
    status.innerText = "Failed to upload URLs.";
    status.className = "text-sm text-red-600";
  } finally {
    button.disabled = false;
    button.classList.remove("opacity-60", "cursor-not-allowed");
  }
}

async function loadUploadedUrls() {
  const list = document.getElementById("urlsList");
  if (!list) return;

  list.innerHTML = `<p class="text-sm text-gray-500">Loading URLs...</p>`;

  try {
    const doc = await db.collection("uploadedUrls").doc("urls").get();
    UPLOADED_URLS_CACHE = doc.exists ? (doc.data().urls || []) : [];
    renderUploadedUrls();
  } catch (error) {
    console.error("Failed to load URLs:", error);
    list.innerHTML = `<p class="text-sm text-red-600">Failed to load URLs.</p>`;
  }
}

function renderUploadedUrls() {
  const list = document.getElementById("urlsList");
  const search = (document.getElementById("urlsSearch")?.value || "").toLowerCase();

  if (!list) return;

  const urls = UPLOADED_URLS_CACHE
    .map((url, index) => ({ url, index }))
    .filter(item => item.url.toLowerCase().includes(search));

  if (!urls.length) {
    list.innerHTML = `<p class="text-sm text-gray-500">No URLs found.</p>`;
    return;
  }

  list.innerHTML = urls.map(item => `
    <div class="border rounded p-3 flex gap-2 items-center">
      <input
        id="urlEdit-${item.index}"
        value="${escapeHtml(item.url)}"
        class="border rounded p-2 flex-1 text-left"
        dir="ltr">

      <button
        onclick="replaceUploadedUrl(${item.index})"
        class="bg-green-600 text-white px-3 py-2 rounded text-sm">
        Save
      </button>

      <button
        onclick="deleteUploadedUrl(${item.index})"
        class="bg-red-600 text-white px-3 py-2 rounded text-sm">
        Delete
      </button>
    </div>
  `).join("");
}

async function replaceUploadedUrl(index) {
  const input = document.getElementById(`urlEdit-${index}`);
  const status = document.getElementById("urlsUploadStatus");
  const newUrl = input.value.trim();

  if (!newUrl) {
    status.innerText = "URL cannot be empty.";
    status.className = "text-sm text-red-600";
    return;
  }

  try {
    new URL(newUrl);
  } catch (error) {
    status.innerText = `Invalid URL: ${newUrl}`;
    status.className = "text-sm text-red-600";
    return;
  }

  const urls = [...UPLOADED_URLS_CACHE];
  urls[index] = newUrl;

  await saveUploadedUrls(urls, "URL updated.");
}

async function deleteUploadedUrl(index) {
  if (!confirm("Delete this URL?")) return;

  const urls = UPLOADED_URLS_CACHE.filter((_, itemIndex) => itemIndex !== index);
  await saveUploadedUrls(urls, "URL deleted.");
}

async function saveUploadedUrls(urls, message) {
  const status = document.getElementById("urlsUploadStatus");

  try {
    await db.collection("uploadedUrls").doc("urls").set({
      urls,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    UPLOADED_URLS_CACHE = urls;
    renderUploadedUrls();
    status.innerText = message;
    status.className = "text-sm text-green-600";
  } catch (error) {
    console.error("Failed to save URLs:", error);
    status.innerText = "Failed to save URLs.";
    status.className = "text-sm text-red-600";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function toggleOrder(orderId) {
  const row = document.getElementById(`order-${orderId}`);

  if (!row.classList.contains('hidden')) {
    row.classList.add('hidden');
    return;
  }

  row.classList.remove('hidden');
  loadOrderItems(orderId);
}
function loadOrderItems(orderId) {
  const container = document.querySelector(`#order-${orderId} td`);
  if (!container) return;

  const items = ORDER_ITEMS_CACHE.filter(i => i.orderId == orderId);

  if (!items.length) {
    container.innerHTML = `
      <p class="text-sm text-gray-500 italic">
        אין מוצרים להזמנה זו
      </p>
    `;
    return;
  }

  container.innerHTML = `
    <div class="space-y-2">
      ${items.map(i => `
        <div class="flex justify-between items-center text-sm">
          <div>
            <p class="font-medium text-gray-800">
              ${getProductName(i.barcode)}
            </p>
            <p class="text-xs text-gray-500">
              Barcode: ${i.barcode}
            </p>
          </div>

          <span class="font-semibold">
            x${i.qty}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}


function updateStock(barcode, stock) {
  showLoading("מעדכן מלאי...");

  fetch(API, {
    method: 'POST',
    body: JSON.stringify({
      action: 'updateStock',
      barcode,
      stock: Number(stock)
    })
  })
  .then(res => res.json())
  .then(() => {
    hideLoading();
  });
}
document.getElementById('inventorySearch').addEventListener('input', e => {
  const value = e.target.value.toLowerCase();

  document.querySelectorAll('#inventoryTable tbody tr').forEach(row => {
    row.style.display =
      row.innerText.toLowerCase().includes(value)
        ? ''
        : 'none';
  });
});


function getProductName(barcode) {
  return INVENTORY_BY_BARCODE[barcode]?.name || 'Unknown product';
}

function getProductCatalog(barcode) {
  return INVENTORY_BY_BARCODE[barcode]?.catalog || 'Unknown product';
}

function toggleOrderDetails(orderId, rowEl) {
  let element = document.getElementById(rowEl)
  const existing = element.nextElementSibling;
  if (existing && existing.classList.contains('order-details')) {
    existing.remove();
    return;
  }

  // close other expanded rows (optional)
  document.querySelectorAll('.order-details').forEach(r => r.remove());

  db.collection("orders").doc(orderId).get().then(doc => {
    const order = doc.data();

    const html = `
      <tr class="order-details bg-gray-50">
        <td colspan="4" class="p-4">
          <div class="space-y-2">
            ${order.items.map(i => `
              <div class="flex justify-between text-sm">
                <div>
                  <p class="font-medium text-gray-800">
                    ${getProductName(i.barcode)}
                  </p>
                  <p class="text-xs text-gray-500">
                    ${getProductCatalog(i.barcode)}
                  </p>
                  <p class="text-xs text-gray-500">
                    ${i.price}
                  </p>
                </div>
                <span class="font-semibold">
                  x${i.qty}
                </span>
              </div>
            `).join('')}
          </div>
        </td>
      </tr>
    `;

    element.insertAdjacentHTML('afterend', html);
  });
}


function getProductName(barcode) {
  return INVENTORY_BY_BARCODE[barcode]?.name || `Unknown (${barcode})`;
}
let CUSTOMER_ALIASES = Object.create(null);
let CUSTOMER_PROFILES = Object.create(null);
let customerAliasesLoading = null;
let currentCustomerAccount = '';
let editingCustomerAccount = '';

function normalizeCustomerEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function loadCustomerAliases() {
  if (customerAliasesLoading) return customerAliasesLoading;
  customerAliasesLoading = db.collection('customerAliases').get().then(snapshot => {
    // Publish a complete snapshot; never expose an empty map during a request.
    const aliases = Object.create(null);
    const profiles = Object.create(null);
    snapshot.forEach(doc => {
      const key = normalizeCustomerEmail(doc.id);
      const data = doc.data();
      if (data.primary) aliases[key] = normalizeCustomerEmail(data.primary);
      if (data.profile) profiles[key] = data.profile;
    });
    CUSTOMER_ALIASES = aliases;
    CUSTOMER_PROFILES = profiles;
  }).finally(() => { customerAliasesLoading = null; });
  return customerAliasesLoading;
}

async function refreshCustomerAliases() {
  if (customerAliasesLoading) await customerAliasesLoading;
  await loadCustomerAliases();
}

function resolveCustomerEmail(email) {
  let current = normalizeCustomerEmail(email);
  const visited = [];
  while (current && CUSTOMER_ALIASES[current] && CUSTOMER_ALIASES[current] !== current) {
    const cycleStart = visited.indexOf(current);
    // Existing cyclic merges still group consistently, whichever alias is used.
    if (cycleStart !== -1) return visited.slice(cycleStart).sort()[0];
    visited.push(current);
    current = CUSTOMER_ALIASES[current];
  }
  return current;
}

function getCustomerDetails(email, fallback = {}) {
  const accountEmail = resolveCustomerEmail(email);
  const profile = CUSTOMER_PROFILES[accountEmail] || Object.entries(CUSTOMER_PROFILES)
    .find(([key]) => resolveCustomerEmail(key) === accountEmail)?.[1] || {};
  return {
    accountEmail,
    name: profile.name ?? fallback.name ?? '',
    email: profile.email || accountEmail,
    phone: profile.phone ?? fallback.phone ?? ''
  };
}

function getCustomerOrders(email) {
  const account = resolveCustomerEmail(email);
  return ordersData.filter(order => resolveCustomerEmail(JSON.parse(order.customer)[0].email) === account);
}

async function buildCustomersFromOrders() {
  await customerDataReady;
  await loadCustomerAliases();
  const customers = Object.create(null);
  ordersData.forEach(order => {
    const original = JSON.parse(order.customer)[0];
    const key = resolveCustomerEmail(original.email);
    if (!key) return;
    if (!customers[key]) customers[key] = {
      ...getCustomerDetails(key, original), totalOrders: 0, totalAmount: 0, totalPaid: 0
    };
    customers[key].totalOrders += 1;
    customers[key].totalAmount += Number(original.orderTotal || 0);
  });
  paymentsData.forEach(payment => {
    const key = resolveCustomerEmail(payment.email);
    if (customers[key]) customers[key].totalPaid += Number(payment.amount || 0);
  });
  return customers;
}

function customerAction(label, className, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = `${className} text-white px-3 py-1 rounded text-sm`;
  button.onclick = action;
  return button;
}

async function renderCustomers() {
  const tbody = document.querySelector('#customersTable tbody');
  try {
    const customers = Object.values(await buildCustomersFromOrders());
    // Replace rows after loading, so concurrent renders cannot append duplicates.
    tbody.replaceChildren();
    let totalOrders = 0, totalPaid = 0, totalBalance = 0;
    customers.forEach(customer => {
      const balance = customer.totalAmount - customer.totalPaid;
      totalOrders += customer.totalOrders;
      totalPaid += customer.totalPaid;
      totalBalance += balance;
      const row = document.createElement('tr');
      const values = [customer.name, customer.email, customer.phone, customer.totalOrders,
        `₪${customer.totalAmount.toFixed(2)}`, `₪${customer.totalPaid.toFixed(2)}`, `₪${balance.toFixed(2)}`];
      values.forEach((value, index) => {
        const cell = document.createElement('td');
        cell.className = `p-3 ${index === 5 ? 'text-green-600' : index === 6 && balance > 0 ? 'text-red-600 font-semibold' : ''}`;
        cell.textContent = value;
        if (index === 1 || index === 2) cell.dir = 'ltr';
        row.appendChild(cell);
      });
      const actions = document.createElement('td');
      actions.className = 'p-3 flex flex-wrap gap-2';
      actions.append(
        customerAction('עריכת לקוח', 'bg-blue-700', () => openEditCustomerModal(customer.accountEmail)),
        customerAction('הוסף תשלום', 'bg-blue-600', () => openPaymentModal(customer.accountEmail, customer.name)),
        customerAction('הצג הזמנות', 'bg-gray-700', () => openOrdersModal(customer.accountEmail, customer.name)),
        customerAction('מיזוג לקוח', 'bg-purple-600', () => openMergeCustomerModal(customer.accountEmail, customer.name))
      );
      row.appendChild(actions);
      tbody.appendChild(row);
    });
    document.getElementById('customersTotalCount').innerText = customers.length;
    document.getElementById('customersTotalOrders').innerText = totalOrders;
    document.getElementById('customersTotalPaid').innerText = `₪${totalPaid.toFixed(2)}`;
    document.getElementById('customersTotalBalance').innerText = `₪${totalBalance.toFixed(2)}`;
  } catch (error) {
    console.error('Customer loading failed:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-red-600">לא ניתן לטעון את הלקוחות. נסו שוב.</td></tr>';
  }
}

async function openOrdersModal(email) {
  const customers = await buildCustomersFromOrders();
  const account = resolveCustomerEmail(email);
  const customer = customers[account];
  if (!customer) return;
  currentCustomerAccount = account;
  currentCustomerOrders = getCustomerOrders(account);
  document.getElementById('ordersDateFrom').value = '';
  document.getElementById('ordersDateTo').value = '';
  document.getElementById('ordersModalTitle').textContent = `הזמנות - ${customer.name} (${currentCustomerOrders.length})`;
  renderCustomerOrders(currentCustomerOrders);
  document.getElementById('ordersModal').classList.remove('hidden');
  document.getElementById('ordersModal').classList.add('flex');
}

async function openEditCustomerModal(email) {
  const customers = await buildCustomersFromOrders();
  const account = resolveCustomerEmail(email);
  const customer = customers[account];
  if (!customer) return;
  editingCustomerAccount = account;
  document.getElementById('editCustomerName').value = customer.name;
  document.getElementById('editCustomerEmail').value = customer.email;
  document.getElementById('editCustomerPhone').value = customer.phone;
  document.getElementById('editCustomerError').textContent = '';
  document.getElementById('editCustomerModal').classList.remove('hidden');
}

function closeEditCustomerModal() {
  if (saveCustomerDetails.busy) return;
  document.getElementById('editCustomerModal').classList.add('hidden');
  editingCustomerAccount = '';
}

async function saveCustomerDetails(event) {
  event.preventDefault();
  if (saveCustomerDetails.busy || !editingCustomerAccount) return;
  const errorLabel = document.getElementById('editCustomerError');
  const name = document.getElementById('editCustomerName').value.trim();
  const email = normalizeCustomerEmail(document.getElementById('editCustomerEmail').value);
  const phone = document.getElementById('editCustomerPhone').value.trim();
  if (!name || !/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email)) {
    errorLabel.textContent = 'יש להזין שם וכתובת אימייל תקינה.';
    return;
  }
  saveCustomerDetails.busy = true;
  const button = document.getElementById('saveCustomerDetailsBtn');
  button.disabled = true;
  errorLabel.textContent = '';
  let saved = false;
  try {
    const customers = await buildCustomersFromOrders();
    const account = resolveCustomerEmail(editingCustomerAccount);
    const target = resolveCustomerEmail(email);
    if (target !== account && (customers[target] || CUSTOMER_ALIASES[email] || CUSTOMER_PROFILES[email])) {
      throw new Error('האימייל כבר משויך ללקוח אחר. יש למזג את הלקוחות לפני שינוי האימייל.');
    }
    const collection = db.collection('customerAliases');
    const accountRef = collection.doc(account);
    const emailRef = collection.doc(email);
    await db.runTransaction(async transaction => {
      const accountDoc = await transaction.get(accountRef);
      const emailDoc = email === account ? accountDoc : await transaction.get(emailRef);
      if (accountDoc.data()?.primary && resolveCustomerEmail(accountDoc.data().primary) !== account) {
        throw new Error('הלקוח מוזג בזמן העריכה. יש לפתוח את פרטי הלקוח מחדש.');
      }
      if (email !== account && emailDoc.exists && (!emailDoc.data().primary || resolveCustomerEmail(emailDoc.data().primary) !== account)) {
        throw new Error('האימייל כבר משויך ללקוח אחר. יש למזג את הלקוחות תחילה.');
      }
      transaction.set(accountRef, {
        primary: account, profile: { name, email, phone }, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      // Keep the account key stable and link future orders using the corrected email.
      if (email !== account) transaction.set(emailRef, {
        primary: account, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    saved = true;
    await refreshCustomerAliases();
    await renderCustomers();
    if (currentCustomerAccount && resolveCustomerEmail(currentCustomerAccount) === account) {
      await openOrdersModal(account);
    }
  } catch (error) {
    console.error('Customer update failed:', error);
    errorLabel.textContent = saved ? 'הפרטים נשמרו, אך התצוגה לא התעדכנה. רעננו את הדף.' :
      (error.message?.startsWith('האימייל') || error.message?.startsWith('הלקוח') ? error.message : 'שמירת הפרטים נכשלה. נסו שוב.');
  } finally {
    saveCustomerDetails.busy = false;
    button.disabled = false;
  }
  if (saved && !errorLabel.textContent) closeEditCustomerModal();
}

async function submitCustomerMerge() {
  if (submitCustomerMerge.busy) return;
  submitCustomerMerge.busy = true;
  showLoading('ממזג לקוחות...');
  try {
    await loadCustomerAliases();
    const primary = resolveCustomerEmail(CURRENT_MERGE_PRIMARY);
    const secondary = resolveCustomerEmail(document.getElementById('mergeSecondary').value);
    if (!primary || !secondary || primary === secondary) throw new Error('בחרו לקוח אחר למיזוג.');
    const primaryRef = db.collection('customerAliases').doc(primary);
    const secondaryRef = db.collection('customerAliases').doc(secondary);
    await db.runTransaction(async transaction => {
      const primaryDoc = await transaction.get(primaryRef);
      const secondaryDoc = await transaction.get(secondaryRef);
      if ((primaryDoc.data()?.primary && normalizeCustomerEmail(primaryDoc.data().primary) !== primary) ||
          (secondaryDoc.data()?.primary && normalizeCustomerEmail(secondaryDoc.data().primary) !== secondary)) {
        throw new Error('פרטי המיזוג השתנו. רעננו את הדף ונסו שוב.');
      }
      transaction.set(secondaryRef, { primary, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    await refreshCustomerAliases();
    await renderCustomers();
    if (currentCustomerAccount) await openOrdersModal(currentCustomerAccount);
    closeMergeCustomerModal();
  } catch (error) {
    console.error('Customer merge failed:', error);
    alert(error.message?.includes('מיזוג') ? error.message : 'שגיאה במיזוג הלקוחות. נסו שוב.');
  } finally {
    submitCustomerMerge.busy = false;
    hideLoading();
  }
}


// modal perr customers 
function renderCustomerOrders(orders) {
  const tbody = document.getElementById('customerOrdersTable');
  tbody.replaceChildren();
  let total = 0;
  orders.forEach(order => {
    const customer = JSON.parse(order.customer)[0];
    const orderTotal = Number(customer.orderTotal || 0);
    total += orderTotal;
    const row = document.createElement('tr');
    [new Date(order.created).toLocaleDateString('he-IL'), order.orderId, order.items.length, `₪${orderTotal.toFixed(2)}`].forEach(value => {
      const cell = document.createElement('td');
      cell.className = 'p-2';
      cell.textContent = value;
      row.appendChild(cell);
    });
    const actions = document.createElement('td');
    actions.className = 'p-2 flex gap-2';
    actions.append(
      customerAction('פרטי הזמנה', 'bg-gray-700', () => viewOrderDetailsModal(order.orderId)),
      customerAction('שלח מייל', 'bg-blue-600', () => openResendEmailModal(order.orderId, customer.email))
    );
    row.appendChild(actions);
    tbody.appendChild(row);
  });
  document.getElementById('customerOrdersTotal').textContent = `₪${total.toFixed(2)}`;
}

function filterCustomerOrders(){

  const from = new Date(document.getElementById("ordersDateFrom").value);
  const to = new Date(document.getElementById("ordersDateTo").value);

  const filtered = currentCustomerOrders.filter(order => {

    const d = new Date(order.created);

    if(from && d < from) return false;
    if(to && d > to) return false;

    return true;

  });

  renderCustomerOrders(filtered);
}

function closeOrdersModal(){
  document.getElementById("ordersModal").classList.add("hidden");
}

// Render Hebrew with the browser's bidi/font engine before embedding each page.
// This avoids jsPDF's built-in Latin-only font and needs no extra CDN/font files.
function customerStatementCents(value) {
  const number = Number(value == null || value === '' ? 0 : value);
  if (!Number.isFinite(number)) throw new Error('Invalid statement amount');
  return Math.round(number * 100);
}

function customerStatementItems(order) {
  let source = order.items;
  if (typeof source === 'string') source = JSON.parse(source);
  const entries = [];
  const visit = value => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    if ('barcode' in value || 'amount' in value || 'qty' in value || 'quantity' in value) {
      entries.push([value.barcode || value.sku || '', value]);
    } else {
      Object.entries(value).forEach(([barcode, item]) => {
        if (item && typeof item === 'object') entries.push([barcode, item]);
      });
    }
  };
  visit(source);
  return entries.map(([barcode, item]) => {
    const quantity = item.amount ?? item.qty ?? item.quantity;
    const qty = quantity == null || quantity === '' ? null : Number(quantity);
    if (qty !== null && !Number.isFinite(qty)) throw new Error('Invalid item quantity');
    const unitCents = item.price == null || item.price === '' ? null : customerStatementCents(item.price);
    const totalCents = item.total == null || item.total === ''
      ? (qty !== null && unitCents !== null ? Math.round(qty * unitCents) : null)
      : customerStatementCents(item.total);
    return {
      barcode: String(barcode),
      name: String(item.name || item.productName || INVENTORY_BY_BARCODE[barcode]?.name || barcode || 'פריט ללא שם'),
      qty, unitCents, totalCents
    };
  });
}

function buildCustomerStatement(orders, payments) {
  if (!orders.length) throw new Error('No customer orders');
  if (!Array.isArray(payments)) throw new Error('Payments could not be loaded');
  const customer = JSON.parse(orders[0].customer)[0];
  const email = resolveCustomerEmail(customer.email);
  if (!email) throw new Error('Missing customer email');
  const rows = orders.map(order => ({
    id: String(order.orderId || ''),
    date: order.created,
    status: order.status,
    items: customerStatementItems(order),
    cents: customerStatementCents(JSON.parse(order.customer)[0].orderTotal)
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
  const total = rows.reduce((sum, row) => sum + row.cents, 0);
  const paid = payments
    .filter(payment => resolveCustomerEmail(payment.email) === email)
    .reduce((sum, payment) => sum + customerStatementCents(payment.amount), 0);
  const details = getCustomerDetails(email, customer);
  return { name: details.name || details.email, email: details.email, rows, total, paid, balance: total - paid };
}

function createCustomerStatementPDF(statement) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: 'Customer account statement', subject: 'Orders, payments and balance', creator: 'KAFTOR Admin' });
  const money = cents => new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: 'ILS', minimumFractionDigits: 2
  }).format(cents / 100);
  const date = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('he-IL');
  };
  const issued = date(new Date());
  const canvas = document.createElement('canvas');
  canvas.width = 794 * 3;
  canvas.height = 1123 * 3;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering is unavailable');
  ctx.scale(3, 3);
  const box = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const text = (value, x, y, size = 14, color = '#172b4d', align = 'right', width = 690, bold = false, direction = 'rtl') => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.direction = direction;
    ctx.fillText(String(value), x, y, width);
  };
  const wrapName = value => {
    ctx.font = '13px Arial, sans-serif';
    const lines = [];
    let line = '';
    for (const word of String(value).split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= 304) { line = candidate; continue; }
      if (line) lines.push(line);
      line = '';
      for (const character of word) {
        if (line && ctx.measureText(line + character).width > 304) { lines.push(line); line = ''; }
        line += character;
      }
    }
    if (line || !lines.length) lines.push(line);
    return lines;
  };
  // Layout first, then render: page counts are accurate and item rows never clip.
  const pages = [[]];
  let layoutY = 413;
  const nextPage = () => { pages.push([]); layoutY = 177; };
  statement.rows.forEach(order => {
    const items = order.items.length ? order.items : [{name: 'לא נרשם פירוט פריטים להזמנה זו', barcode: '', qty: null, unitCents: null, totalCents: null}];
    const printable = items.flatMap(item => {
      const lines = wrapName(item.name);
      const parts = [];
      for (let offset = 0; offset < lines.length; offset += 12) {
        const part = lines.slice(offset, offset + 12);
        parts.push({...item, lines: part, continuation: offset > 0, height: Math.max(44, part.length * 17 + 24)});
      }
      return parts;
    });
    let offset = 0;
    while (offset < printable.length) {
      // Reserve the order heading, column labels, subtotal and spacing.
      if (layoutY + 66 + printable[offset].height + 46 > 1028) nextPage();
      const start = offset;
      let height = 0;
      while (offset < printable.length && layoutY + 66 + height + printable[offset].height + 46 <= 1028) {
        height += printable[offset].height;
        offset++;
      }
      const complete = offset === printable.length;
      pages[pages.length - 1].push({order, items: printable.slice(start, offset), continued: start > 0, complete});
      layoutY += 66 + height + 46;
      if (!complete) nextPage();
    }
  });

  pages.forEach((blocks, pageIndex) => {
    box(0, 0, 794, 1123, '#ffffff');
    box(0, 0, 794, 10, '#2563eb');
    text('KAFTOR', 48, 48, 17, '#2563eb', 'left', 180, true, 'ltr');
    text('כרטסת לקוח', 746, 52, 28, '#172b4d', 'right', 460, true);
    text(`תאריך הפקה: ${issued}`, 746, 89, 12, '#64748b');
    let tableY = 177;
    if (pageIndex === 0) {
      box(48, 116, 698, 82, '#f1f5f9');
      text(statement.name, 728, 142, 21, '#172b4d', 'right', 660, true);
      text(statement.email, 728, 176, 13, '#64748b', 'right', 660, false, 'ltr');
      const cards = [
        { x: 520, label: 'סה״כ הזמנות', value: statement.total, color: '#172b4d', bg: '#f1f5f9' },
        { x: 284, label: 'סה״כ שולם', value: statement.paid, color: '#047857', bg: '#ecfdf5' },
        { x: 48, label: statement.balance < 0 ? 'יתרת זכות' : 'יתרה לתשלום', value: Math.abs(statement.balance), color: statement.balance > 0 ? '#b91c1c' : '#047857', bg: statement.balance > 0 ? '#fef2f2' : '#ecfdf5' }
      ];
      cards.forEach(card => {
        box(card.x, 218, 226, 92, card.bg);
        text(card.label, card.x + 210, 243, 14, '#64748b', 'right', 194);
        text(money(card.value), card.x + 210, 280, 25, card.color, 'right', 194, true);
      });
      text('סיכום החשבון כולל את כל הזמנות הלקוח ואת כל התשלומים שנרשמו.', 746, 336, 12, '#64748b');
      text('התשלומים משויכים ללקוח ולא להזמנה מסוימת. כל הסכומים בש״ח.', 746, 357, 12, '#64748b');
      text(`פירוט הזמנות (${statement.rows.length})`, 746, 390, 18, '#172b4d', 'right', 650, true);
      tableY = 413;
    } else {
      text(`${statement.name} | פירוט הזמנות - המשך`, 746, 137, 18, '#172b4d', 'right', 690, true);
    }
    blocks.forEach(block => {
      const { order } = block;
      const status = ({ APPROVED: 'מאושרת', PENDING: 'ממתינה', CANCELLED: 'מבוטלת', RETURNED: 'החזרה' })[order.status] || order.status || '-';
      box(48, tableY, 698, 36, '#e8eef8');
      text(`הזמנה ${order.id}${block.continued ? ' (המשך)' : ''}`, 728, tableY + 18, 14, '#172b4d', 'right', 410, true);
      text(`${date(order.date)} | ${status}`, 66, tableY + 18, 12, '#475569', 'left', 230);
      tableY += 36;
      box(48, tableY, 698, 30, '#172b4d');
      const columns = [
        {x:728, width:310, label:'מוצר / ברקוד'},
        {x:388, width:68, label:'כמות'},
        {x:294, width:100, label:'מחיר ליחידה'},
        {x:172, width:106, label:'סה״כ לפריט'}
      ];
      columns.forEach(col => text(col.label, col.x, tableY + 15, 12, '#ffffff', 'right', col.width, true));
      tableY += 30;
      block.items.forEach((item, index) => {
        box(48, tableY, 698, item.height, index % 2 ? '#ffffff' : '#f8fafc');
        item.lines.forEach((line, lineIndex) => text(line, 728, tableY + 15 + lineIndex * 17, 13, '#172b4d', 'right', 310));
        if (item.barcode) text(`${item.barcode}${item.continuation ? ' (...)' : ''}`, 728, tableY + item.height - 10, 10, '#64748b', 'right', 310, false, 'ltr');
        if (!item.continuation) {
          const values = [item.qty === null ? '-' : new Intl.NumberFormat('he-IL', {maximumFractionDigits: 4}).format(item.qty), item.unitCents === null ? '-' : money(item.unitCents), item.totalCents === null ? '-' : money(item.totalCents)];
          values.forEach((value, index) => text(value, columns[index + 1].x, tableY + item.height / 2, 13, '#172b4d', 'right', columns[index + 1].width, index === 2));
        }
        box(48, tableY + item.height - 1, 698, 1, '#e2e8f0');
        tableY += item.height;
      });
      if (block.complete) {
        box(48, tableY, 698, 32, '#eff6ff');
        text('סה״כ להזמנה', 728, tableY + 16, 13, '#172b4d', 'right', 310, true);
        text(money(order.cents), 172, tableY + 16, 14, '#172b4d', 'right', 106, true);
      } else {
        text('המשך פירוט ההזמנה בעמוד הבא', 728, tableY + 16, 11, '#64748b');
      }
      tableY += 46;
    });

    box(48, 1058, 698, 1, '#cbd5e1');
    text(`עמוד ${pageIndex + 1} מתוך ${pages.length}`, 746, 1082, 11, '#64748b');
    text('KAFTOR | סיכום חשבון לקוח', 48, 1082, 11, '#64748b', 'left', 350);
    if (pageIndex) doc.addPage();
    doc.addImage(canvas, 'PNG', 0, 0, 210, 297, `statement-page-${pageIndex}`, 'FAST');
  });
  return doc;
}

async function exportOrdersPDF() {
  if (exportOrdersPDF.busy) return;
  if (!currentCustomerOrders.length) {
    alert('אין הזמנות לייצוא');
    return;
  }
  exportOrdersPDF.busy = true;
  const button = document.querySelector('[onclick="exportOrdersPDF()"]');
  const originalText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = 'מכין PDF...';
  }
  try {
    // Snapshot the selected account before asynchronous work (the modal may change).
    const orders = currentCustomerOrders.slice();
    const payments = await fetchPayments();
    if (!Object.keys(INVENTORY_BY_BARCODE).length) await loadInventoryFromFireBase();
    const statement = buildCustomerStatement(orders, payments);
    if (document.fonts?.ready) await document.fonts.ready;
    const doc = createCustomerStatementPDF(statement);
    const safeName = String(statement.name).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 80);
    doc.save(`customer-statement-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error('Customer statement export failed:', error);
    alert('לא ניתן להפיק את הקובץ. ודאו שנתוני ההזמנות והתשלומים נטענו ונסו שוב.');
  } finally {
    exportOrdersPDF.busy = false;
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function openPaymentModal(email, name) {
  document.getElementById("paymentCustomerEmail").value = email;
  document.getElementById("paymentCustomerName").innerText = name;
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentNote").value = "";

  document.getElementById("paymentModal").classList.remove("hidden");
}

function closePaymentModal() {
  document.getElementById("paymentModal").classList.add("hidden");
}
async function submitPayment() {
  const email = document.getElementById("paymentCustomerEmail").value;
  const amount = Number(document.getElementById("paymentAmount").value);
  const note = document.getElementById("paymentNote").value;
    console.log('hihihih')
  if (!amount || amount <= 0) {
    alert("יש להזין סכום תקין");
    return;
  }

  const payment = {
    email,
    amount,
    note,
    date: new Date().toISOString()
  };
  

  console.log("Send this to sheet:", payment);
  try {
    const response = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({
        action: 'sendPayment',
        payment: payment // Ensure this object contains amount, orderId, etc.
        })
    });

    const result = await response.json();

    if (result.success) {
        alert("נשלח בהצלחה!");
    } else {
        alert("שגיאה: " + result.error);
    }
    } catch (error) {
    console.error("נכשל", error);
    alert("תקלת תקשורת");
    }
  // TODO:
  // sendPaymentToSheet(payment);

  closePaymentModal();
}



function loadInventoryFromFireBase() {
  return db.collection("Inventory")
           .doc("masterInventory")
           .get()
           .then(doc => {

             if (!doc.exists) {
               console.error("masterInventory document does not exist");
               INVENTORY_BY_BARCODE = {};
               return;
             }

             // This is already a clean JS object
             INVENTORY_BY_BARCODE = doc.data();

             console.log("Inventory loaded:", INVENTORY_BY_BARCODE);

           })
           .catch(err => {
             console.error("Failed to load inventory:", err);
           });
}

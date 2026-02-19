
const API = 'https://script.google.com/macros/s/AKfycbyq25w6-wKAgYJM4U33E9YFwTx1XOLaRd0ONwYyZqcZWMyGjjBi4n-MJBAT1nuCbgir/exec';
let ORDER_ITEMS_CACHE = [];
let INVENTORY_CACHE = [];
let INVENTORY_BY_BARCODE = {};


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

        tbody.innerHTML += `
          <tr id="order-${doc.id}"
            class="hover:bg-gray-50 cursor-pointer"
            onclick="toggleOrderDetails('${doc.id}', this)">

            <td class="p-3 font-mono text-xs">${doc.id}</td>
            <td class="p-3">${o.customer}</td>
            <td class="p-3">${o.store}</td>
            <td class="p-3">${o.address}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3">${o.email}</td>
            <td class="p-3 font-semibold text-orange-600">
              ${o.status}
            </td>
            <td class="p-3">
              <button
                class="px-3 py-1 bg-green-600 text-white rounded"
                onclick="approveOrder('${doc.id}')">
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


function loadAllOrders() {
  // showLoading("Loading all orders…");

  fetch(API + '?action=allOrders')
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#allOrdersTable tbody');
      tbody.innerHTML = '';
      ordersData = data
      let test = buildCustomersFromOrders()
      console.log(test)
      console.log(ordersData)
      data.forEach(o => {
        tbody.innerHTML += `
          <tr class="hover:bg-gray-50">
            <td class="p-3">${o.orderId}</td>
            <td class="p-3">${o.customer}</td>
            <td class="p-3">${o.store}</td>
            <td class="p-3">${o.address}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3">${o.email}</td>
            <td class="p-3">
              <span class="px-2 py-1 rounded text-xs font-semibold
                ${o.status === 'APPROVED'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'}">
                ${o.status}
              </span>
            </td>
            <td class="p-3">${new Date(o.created).toLocaleString()}</td>
          </tr>
        `;
      });

      // hideLoading();
    });
    
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


function approveOrder(orderId) {
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
              <p class="font-medium">${price}</p>
              <p class="text-xs text-gray-500">${barcode}</p>
            </div>

            <div class="text-sm w-16 text-center">מלאי: ${stock}</div>
            <div class="text-sm w-16 text-center">סה"כ להזמנה: ${qtyThisOrder}</div>
            <div class="text-sm w-16 text-center">סה"כ לכל ההזמנות: ${qtyAllOrders}</div>

            <input type="number"
                   min="0"
                   max="${qtyThisOrder}"
                   value="${qtyThisOrder}"
                   data-barcode="${barcode}"
                   class="border rounded w-20 p-1 text-right">
          </div>
        `;
      });

      // Checkbox for remaining quantities
      container.innerHTML += `
        <div class="mt-2 flex items-center gap-2">
          <input type="checkbox" id="partialRemaining">
          <label for="partialRemaining" class="text-sm">
            Create new order for unapproved quantities
          </label>
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
  const inputs = document.querySelectorAll("#approveItems input[type=number]");
  let element = document .getElementById("approveItems").innerHTML
  const approved = {};
  let total = 0
  inputs.forEach(input => {
    const barcode = input.dataset.barcode;
    const qty = Number(input.value);
    const orderedQty = CURRENT_ORDER_ITEMS.find(i => i.barcode === barcode)?.qty || 0;
    const orderedPrice = CURRENT_ORDER_ITEMS.find(i => i.barcode === barcode)?.price || "₪ 0";
    let price = 0;
    if (typeof orderedPrice === "string") {
      price = orderedPrice.replace("₪", "").trim();
    }

    price = Number(price) || 0;

    if (qty > 0 && qty <= orderedQty){ 
      let sum = qty * parseFloat(price).toFixed(2)
      approved[barcode] = {amount: qty ,price: orderedPrice,total:sum}
      console.log(sum)
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
      customer: [{name:CURRENT_ORDER.customer,email:CURRENT_ORDER.email,orderTotal:total}],
      items: [approved]
    })
  })
  .then(res => res.json())
  .then(result => {
    if (!result.success) throw new Error("Approval failed");
    sendOrderEmail(CURRENT_ORDER.email,element)
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

async function sendOrderEmail(customerEmail, cartHtml) {
  const webAppUrl = "https://script.google.com/macros/s/AKfycbwxofYCGvRz2m17AuH8YDoAGrvs3Kbzw59ouCgd2oK0WBYV3rFpXGgUI_DmKQT1T0IVfA/exec";

  const payload = {
    email: customerEmail,
    htmlBody: `<h1>Order Summary</h1>${cartHtml}<p>Contact: ${customerEmail}</p>`
  };

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      cache: 'no-cache',
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

loadAllOrders();

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

  const btnInv = document.getElementById('tabInventory');
  const btnOrd = document.getElementById('tabOrders');
  const btnAllOrd = document.getElementById('tabAllOrders');
  const btnCst = document.getElementById("tabCustomers");

  // hide all sections
  inventory.classList.add('hidden');
  orders.classList.add('hidden');
  allOrders.classList.add('hidden');
  customers.classList.add("hidden");

  // reset all buttons
  [btnInv, btnOrd,btnCst, btnAllOrd].forEach(btn => {
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


function toggleOrderDetails(orderId, rowEl) {
  const existing = rowEl.nextElementSibling;
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
                    ${i.barcode}
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

    rowEl.insertAdjacentHTML('afterend', html);
  });
}


function getProductName(barcode) {
  return INVENTORY_BY_BARCODE[barcode]?.name || `Unknown (${barcode})`;
}

// CUSTUMER ADN KOKRDER SUMMERRY RENDERING LOGIC
function buildCustomersFromOrders() {
  const customersMap = {};

  ordersData.forEach(order => {
    customer = JSON.parse(order.customer)
    customer = customer[0]
    const email = customer.email?.toLowerCase()||false;
    if (!email) return;
  
    if (!customersMap[email]) {
      customersMap[email] = {
        name: customer.name || "",
        email: email,
        phone: customer.phone || "",
        totalOrders: 0,
        totalAmount: 0,
        totalPaid: 0
      };
    }

    customersMap[email].totalOrders += 1;
    customersMap[email].totalAmount += Number(customer.orderTotal || 0);
  });

  // Add payments
  paymentsData.forEach(payment => {
    const email = payment.email?.toLowerCase();
    if (!customersMap[email]) return;

    customersMap[email].totalPaid += Number(payment.amount || 0);
  });

  return customersMap;
}

function renderCustomers() {
  
  const tbody = document.querySelector("#customersTable tbody");
  tbody.innerHTML = "";
  
  const customersMap = buildCustomersFromOrders();
  const customers = Object.values(customersMap);
  
  let totalCustomers = customers.length;
  let totalOrders = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  customers.forEach(customer => {

    const balance = customer.totalAmount - customer.totalPaid;

    totalOrders += customer.totalOrders;
    totalPaid += customer.totalPaid;
    totalBalance += balance;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="p-3">${customer.name}</td>
      <td class="p-3">${customer.email}</td>
      <td class="p-3">${customer.phone}</td>
      <td class="p-3">${customer.totalOrders}</td>
      <td class="p-3">₪${customer.totalAmount.toFixed(2)}</td>
      <td class="p-3 text-green-600">₪${customer.totalPaid.toFixed(2)}</td>
      <td class="p-3 ${balance > 0 ? 'text-red-600 font-semibold' : ''}">
        ₪${balance.toFixed(2)}
      </td>
      <td class="p-3">
        <button onclick="openPaymentModal('${customer.email}', '${customer.name}')"
          class="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          הוסף תשלום
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Update summary cards
  document.getElementById("customersTotalCount").innerText = totalCustomers;
  document.getElementById("customersTotalOrders").innerText = totalOrders;
  document.getElementById("customersTotalPaid").innerText = `₪${totalPaid.toFixed(2)}`;
  document.getElementById("customersTotalBalance").innerText = `₪${totalBalance.toFixed(2)}`;
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
function submitPayment() {
  const email = document.getElementById("paymentCustomerEmail").value;
  const amount = Number(document.getElementById("paymentAmount").value);
  const note = document.getElementById("paymentNote").value;

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

  // TODO:
  // sendPaymentToSheet(payment);

  closePaymentModal();
}








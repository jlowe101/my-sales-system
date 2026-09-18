const plansConfig = {
  "GPT K12 Plan": [600, 500],
  "Gemini AI Pro 18m": [200, 80]
};

const planSelect = document.getElementById("planSelect");
const priceSelect = document.getElementById("priceSelect");
const quantityInput = document.getElementById("quantity");
const deductCheckbox = document.getElementById("deductInvestment");
const previewTotal = document.getElementById("previewTotal");
const saleForm = document.getElementById("saleForm");
const salesTableBody = document.getElementById("salesTableBody");

const grossRevenueEl = document.getElementById("grossRevenue");
const netProfitEl = document.getElementById("netProfit");

let allSales = [];

// Populate prices dynamically based on plan
planSelect.addEventListener("change", (e) => {
  const plan = e.target.value;
  priceSelect.innerHTML = "";

  if (plan && plansConfig[plan]) {
    priceSelect.disabled = false;
    plansConfig[plan].forEach((price) => {
      const option = document.createElement("option");
      option.value = price;
      option.textContent = `${price} PHP`;
      priceSelect.appendChild(option);
    });
  } else {
    priceSelect.disabled = true;
    priceSelect.innerHTML = '<option value="">-- Select Plan First --</option>';
  }
  updatePreview();
});

quantityInput.addEventListener("input", updatePreview);
priceSelect.addEventListener("change", updatePreview);

function updatePreview() {
  const price = Number(priceSelect.value) || 0;
  const qty = Number(quantityInput.value) || 0;
  previewTotal.textContent = `${price * qty} PHP`;
}

// Calculate totals and render table
function renderData() {
  salesTableBody.innerHTML = "";

  if (allSales.length === 0) {
    salesTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No sales recorded yet.</td></tr>';
    grossRevenueEl.textContent = "0 PHP";
    netProfitEl.textContent = "0 PHP";
    return;
  }

  let totalGross = 0;

  allSales.forEach((sale) => {
    totalGross += sale.totalAmount;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sale.planName}</td>
      <td>${sale.variantPrice} PHP</td>
      <td>${sale.quantity}</td>
      <td>${sale.totalAmount} PHP</td>
      <td>${new Date(sale.createdAt).toLocaleDateString()}</td>
    `;
    salesTableBody.appendChild(row);
  });

  const shouldDeduct = deductCheckbox.checked;
  const net = shouldDeduct ? totalGross - 500 : totalGross;

  grossRevenueEl.textContent = `${totalGross} PHP`;
  netProfitEl.textContent = `${net} PHP`;
}

deductCheckbox.addEventListener("change", renderData);

// Fetch sales records from the API
async function loadSales() {
  try {
    const res = await fetch("/api/sales");
    const data = await res.json();
    if (data.success) {
      allSales = data.sales;
      renderData();
    }
  } catch (err) {
    console.warn("Could not reach backend; using local memory preview.", err);
  }
}

// Submit sale to API
saleForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const planName = planSelect.value;
  const variantPrice = Number(priceSelect.value);
  const quantity = Number(quantityInput.value);
  const totalAmount = variantPrice * quantity;
  const deductInvestment = deductCheckbox.checked;

  const payload = {
    planName,
    variantPrice,
    quantity,
    totalAmount,
    deductInvestment
  };

  try {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      allSales.unshift({ ...payload, createdAt: new Date() });
      renderData();
      saleForm.reset();
      priceSelect.disabled = true;
      priceSelect.innerHTML = '<option value="">-- Select Plan First --</option>';
      updatePreview();
    }
  } catch (err) {
    console.error("Failed to save sale:", err);
  }
});

loadSales();
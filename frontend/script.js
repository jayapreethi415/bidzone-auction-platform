async function registerUser() {
  try {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const response = await fetch("http://localhost:5050/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await response.json();
    alert(data.message);

    if (response.ok) window.location.href = "login.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function loginUser() {
  try {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch("http://localhost:5050/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    alert(data.message);

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function createAuction() {
  try {
    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const startingBid = document.getElementById("startingBid").value;
    const image = document.getElementById("image").value;
    const endTime = document.getElementById("endTime").value;

    if (!title || !category || !description || !startingBid || !image || !endTime) {
      alert("Please fill all fields");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    const response = await fetch("http://localhost:5050/api/auctions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        description,
        startingBid,
        currentBid: startingBid,
        image,
        seller: user ? user.name : "Unknown",
        endTime
      })
    });

    const data = await response.json();
    alert(data.message);

    if (response.ok) window.location.reload();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function loadAuctions() {
  const response = await fetch("http://localhost:5050/api/auctions");
  const auctions = await response.json();

  const auctionList = document.getElementById("auctionList");
  if (!auctionList) return;

  const user = JSON.parse(localStorage.getItem("user"));

  const searchValue =
    document.getElementById("searchInput")?.value.toLowerCase().trim() || "";

  const selectedCategory =
    document.getElementById("filterCategory")?.value.toLowerCase().trim() || "all";

  const filteredAuctions = auctions.filter((auction) => {
    const title = (auction.title || "").toLowerCase();
    const category = (auction.category || "general").toLowerCase();

    const matchesSearch = title.includes(searchValue);
    const matchesCategory =
      selectedCategory === "all" ||
      selectedCategory === "all categories" ||
      category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  auctionList.innerHTML = "";

  if (filteredAuctions.length === 0) {
    auctionList.innerHTML = "<h3>No auctions found</h3>";
    return;
  }

  filteredAuctions.forEach((auction) => {
    auctionList.innerHTML += `
      <div class="auction-card">
        <img src="${auction.image}" alt="${auction.title}">
        <h3>${auction.title}</h3>
        <p class="category-badge">${auction.category || "General"}</p>
        <p>${auction.description}</p>
        <h2>₹${auction.currentBid}</h2>
        <p>Seller: ${auction.seller}</p>
        <p class="timer" data-end="${auction.endTime}"></p>
        <div class="winner" data-end="${auction.endTime}" data-winner="${auction.highestBidder || ""}"></div>

        ${
          user?.name === auction.highestBidder
            ? `<p style="color:green;font-weight:bold;">⭐ You are highest bidder</p>`
            : ""
        }

        <button class="bid-btn" data-end="${auction.endTime}" onclick="placeBid('${auction._id}', ${auction.currentBid})">Place Bid</button>

        <button onclick="toggleWishlist('${auction._id}')">
          ${
            (JSON.parse(localStorage.getItem("wishlist")) || []).includes(auction._id)
              ? "❤️ Saved"
              : "♡ Add to Wishlist"
          }
       </button>
      </div>
    `;
  });

  startCountdowns();
  updateClosedAuctions();
}

async function placeBid(auctionId, currentBid) {
  const bidAmount = prompt(`Current bid is ₹${currentBid}. Enter your bid:`);
  if (!bidAmount) return;

  const user = JSON.parse(localStorage.getItem("user"));

  const response = await fetch(`http://localhost:5050/api/auctions/bid/${auctionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bidAmount,
      bidderName: user ? user.name : "Unknown"
    })
  });

  const data = await response.json();
  alert(data.message);

  if (response.ok) window.location.reload();
}

async function loadMyBids() {
  const response = await fetch("http://localhost:5050/api/auctions");
  const auctions = await response.json();

  const myBidsList = document.getElementById("myBidsList");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!myBidsList || !user) return;

  const myBids = auctions.filter(
    (auction) => auction.highestBidder === user.name
  );

  myBidsList.innerHTML = "";

  myBids.forEach((auction) => {
    myBidsList.innerHTML += `
      <div class="auction-card">
        <img src="${auction.image}" alt="${auction.title}">
        <h3>${auction.title}</h3>
        <p>${auction.description}</p>
        <h2>Your Bid: ₹${auction.currentBid}</h2>
        <p>Seller: ${auction.seller}</p>
      </div>
    `;
  });
}

function startCountdowns() {
  const timers = document.querySelectorAll(".timer");

  timers.forEach((timer) => {
    const endTime = new Date(timer.getAttribute("data-end")).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const distance = endTime - now;

      if (distance <= 0) {
        timer.innerText = "Auction Closed";
        timer.style.color = "red";
        clearInterval(interval);
        updateClosedAuctions();
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      timer.innerText = `⏳ Ends in: ${hours}h ${minutes}m ${seconds}s`;
      timer.style.color = "#2563eb";
      timer.style.fontWeight = "bold";
    }, 1000);
  });
}

function updateClosedAuctions() {
  const winners = document.querySelectorAll(".winner");
  const buttons = document.querySelectorAll(".bid-btn");

  winners.forEach((winner) => {
    const endTime = new Date(winner.getAttribute("data-end")).getTime();
    const winnerName = winner.getAttribute("data-winner");

    if (Date.now() >= endTime) {
      winner.innerText = winnerName
        ? `🏆 Winner: ${winnerName}`
        : "🏆 No bids placed";

      winner.style.color = "#16a34a";
      winner.style.fontWeight = "bold";
    }
  });

  buttons.forEach((button) => {
    const endTime = new Date(button.getAttribute("data-end")).getTime();

    if (Date.now() >= endTime) {
      button.innerText = "Bidding Closed";
      button.disabled = true;
      button.style.background = "gray";
      button.style.cursor = "not-allowed";
    }
  });
}

function controlAuctionForm() {
  const user = JSON.parse(localStorage.getItem("user"));
  const auctionForm = document.getElementById("auctionForm");

  if (!auctionForm) return;

  if (!user || user.role !== "seller") {
    auctionForm.style.display = "none";
  }
}

async function loadMyAuctions() {
  const response = await fetch("http://localhost:5050/api/auctions");
  const auctions = await response.json();

  const myAuctionsList = document.getElementById("myAuctionsList");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!myAuctionsList || !user) return;

  const myAuctions = auctions.filter(
    (auction) => auction.seller === user.name
  );

  myAuctionsList.innerHTML = "";

  if (myAuctions.length === 0) {
    myAuctionsList.innerHTML = "<h3>No auctions created yet</h3>";
    return;
  }

  myAuctions.forEach((auction) => {
    myAuctionsList.innerHTML += `
      <div class="auction-card">
        <img src="${auction.image}" alt="${auction.title}">
        <h3>${auction.title}</h3>
        <p class="category-badge">${auction.category || "General"}</p>
        <p>${auction.description}</p>
        <h2 class="my-auction-price">Current Bid: ₹${auction.currentBid}</h2>
        <p>🏆 Highest Bidder: ${auction.highestBidder || "No bids yet"}</p>
        <p class="timer" data-end="${auction.endTime}"></p>
        <div class="winner" data-end="${auction.endTime}" data-winner="${auction.highestBidder || ""}"></div>

        <button onclick="editAuction(
          '${auction._id}',
          '${auction.title}',
          '${auction.description}',
          '${auction.startingBid}',
          '${auction.image}'
        )">Edit</button>

        <button onclick="deleteAuction('${auction._id}')">Delete Auction</button>
      </div>
    `;
  });

  startCountdowns();
}

async function deleteAuction(auctionId) {
  const confirmDelete = confirm("Are you sure you want to delete this auction?");
  if (!confirmDelete) return;

  const response = await fetch(`http://localhost:5050/api/auctions/${auctionId}`, {
    method: "DELETE"
  });

  const data = await response.json();
  alert(data.message);

  if (response.ok) window.location.reload();
}

async function editAuction(auctionId, oldTitle, oldDescription, oldBid, oldImage) {
  const title = prompt("Enter new title:", oldTitle);
  const description = prompt("Enter new description:", oldDescription);
  const startingBid = prompt("Enter new starting bid:", oldBid);
  const image = prompt("Enter new image URL:", oldImage);

  if (!title || !description || !startingBid || !image) return;

  const response = await fetch(`http://localhost:5050/api/auctions/${auctionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      description,
      startingBid,
      image
    })
  });

  const data = await response.json();
  alert(data.message);

  if (response.ok) window.location.reload();
}
function toggleWishlist(auctionId) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  if (wishlist.includes(auctionId)) {
    wishlist = wishlist.filter(id => id !== auctionId);
    alert("Removed from wishlist");
  } else {
    wishlist.push(auctionId);
    alert("Added to wishlist");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  window.location.reload();
}
async function loadWishlist() {
  const response = await fetch("http://localhost:5050/api/auctions");
  const auctions = await response.json();

  const wishlistList = document.getElementById("wishlistList");
  if (!wishlistList) return;

  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const savedAuctions = auctions.filter((auction) =>
    wishlist.includes(auction._id)
  );

  wishlistList.innerHTML = "";

  if (savedAuctions.length === 0) {
    wishlistList.innerHTML = "<h3>No saved items yet</h3>";
    return;
  }

  savedAuctions.forEach((auction) => {
    wishlistList.innerHTML += `
      <div class="auction-card">
        <img src="${auction.image}" alt="${auction.title}">
        <h3>${auction.title}</h3>
        <p class="category-badge">${auction.category || "General"}</p>
        <p>${auction.description}</p>
        <h2>₹${auction.currentBid}</h2>
        <p>Seller: ${auction.seller}</p>
        <button onclick="toggleWishlist('${auction._id}')">Remove ❤️</button>
      </div>
    `;
  });
}



loadAuctions();
loadMyBids();
controlAuctionForm();
loadMyAuctions();
loadWishlist();
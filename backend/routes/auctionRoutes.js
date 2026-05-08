const express = require("express");
const Auction = require("../models/Auction");

const router = express.Router();

// create auction
router.post("/create", async (req, res) => {
  try {
    const auction = await Auction.create(req.body);

    res.status(201).json({
      message: "Auction created successfully",
      auction
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error
    });
  }
});

// get all auctions
router.get("/", async (req, res) => {
  try {
    const auctions = await Auction.find().sort({ createdAt: -1 });
    res.json(auctions);

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});
// place bid
router.put("/bid/:id", async (req, res) => {
  try {
    const { bidAmount } = req.body;

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (Number(bidAmount) <= auction.currentBid) {
      return res.status(400).json({
        message: "Bid amount must be higher than current bid"
      });
    }

   auction.currentBid = Number(bidAmount);
   auction.highestBidder = req.body.bidderName;
   await auction.save();

    res.json({
      message: "Bid placed successfully",
      auction
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error
    });
  }
});
module.exports = router;
router.put("/:id", async (req, res) => {
  try {
    const updatedAuction = await Auction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Auction updated successfully",
      auction: updatedAuction
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    await Auction.findByIdAndDelete(req.params.id);

    res.json({
      message: "Auction deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
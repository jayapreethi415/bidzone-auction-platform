const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    category: {
      type: String,
      default: "General"
    },

    description: {
      type: String,
      required: true
    },

    startingBid: {
      type: Number,
      required: true
    },

    currentBid: {
      type: Number,
      default: 0
    },

    image: {
      type: String,
      required: true
    },

    seller: {
      type: String
    },

    highestBidder: {
      type: String,
      default: ""
    },

    endTime: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);
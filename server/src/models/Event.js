const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      index: true,
    },

    videoTime: {
      type: Number,
      default: null,
    },

    confusionType: {
      type: String,
      default: null,
      index: true,
    },

    reason: {
      type: String,
      default: null,
    },

    from: {
      type: Number,
      default: null,
    },

    to: {
      type: Number,
      default: null,
    },

    distance: {
      type: Number,
      default: null,
    },

    previousRate: {
      type: Number,
      default: null,
    },

    newRate: {
      type: Number,
      default: null,
    },

    depth: {
      type: String,
      default: null,
    },

    explanation: {
      type: String,
      default: null,
    },

    visualType: {
      type: String,
      default: null,
    },

    visualTitle: {
      type: String,
      default: null,
    },

    keyPoint: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    clientTimestamp: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Event",
  eventSchema
);
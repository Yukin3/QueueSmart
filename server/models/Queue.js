const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    queueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    serviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    organizationId: {
      type: String,
      required: true,
      default: "org-uh",
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "paused", "closed"],
      default: "open",
      index: true,
    },

    currentServingEntryId: {
      type: String,
      default: null,
    },

    averageServiceMinutes: {
      type: Number,
      default: 12,
      min: 1,
    },

    waitTimeMethod: {
      type: String,
      enum: ["basic", "moving-average", "priority-adjusted"],
      default: "basic",
    },

    smartSettings: {
      priorityWeightEnabled: {
        type: Boolean,
        default: true,
      },
      appointmentWindowMinutes: {
        type: Number,
        default: 25,
        min: 0,
      },
      movingAverageSampleSize: {
        type: Number,
        default: 5,
        min: 1,
      },
    },

    stats: {
      totalJoined: {
        type: Number,
        default: 0,
      },
      totalServed: {
        type: Number,
        default: 0,
      },
      totalLeft: {
        type: Number,
        default: 0,
      },
      lastActivityAt: {
        type: Date,
        default: null,
      },
    },

    createdDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Queue", queueSchema);
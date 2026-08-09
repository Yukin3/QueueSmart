const mongoose = require("mongoose");


const queueEntrySchema = new mongoose.Schema(
    {
        entryId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

    // Which service/queue this entry belongs to
    serviceId: {
      type: String,
      required: [true, "Service ID is required."],
      trim: true,
      index: true,
    },

    // User waiting in the queue
    userId: {
      type: String,
      required: [true, "User ID is required."],
      trim: true,
      index: true,
    },

    // Stored so the queue UI can display the user's name
    userName: {
      type: String,
      required: [true, "User name is required."],
      trim: true,
      minlength: [1, "User name cannot be empty."],
      maxlength: [100, "User name cannot exceed 100 characters."],
    },

    // Time the user originally entered the queue
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    /*
      Current state of the queue entry.

      waiting  = currently waiting
      serving  = currently being helped
      served   = completed
      left     = user voluntarily left
      removed  = administrator removed user
      canceled = canceled before service
    */
    status: {
      type: String,
      enum: {
        values: [
          "waiting",
          "serving",
          "served",
          "left",
          "removed",
          "canceled",
        ],
        message: "{VALUE} is not a valid queue status.",
      },
      default: "waiting",
      index: true,
    },

    /*
      How the user entered the queue.

      walk-in     = normal queue entry
      appointment = scheduled appointment
    */
    type: {
      type: String,
      enum: {
        values: ["walk-in", "appointment"],
        message: "{VALUE} is not a valid queue entry type.",
      },
      default: "walk-in",
    },

    /*
      Priority used by the queue sorting logic.

      urgent > high > normal > low
    */
    priority: {
      type: String,
      enum: {
        values: ["low", "normal", "high", "urgent"],
        message: "{VALUE} is not a valid priority.",
      },
      default: "normal",
      index: true,
    },

    // Only normally used when type === "appointment"
    appointmentTime: {
      type: Date,
      default: null,
    },

    /*
      Lets an administrator manually rearrange a queue.

      null means normal automatic ordering should be used.
    */
    manualOrder: {
      type: Number,
      default: null,
      min: [0, "Manual order cannot be negative."],
    },

    // Prevent repeatedly sending "you are next" notifications
    almostNotified: {
      type: Boolean,
      default: false,
    },

    // Time service actually began
    servingStartedAt: {
      type: Date,
      default: null,
    },

    // Time service finished
    servedAt: {
      type: Date,
      default: null,
    },

    // Time user voluntarily left
    leftAt: {
      type: Date,
      default: null,
    },

    // Time administrator removed the user
    removedAt: {
      type: Date,
      default: null,
    },

    // Time an entry was canceled
    canceledAt: {
      type: Date,
      default: null,
    },

    // Optional reason for leaving/removal/cancellation
    exitReason: {
      type: String,
      trim: true,
      maxlength: [500, "Exit reason cannot exceed 500 characters."],
      default: null,
    },

    // Optional notes for administrators
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters."],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


// Prevent the same user from having two active waiting entries
// in the same service at the same time.
queueEntrySchema.index(
  {
    serviceId: 1,
    userId: 1,
    status: 1,
  }
);


// Validate appointment entries
queueEntrySchema.pre("validate", function (next) {
  if (this.type === "appointment" && !this.appointmentTime) {
    this.invalidate(
      "appointmentTime",
      "Appointment time is required for appointment entries."
    );
  }

  next();
});


module.exports = mongoose.model("QueueEntry", queueEntrySchema);


require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const TrafficSignal = require("./models/TrafficSignal");
const LiveTraffic = require("./models/LiveTraffic");
const Alert = require("./models/Alerts");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stms";

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for seeding...");

    // Check if admin user already exists
    let admin = await User.findOne({ email: "admin@stms.ai" });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin@1234", salt);
      admin = await User.create({
        name: "Admin User",
        email: "admin@stms.ai",
        password: hashedPassword,
        role: "admin",
        subscriptionStatus: "active"
      });
      console.log("Created admin user: admin@stms.ai / Admin@1234");
    }

    // Check if operator user already exists
    let demoUser = await User.findOne({ email: "operator@stms.ai" });
    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Operator@1234", salt);
      demoUser = await User.create({
        name: "Traffic Operator",
        email: "operator@stms.ai",
        password: hashedPassword,
        role: "operator",
        subscriptionStatus: "active"
      });
      console.log("Created demo operator: operator@stms.ai / Operator@1234");
    }

    // Seed Traffic Signals if none exist
    const signalCount = await TrafficSignal.countDocuments();
    if (signalCount === 0) {
      const signalData = [
        {
          location: "Oxford St & Regent St",
          city: "London",
          latitude: 51.5152,
          longitude: -0.1419,
          status: "active",
          timer: 60,
          currentPhase: "green",
          congestionLevel: "high",
          vehicleCount: 88,
          avgSpeed: 14
        },
        {
          location: "Piccadilly Circus & Shaftesbury Ave",
          city: "London",
          latitude: 51.5101,
          longitude: -0.1340,
          status: "active",
          timer: 50,
          currentPhase: "red",
          congestionLevel: "medium",
          vehicleCount: 45,
          avgSpeed: 28
        },
        {
          location: "Westminster Bridge & Embankment",
          city: "London",
          latitude: 51.5010,
          longitude: -0.1230,
          status: "active",
          timer: 40,
          currentPhase: "green",
          congestionLevel: "low",
          vehicleCount: 18,
          avgSpeed: 48
        },
        {
          location: "Trafalgar Square & Strand",
          city: "London",
          latitude: 51.5080,
          longitude: -0.1281,
          status: "active",
          timer: 65,
          currentPhase: "yellow",
          congestionLevel: "high",
          vehicleCount: 76,
          avgSpeed: 16
        },
        {
          location: "King's Cross & Euston Rd",
          city: "London",
          latitude: 51.5300,
          longitude: -0.1240,
          status: "active",
          timer: 45,
          currentPhase: "green",
          congestionLevel: "medium",
          vehicleCount: 40,
          avgSpeed: 32
        },
        {
          location: "Broadway & 42nd St (Times Sq)",
          city: "New York",
          latitude: 40.7580,
          longitude: -73.9855,
          status: "active",
          timer: 60,
          currentPhase: "green",
          congestionLevel: "high",
          vehicleCount: 95,
          avgSpeed: 12
        }
      ];

      const createdSignals = await TrafficSignal.insertMany(signalData);
      console.log(`Created ${createdSignals.length} traffic signals`);

      // Seed LiveTraffic for each signal
      const liveData = [
        { signalId: createdSignals[0]._id, vehicleCount: 78 },
        { signalId: createdSignals[1]._id, vehicleCount: 35 },
        { signalId: createdSignals[2]._id, vehicleCount: 12 },
        { signalId: createdSignals[3]._id, vehicleCount: 42 },
        { signalId: createdSignals[4]._id, vehicleCount: 18 }
      ];
      await LiveTraffic.insertMany(liveData);
      console.log("Created LiveTraffic records");

      // Seed Alerts
      const alertData = [
        { signalId: createdSignals[0]._id, message: "Heavy congestion detected during rush hour", severity: "high" },
        { signalId: createdSignals[1]._id, message: "Moderate traffic flow, signal timing optimized", severity: "medium" },
        { signalId: createdSignals[2]._id, message: "System operating at normal parameters", severity: "low" }
      ];
      await Alert.insertMany(alertData);
      console.log("Created sample alerts");
    }

    console.log("Seeding complete successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

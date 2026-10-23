const TrafficSignal = require("../models/TrafficSignal");
const LiveTraffic = require("../models/LiveTraffic");
const Alert = require("../models/Alerts");

let simulationInterval = null;

module.exports = (io) => {
  // Start autonomous real-time traffic light & vehicle fluctuation engine
  if (!simulationInterval) {
    simulationInterval = setInterval(async () => {
      try {
        const signals = await TrafficSignal.find({ status: 'active' });
        if (!signals || signals.length === 0) return;

        let hasUpdates = false;

        for (const signal of signals) {
          // If emergency override is active, keep it green
          if (signal.emergencyOverride) continue;

          // Decrement timer
          signal.timer = Math.max(0, (signal.timer || 45) - 3);

          // Phase transition cycle: green -> yellow -> red -> green
          if (signal.timer <= 0) {
            hasUpdates = true;
            if (signal.currentPhase === 'green') {
              signal.currentPhase = 'yellow';
              signal.timer = 5; // 5s yellow
            } else if (signal.currentPhase === 'yellow') {
              signal.currentPhase = 'red';
              signal.timer = 40; // 40s red
            } else {
              signal.currentPhase = 'green';
              // Adaptive timer based on vehicle load
              signal.timer = Math.min(85, Math.max(30, Math.floor((signal.vehicleCount || 30) * 0.8)));
            }
          }

          // Fluctuate vehicle count slightly (+/- 3) to simulate real traffic flow
          const delta = Math.floor(Math.random() * 5) - 2;
          const newCount = Math.max(5, Math.min(125, (signal.vehicleCount || 25) + delta));
          if (newCount !== signal.vehicleCount) {
            signal.vehicleCount = newCount;
            signal.congestionLevel = newCount > 60 ? 'high' : newCount > 30 ? 'medium' : 'low';
            signal.avgSpeed = Math.max(10, Math.floor(65 - (newCount * 0.45)));
            hasUpdates = true;
          }

          await signal.save();
        }

        if (hasUpdates) {
          io.emit("signalsUpdate", signals);
        }
      } catch (err) {
        // Silent catch for simulation loop
      }
    }, 3000);
  }

  io.on("connection", async (socket) => {
    // Send immediate state to newly connected client
    try {
      const signals = await TrafficSignal.find({ status: 'active' });
      const alerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
      socket.emit("initialState", { signals, alerts });
    } catch (e) {
      // Ignore
    }

    // Client requests initial dataset
    socket.on("requestInitialData", async () => {
      try {
        const signals = await TrafficSignal.find({ status: 'active' });
        const alerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
        socket.emit("initialState", { signals, alerts });
      } catch (e) {
        console.error("Error sending initial state:", e);
      }
    });

    // Handle manual signal change
    socket.on("signalChange", async (data) => {
      try {
        const { signalId, timer, status, currentPhase } = data;
        const updatedSignal = await TrafficSignal.findByIdAndUpdate(
          signalId,
          { timer, status, currentPhase },
          { new: true }
        );
        io.emit("signalUpdate", updatedSignal);
      } catch (error) {
        console.error("Error updating signal:", error);
      }
    });

    // Handle Emergency Vehicle Preemption (EVP)
    socket.on("toggleEmergency", async (signalId) => {
      try {
        const signal = await TrafficSignal.findById(signalId);
        if (!signal) return;

        signal.emergencyOverride = !signal.emergencyOverride;
        if (signal.emergencyOverride) {
          signal.currentPhase = 'green';
          signal.timer = 90;
          const alert = await Alert.create({
            signalId: signal._id,
            message: `EMERGENCY VEHICLE PREEMPTION: Priority green wave at ${signal.location}`,
            severity: 'critical'
          });
          io.emit("alertUpdate", alert);
        } else {
          signal.timer = 45;
        }

        await signal.save();
        io.emit("signalUpdate", signal);
      } catch (error) {
        console.error("Error toggling emergency:", error);
      }
    });

    // Handle peak hour simulation request
    socket.on("simulatePeakHour", async () => {
      try {
        const signals = await TrafficSignal.find({ status: 'active' });
        for (const signal of signals) {
          signal.vehicleCount = Math.min(125, (signal.vehicleCount || 20) + Math.floor(Math.random() * 35) + 25);
          signal.congestionLevel = signal.vehicleCount > 60 ? 'high' : signal.vehicleCount > 30 ? 'medium' : 'low';
          signal.timer = Math.min(90, Math.max(35, Math.floor(signal.vehicleCount * 0.85)));
          signal.avgSpeed = Math.max(8, Math.floor(65 - (signal.vehicleCount * 0.45)));
          await signal.save();
        }
        const alert = await Alert.create({
          message: "Rush hour traffic surge simulated across all sectors.",
          severity: "high"
        });
        io.emit("signalsUpdate", signals);
        io.emit("alertUpdate", alert);
      } catch (error) {
        console.error("Error simulating rush hour:", error);
      }
    });

    // Alert broadcasting
    socket.on("newAlert", async (data) => {
      try {
        const alert = await Alert.create(data);
        io.emit("alertUpdate", alert);
      } catch (error) {
        console.error("Error creating alert:", error);
      }
    });

    socket.on("disconnect", () => {
      // Disconnect
    });
  });
};

const express = require("express");
const router = express.Router();
const {
  getLiveTrafficStatus,
  getPublicAlerts,
  getRoadCongestion,
  toggleEmergencyPreemption,
  simulateRushHour,
  getTrafficForecast,
  clearAlerts,
  getHealth,
  addTrafficData,
  getTrafficData
} = require("../controllers/trafficController");

// Public endpoints (Accessible by Dashboard & Client)
router.get("/health", getHealth);
router.get("/live-status", getLiveTrafficStatus);
router.get("/alerts", getPublicAlerts);
router.get("/congestion", getRoadCongestion);
router.get("/forecast", getTrafficForecast);

// Interactive control endpoints
router.post("/emergency/:id", toggleEmergencyPreemption);
router.post("/simulate-rush-hour", simulateRushHour);
router.delete("/alerts", clearAlerts);

// Legacy endpoints
router.post("/add", addTrafficData);
router.get("/", getTrafficData);

module.exports = router;
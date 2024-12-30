const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();

const prisma = new PrismaClient();

router.get("/test", async (req, res) => {
  try {
    let sql = `SELECT gno GNo, name Name, desgn Desgn FROM mem_tb`;
    const result = await prisma.$queryRawUnsafe(sql);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "SQL query is required" });
    }

    const result = await prisma.$queryRawUnsafe(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

module.exports = router;

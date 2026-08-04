const { Router } = require("express");
const { upload } = require("../middleware/upload");
const { savePuzzle, getPuzzles, deletePuzzles } = require("../controllers/puzzleController");

const router = Router();

router.post("/", upload.single("image"), savePuzzle);
router.get("/", getPuzzles);
router.delete("/", deletePuzzles);

module.exports = router;

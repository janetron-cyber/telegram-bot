const fs = require("fs");

const records = [];

for (let i = 1; i <= 10000; i++) {
  records.push({
    id: i,
    label: `Simulation Record #${String(i).padStart(5, "0")}`,
    code: String(Math.floor(100000 + Math.random() * 900000)),
    price: 1,
    sold: false
  });
}

fs.writeFileSync(
  "numbers.json",
  JSON.stringify(records, null, 2)
);

console.log("Generated 10,000 simulation records.");
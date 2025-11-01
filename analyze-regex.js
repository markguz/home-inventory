// Analyze parser regex issue with native Tesseract output format

const testLines = [
  "GV 100 BRD 078742366900 F 1.33 N",
  "GV 100 BRD 078742366900 F 1.83 N",
  "DELI POP CKN 078742223620 2.98 X",
  "PIROULINE 042456050410 F 3.95 N",
  "CRM OF MSHRM 051000012610 F 1.00 N",
  "CN SF T BEEF 070662404010 F 1.08 N",
  "TYS POPCORN 023700060120 F 6.46 N",
  "MXD VRTY 31. 040000598750 F 14.96 X",
  "JOL SERV BWL 843623117330 2.97 X"
];

console.log("=== NATIVE TESSERACT OUTPUT FORMAT ANALYSIS ===\n");

const currentPattern = /\$?\s*(\d+[.,][O0o]\d|[\d]+[.,]\d{1,2})\s+[A-Z]?\s*\d+/i;
const endOfLinePattern = /\$?\s*(\d+[.,][O0o]\d|[\d]+[.,]\d{1,2})\s*$/i;

console.log("Current regex matches:\n");
testLines.forEach(line => {
  const match1 = line.match(currentPattern);
  const match2 = line.match(endOfLinePattern);
  console.log(`"${line}"`);
  console.log(`  Current pattern: ${match1 ? `"${match1[0]}" (price: ${match1[1]})` : "NO MATCH"}`);
  console.log(`  End pattern: ${match2 ? `"${match2[0]}" (price: ${match2[1]})` : "NO MATCH"}`);
  console.log();
});

// Proposed better pattern - just find any decimal price
const priceOnlyPattern = /\d+[.,]\d{1,2}/;

console.log("\n=== PROPOSED SOLUTION: FIND PRICE ONLY ===\n");
testLines.forEach(line => {
  const priceMatch = line.match(priceOnlyPattern);
  if (priceMatch) {
    const price = priceMatch[0];
    const itemName = line.substring(0, line.indexOf(price)).trim();
    console.log(`"${line}"`);
    console.log(`  Price: ${price}`);
    console.log(`  Item name: ${itemName}`);
    console.log();
  }
});

console.log("\n=== SUMMARY ===");
console.log(`Current regex matches: ${testLines.filter(l => l.match(currentPattern) || l.match(endOfLinePattern)).length}/${testLines.length}`);
console.log(`Simple price pattern matches: ${testLines.filter(l => l.match(priceOnlyPattern)).length}/${testLines.length}`);

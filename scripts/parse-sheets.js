const fs = require('fs');
const path = require('path');

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function trimCell(s) {
  return (s || '').trim();
}

function parseWeek(weekName, csvText) {
  const lines = csvText.split('\n').filter(l => l.trim() !== '');
  const rows = lines.map(parseCSVLine);

  // 1. Find collection day and total row
  let collectionDay = 'friday';
  let totalRowIdx = -1;

  // Check first row for FRIDAY/SATURDAY marker
  for (let i = 0; i < rows.length; i++) {
    const cell0 = trimCell(rows[i][0]).toLowerCase();
    const cell1 = trimCell(rows[i][1] || '').toUpperCase();

    if (cell0.includes('friday total') || cell0.includes('saturday total')) {
      totalRowIdx = i;
      collectionDay = cell0.includes('saturday') ? 'saturday' : 'friday';
      break;
    }
    if (cell1.startsWith('FRIDAY')) collectionDay = 'friday';
    if (cell1.startsWith('SATURDAY')) collectionDay = 'saturday';
  }

  // If no labelled total row, find an unlabelled one (like 20 March)
  if (totalRowIdx === -1) {
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      const c0 = trimCell(row[0]);
      // Unlabelled total row: empty col 0, numeric values in product columns, dollar total near end
      if (c0 === '') {
        let numCount = 0;
        let hasDollar = false;
        for (let j = 1; j < row.length; j++) {
          const v = trimCell(row[j]);
          if (/^\d+$/.test(v)) numCount++;
          if (v.startsWith('$') && parseFloat(v.replace('$', '').replace(',', '')) > 20) hasDollar = true;
        }
        if (numCount >= 3 && hasDollar) {
          totalRowIdx = i;
          break;
        }
      }
    }
  }

  if (totalRowIdx === -1) {
    console.error(`  ERROR: Could not find total row for week: ${weekName}`);
    return null;
  }

  const totalRow = rows[totalRowIdx];

  // 2. Find qty columns from the total row
  // Qty columns have plain integers; the TOTAL column has a dollar value
  // Skip col 0 (label). Find all columns with plain integers.
  const qtyColumns = [];
  let totalColumn = -1;

  for (let j = 1; j < totalRow.length; j++) {
    const v = trimCell(totalRow[j]);
    if (/^\d+$/.test(v)) {
      qtyColumns.push(j);
    } else if (v.startsWith('$') && totalColumn === -1) {
      totalColumn = j;
    }
  }

  // 3. Parse product summary section
  // Summary rows: col 0 = product name, col 1 = total qty (integer)
  // Ends when we hit a customer row or blank row
  const summaryProducts = [];
  let summaryEndIdx = 0;

  for (let i = 0; i < totalRowIdx; i++) {
    const row = rows[i];
    const name = trimCell(row[0]);
    const val = trimCell(row[1] || '');

    // Skip FRIDAY/SATURDAY marker rows
    if (name === '' && (val.toUpperCase().startsWith('FRIDAY') || val.toUpperCase().startsWith('SATURDAY'))) {
      summaryEndIdx = i + 1;
      continue;
    }

    // Skip combined header row like "30 January" (has product names in cols 3+)
    if (val.toUpperCase().startsWith('SATURDAY') || val.toUpperCase().startsWith('FRIDAY')) {
      summaryEndIdx = i + 1;
      // "Sourdough", "FRIDAY " pattern on 16 Jan and 13 Feb
      // The col 0 has "Sourdough" but col 1 is "FRIDAY" not a number
      // Don't add as product (it will be in next rows)
      continue;
    }

    // Product summary row: name + integer qty
    if (name !== '' && /^\d+$/.test(val) && !isCustomerRow(row)) {
      summaryProducts.push({ name: name, total_qty: parseInt(val) });
      summaryEndIdx = i + 1;
      continue;
    }

    // Product with empty/0 qty
    if (name !== '' && val === '' && !name.startsWith('$') && i < 15) {
      // Check it's not a customer row (customer rows have $ values)
      if (!isCustomerRow(row) && summaryEndIdx > 0) {
        summaryProducts.push({ name: name, total_qty: 0 });
        summaryEndIdx = i + 1;
        continue;
      }
    }

    // If we already started summary and hit something else, stop
    if (summaryEndIdx > 0 && isCustomerRow(row)) break;
  }

  // 4. Map products to qty columns
  // Match summary products to columns by matching totals from the total row
  const columnTotals = {};
  for (const col of qtyColumns) {
    columnTotals[col] = parseInt(trimCell(totalRow[col])) || 0;
  }

  const productColumnMap = {}; // col -> product name
  const usedProducts = new Set();
  const usedColumns = new Set();

  // Known canonical slot assignments (by column index in standard 9-product layout)
  const canonicalSlots = [
    { cols: [1], names: ['sourdough'] },
    { cols: [3], names: ['focaccia'] },
    { cols: [5], names: ['focaccia'] },
    { cols: [7], names: ['pizza dough'] },
    { cols: [9], names: ['fougasse'] },
    { cols: [11], names: ['burger buns'] },
    { cols: [13], names: ['banana choc muffins', 'hot x buns'] },
    { cols: [14, 15], names: ['mince pies', 'butter bean dip'] },
    { cols: [16, 17], names: ['tarte au citron'] },
  ];

  // First pass: match by canonical name
  for (const product of summaryProducts) {
    if (product.name.toLowerCase().includes('small')) continue; // Skip small variants
    const pNorm = product.name.toLowerCase().trim();

    for (const slot of canonicalSlots) {
      let matched = false;
      for (const canonName of slot.names) {
        if (pNorm.includes(canonName) || canonName.includes(pNorm.split(' ')[0].split('-')[0])) {
          // Try each possible column for this slot
          for (const col of slot.cols) {
            if (qtyColumns.includes(col) && !usedColumns.has(col)) {
              productColumnMap[col] = product.name;
              usedProducts.add(product.name);
              usedColumns.add(col);
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }
      if (matched) break;
    }
  }

  // Second pass: match remaining products by total qty
  for (const product of summaryProducts) {
    if (usedProducts.has(product.name)) continue;
    if (product.name.toLowerCase().includes('small')) continue;

    for (const col of qtyColumns) {
      if (usedColumns.has(col)) continue;
      if (columnTotals[col] === product.total_qty && product.total_qty > 0) {
        productColumnMap[col] = product.name;
        usedProducts.add(product.name);
        usedColumns.add(col);
        break;
      }
    }
  }

  // Handle "30 January" which has NO summary section - parse products from header row
  if (summaryProducts.length === 0) {
    // The first row is a header with product names in odd columns
    const headerRow = rows[0];
    for (const col of qtyColumns) {
      // Look for product name in the header at this column
      let headerName = trimCell(headerRow[col]);
      // Clean up "SATURDAY SOURDOUGH" -> "SOURDOUGH"
      headerName = headerName.replace(/^(SATURDAY|FRIDAY)\s+/i, '').trim();
      if (headerName && !headerName.startsWith('$')) {
        productColumnMap[col] = titleCase(headerName);
        usedColumns.add(col);
        summaryProducts.push({
          name: titleCase(headerName),
          total_qty: columnTotals[col] || 0
        });
      }
    }
    // Also check odd columns in header that might not be in totalRow qtys
    for (let j = 1; j < headerRow.length; j += 2) {
      let headerName = trimCell(headerRow[j]);
      if (!headerName || headerName.startsWith('$')) continue;
      headerName = headerName.replace(/^(SATURDAY|FRIDAY)\s+/i, '').trim();
      if (headerName === 'TOTAL' || headerName === '') continue;
      if (!usedColumns.has(j) && qtyColumns.includes(j)) continue; // Already handled
      // Map this column if it's a qty column we know about
    }
    summaryEndIdx = 1; // Customer data starts at row 1
  }

  // 5. Parse customer orders
  const orders = [];
  let i = summaryEndIdx;

  while (i < totalRowIdx) {
    const row = rows[i];
    const name = trimCell(row[0]);

    // Skip empty/price rows
    if (name === '' || name.startsWith('$')) {
      i++;
      continue;
    }

    // Skip total-like rows
    if (name.toLowerCase().includes('total')) {
      i++;
      continue;
    }

    // Customer row
    const items = [];
    for (const [colStr, productName] of Object.entries(productColumnMap)) {
      const col = parseInt(colStr);
      const qtyStr = trimCell(row[col]);
      const qty = /^\d+$/.test(qtyStr) ? parseInt(qtyStr) : 0;
      if (qty > 0) {
        items.push({
          product: titleCase(productName),
          quantity: qty
        });
      }
    }

    // Find total - it's the dollar amount in the total column
    let total = '';
    let status = '';

    if (totalColumn >= 0 && row[totalColumn]) {
      total = trimCell(row[totalColumn]);
    }

    // Sometimes total is one column before the dollar in total row
    // For "20 March", total is at col 20
    // For others, total is at col 19
    // Let's be more precise: scan for the LAST dollar value after all product columns
    const lastQtyCol = Math.max(...qtyColumns);
    let foundTotal = false;
    for (let j = lastQtyCol + 1; j < row.length; j++) {
      const v = trimCell(row[j]);
      if (v.startsWith('$') && !foundTotal) {
        total = v;
        foundTotal = true;
      } else if (foundTotal && v !== '' && !v.startsWith('$')) {
        status = v;
        break;
      } else if (foundTotal && v.startsWith('$')) {
        // Two dollar values in a row - first was probably a price column, this is the real total
        // Actually, we need to handle the case where there's a price col and then total
        // Keep scanning
        total = v;
        status = '';
      }
    }

    // If still no total, check the totalColumn position
    if (!total && totalColumn >= 0) {
      total = trimCell(row[totalColumn]) || '';
    }

    // Only add orders with items
    if (items.length > 0) {
      const order = {
        customer_name: cleanCustomerName(name),
        items: items,
        total: total || '$0'
      };
      if (status) {
        order.status = status;
      }
      orders.push(order);
    }

    // Skip the price breakdown row that follows
    i++;
    if (i < totalRowIdx) {
      const nextRow = rows[i];
      const nextName = trimCell(nextRow[0]);
      if (nextName === '' || nextName.startsWith('$')) {
        i++; // skip price row
      }
    }
  }

  // Handle "13 February" Teresa (after the total row)
  for (let j = totalRowIdx + 1; j < rows.length; j++) {
    const row = rows[j];
    const name = trimCell(row[0]);
    if (name && !name.toLowerCase().includes('richard') && !name.startsWith('$') && isCustomerRow(row)) {
      const items = [];
      for (const [colStr, productName] of Object.entries(productColumnMap)) {
        const col = parseInt(colStr);
        const qtyStr = trimCell(row[col]);
        const qty = /^\d+$/.test(qtyStr) ? parseInt(qtyStr) : 0;
        if (qty > 0) {
          items.push({
            product: titleCase(productName),
            quantity: qty
          });
        }
      }
      if (items.length > 0) {
        orders.push({
          customer_name: cleanCustomerName(name),
          items: items,
          total: '$0',
          note: 'after total row'
        });
      }
    }
    // Teresa on 13 Feb has qty at col 9 (Fougasse) = 1
    // But isCustomerRow checks for $ values which Teresa doesn't have
    // Let's also check for rows with any qty values
    if (name && !name.toLowerCase().includes('richard') && !name.startsWith('$')) {
      const items = [];
      for (const [colStr, productName] of Object.entries(productColumnMap)) {
        const col = parseInt(colStr);
        const qtyStr = trimCell(row[col]);
        const qty = /^\d+$/.test(qtyStr) ? parseInt(qtyStr) : 0;
        if (qty > 0) {
          items.push({
            product: titleCase(productName),
            quantity: qty
          });
        }
      }
      // Avoid duplicates
      if (items.length > 0 && !orders.find(o => o.customer_name === cleanCustomerName(name) && o.note === 'after total row')) {
        orders.push({
          customer_name: cleanCustomerName(name),
          items: items,
          total: '$0'
        });
      }
    }
  }

  // Build products list
  const products = summaryProducts
    .filter(p => !p.name.toLowerCase().includes('small'))
    .map(p => ({
      name: titleCase(p.name),
      total_qty: p.total_qty
    }));

  // For "30 January" or weeks where summary was derived from header,
  // include all products even with 0 qty (they appear in the header)

  return {
    name: weekName,
    collection_day: collectionDay,
    products: products,
    orders: orders
  };
}

function isCustomerRow(row) {
  let hasDollar = false;
  for (let i = 2; i < Math.min(row.length, 20); i++) {
    if (trimCell(row[i]).startsWith('$')) hasDollar = true;
  }
  return hasDollar;
}

function titleCase(str) {
  return str.trim()
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && ['au', 'de', 'la', 'le', 'du', 'des', 'et'].includes(lower)) return lower;
      if (lower === '+') return '+';
      if (lower === 'x') return 'X';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function cleanCustomerName(name) {
  return name.replace(/\s*\(.*?\)\s*/g, '').trim();
}

// Main
const inputPath = 'C:/Users/richa/Downloads/elis_bakery_sheets.json';
const outputPath = 'C:/Users/richa/elis_bakery/scripts/parsed-orders.json';

const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

const weeks = [];
for (const [weekName, csvText] of Object.entries(rawData)) {
  console.log(`\nParsing week: ${weekName}`);
  const result = parseWeek(weekName, csvText);
  if (result) {
    weeks.push(result);
    console.log(`  Collection: ${result.collection_day}`);
    console.log(`  Products: ${result.products.map(p => `${p.name}(${p.total_qty})`).join(', ')}`);
    console.log(`  Orders: ${result.orders.length}`);
    for (const order of result.orders) {
      const statusStr = order.status ? ` [${order.status}]` : '';
      console.log(`    ${order.customer_name}: ${order.items.map(i => `${i.product} x${i.quantity}`).join(', ')} = ${order.total}${statusStr}`);
    }
  }
}

// Sort weeks by date
weeks.sort((a, b) => {
  const dateA = new Date(a.name);
  const dateB = new Date(b.name);
  return dateA - dateB;
});

// Clean up: remove temporary notes
for (const week of weeks) {
  for (const order of week.orders) {
    delete order.note;
  }
}

const output = { weeks };
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\nOutput written to ${outputPath}`);

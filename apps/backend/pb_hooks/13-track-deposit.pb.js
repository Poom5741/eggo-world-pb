routerAdd("POST", "/api/v2/deposit/poll", (e) => {
  var TRANSFER_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  var REQUIRED_CONFIRMATIONS = 12;
  var RPC_URL = $os.getenv("BSC_RPC_URL") || "https://bsc-dataseed.binance.org";
  var USDT_ADDRESS = $os.getenv("USDT_ADDRESS") || "";
  if (!USDT_ADDRESS) { throw new Error("USDT_ADDRESS not configured"); }

  function rpc(method, params) {
    var r = $http.send({ url: RPC_URL, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", method: method, params: params, id: 1 }) });
    if (r.json.error) { throw new Error("RPC: " + r.json.error.message); }
    return r.json.result;
  }

  var requestInfo = e.requestInfo(); var auth = requestInfo.auth || {};
  if (!auth.id) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
  var body = requestInfo.body || {}; var user_address = body.user_address;
  if (!user_address || !user_address.match(/^0x[a-fA-F0-9]{40}$/)) { return e.json(400, { success: false, error: { message: "Valid user_address required", code: "VALIDATION_ERROR" } }); }

  try {
    var userRecord = $app.findFirstRecordByData("users", "wallet", user_address);
    if (!userRecord) { return e.json(404, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
    var walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id);
    if (!walletRecord) { return e.json(404, { success: false, error: { message: "Wallet not found", code: "WALLET_NOT_FOUND" } }); }
    console.log("[Poll] USDT:", USDT_ADDRESS, "RPC:", RPC_URL, "User:", userRecord.id);

    var pendDep = $app.findRecordsByFilter("deposits", "user = '" + userRecord.id + "' && status = 'pending'", "-created", 500);
    var newlyConfirmed = [];
    if (pendDep && pendDep.length > 0) {
      var currentBlockNum = parseInt(rpc("eth_blockNumber", []), 16);
      for (var pi = 0; pi < pendDep.length; pi++) {
        var rec = pendDep[pi]; var blockNumber = Math.floor(rec.get("block_number")); var confs = currentBlockNum - blockNumber;
        if (confs < 0) { continue; }
        if (confs >= REQUIRED_CONFIRMATIONS) {
          try {
            var vb = rpc("eth_getBlockByNumber", ["0x" + blockNumber.toString(16), false]);
            if (vb && vb.hash === rec.getString("block_hash")) {
              rec.set("status", "confirmed"); rec.set("confirmations", confs); rec.set("confirmed_at", new Date().toISOString()); $app.save(rec);
              newlyConfirmed.push(rec);
            } else { rec.set("status", "failed"); $app.save(rec); }
          } catch (vErr) { console.error("[Poll] Block verify failed:", vErr.message); }
        } else { rec.set("confirmations", confs); try { $app.save(rec); } catch (e) {} }
      }
    }

    var cBlock = parseInt(rpc("eth_blockNumber", []), 16);
    var fromBlock = Math.max(cBlock - 50000, 0);
    if (fromBlock > cBlock) { var pD = $app.findRecordsByFilter("deposits", "user = '" + userRecord.id + "' && status = 'pending'", "-created", 500); var cD = $app.findRecordsByFilter("deposits", "user = '" + userRecord.id + "' && status = 'confirmed'", "-created", 500); return e.json(200, { success: true, data: { deposits: [], new_balance: walletRecord.get("usdt_balance") || 0, total_deposited: 0, events_processed: 0, pending_count: pD.length, confirmed_count: cD.length, newly_confirmed: newlyConfirmed.map(function(d) { return { tx_hash: d.getString("tx_hash"), amount: d.get("amount") }; }) } }); }

    var toTopic = "0x" + user_address.slice(2).padStart(64, "0");
    var eventLogs = rpc("eth_getLogs", [{ address: USDT_ADDRESS, fromBlock: "0x" + fromBlock.toString(16), toBlock: "0x" + cBlock.toString(16), topics: [TRANSFER_SIGNATURE, null, toTopic] }]) || [];

    var deposits = []; var totalDeposited = 0;
    for (var j = 0; j < eventLogs.length; j++) {
      var el = eventLogs[j]; if (el.removed) { continue; }
      var fromAddr = "0x" + el.topics[1].slice(26); var toAddr = "0x" + el.topics[2].slice(26);
      if (toAddr.toLowerCase() !== user_address.toLowerCase()) { continue; }
      var amountRaw = parseInt(el.data, 16); var amtUSDT = amountRaw / Math.pow(10, 18);
      if (amtUSDT <= 0) { continue; }
      var txHash = el.transactionHash; var bNum = parseInt(el.blockNumber, 16);
      try { var col = $app.findCollectionByNameOrId("deposits"); var rec = new Record(col); rec.set("user", userRecord.id); rec.set("amount", amtUSDT); rec.set("tx_hash", txHash); rec.set("from_address", fromAddr); rec.set("status", "pending"); rec.set("block_number", bNum); rec.set("block_hash", el.blockHash); rec.set("confirmations", 1); var logIdx = el.logIndex || "0x0"; var logIdxNum = logIdx.indexOf("0x") === 0 ? parseInt(logIdx, 16) : parseInt(logIdx, 10); rec.set("log_index", isNaN(logIdxNum) ? 0 : logIdxNum); $app.save(rec); console.log("[Poll] Created pending deposit:", txHash, "amount:", amtUSDT); deposits.push({ tx_hash: txHash, amount: amtUSDT, from_address: fromAddr, status: "pending", block_number: bNum }); totalDeposited += amtUSDT; } catch (e) { console.warn("[Poll] Save deposit failed:", e.message); continue; }
    }

    walletRecord.set("last_polled_block", cBlock); $app.save(walletRecord);
    var pD2 = $app.findRecordsByFilter("deposits", "user = '" + userRecord.id + "' && status = 'pending'", "-created", 500); var cD2 = $app.findRecordsByFilter("deposits", "user = '" + userRecord.id + "' && status = 'confirmed'", "-created", 500);

    e.json(200, {
      success: true,
      data: {
        deposits: deposits,
        new_balance: walletRecord.get("usdt_balance") || 0,
        total_deposited: totalDeposited,
        events_processed: eventLogs.length,
        pending_count: pD2.length,
        confirmed_count: cD2.length,
        newly_confirmed: newlyConfirmed.map(function(d) { return { tx_hash: d.getString("tx_hash"), amount: d.get("amount") }; })
      }
    });
  } catch (error) { console.error("[Poll] Error:", error.message); e.json(500, { success: false, error: { message: error.message, code: "DEPOSIT_POLL_FAILED" } }); }
});

console.log("Deposit tracking endpoint registered: POST /api/v2/deposit/poll");

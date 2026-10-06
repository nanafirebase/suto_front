const ksd = "3"

// async function transferStock(socket: Socket, database: Pool, body: socketBody, callback: iSocketCallback, userID: string | number) {
//     const { businessID, items, sessionID, branchID } = body;
//     const businessId = Number(businessID), branchId = Number(branchID), userId = Number(userID);

//     if (!Number.isInteger(businessId) || businessId <= 0 || !Number.isInteger(branchId) || branchId <= 0 || !Number.isInteger(userId) || userId <= 0 || !Array.isArray(items) || !items.length) {
//         callback({ status: "error", message: "Invalid transfer request" }); return;
//     }

//     if (!(await userHasBusinessAccess(database, schemaName, businessId, userId))) {
//         callback({ status: "error", message: "Access denied" }); return;
//     }

//     const subscription = await checkBusinessSubscription(database, schemaName, businessId);
//     if (!subscription.isActive) {
//         callback({ status: "error", message: `Business subscription ended on the ${subscription.expiresAt}` }); return;
//     }

//     let connection: PoolConnection | null = null;

//     try {
//         connection = await database.getConnection();
//         await connection.beginTransaction();

//         const settingsTable = new BusinessSettingsTable(undefined, connection, schemaName);
//         const productInStockTable = new ProductInStockTable(undefined, connection, schemaName);
//         const stockInItemTable = new StockInItemTable(undefined, connection, schemaName);

//         const settingsRows = await settingsTable.get(
//             "business_settings.businessID = ? AND business_settings.branchID = ? AND business_settings.status != ?",
//             [businessId, branchId, "inactive"], 1, 0
//         );

//         const settings = settingsRows[0];
//         if (!settings?.defaultSalesStockID) throw new Error("Default stock location is not set for this business");

//         const strategy: "FIFO" | "FEFO" = settings.autoExpiry ? "FEFO" : "FIFO";

//         const transferItems = new Map<string, { productID: number; fromStockID: number; toStockID: number; quantity: number }>();

//         for (const item of items as ITransferItem[]) {
//             const productID = Number(item.productID), fromStockID = Number(item.fromStockID), toStockID = Number(item.toStockID), quantity = Number(item.quantity);

//             if (!Number.isInteger(productID) || productID <= 0 || !Number.isInteger(fromStockID) || fromStockID <= 0 || !Number.isInteger(toStockID) || toStockID <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
//                 throw new Error("Invalid transfer item");
//             }

//             if (fromStockID === toStockID) throw new Error(`Source and destination stock cannot be the same for product ${productID}`);

//             const key = `${productID}:${fromStockID}:${toStockID}`;
//             const existing = transferItems.get(key);

//             if (existing) existing.quantity += quantity;
//             else transferItems.set(key, { productID, fromStockID, toStockID, quantity });
//         }

//         const normalizedItems = [...transferItems.values()];
//         const insufficientProducts: { productID: number; fromStockID: number; available: number; requested: number }[] = [];

//         for (const item of normalizedItems) {
//             const stockRows = await productInStockTable.get(
//                 "businessID = ? AND branchID = ? AND productID = ? AND stockID = ? AND status = ?",
//                 [businessId, branchId, item.productID, item.fromStockID, "active"], 1, 0
//             );

//             const aggregateAvailable = stockRows.length ? Number(stockRows[0].baseQuantity || 0) : 0;

//             const batchRows: any[] = await stockInItemTable.get(
//                 "sii.businessID = ? AND si.branchID = ? AND si.stockID = ? AND sii.productID = ? AND sii.status = ? AND sii.remainingQuantity > 0",
//                 [businessId, branchId, item.fromStockID, item.productID, "active"], 100000, 0
//             );

//             const batchAvailable = batchRows.reduce((sum, batch) => sum + Number(batch.remainingQuantity || 0), 0);
//             const available = Math.min(aggregateAvailable, batchAvailable);

//             if (available < item.quantity) {
//                 insufficientProducts.push({
//                     productID: item.productID,
//                     fromStockID: item.fromStockID,
//                     available,
//                     requested: item.quantity
//                 });
//             }
//         }

//         if (insufficientProducts.length) throw new Error(`Some products have insufficient stock: ${JSON.stringify(insufficientProducts)}`);

//         const transferID = generateID();

//         for (const item of normalizedItems) {
//             let quantityNeeded = item.quantity;

//             let batches: any[] = await stockInItemTable.get(
//                 "sii.businessID = ? AND si.branchID = ? AND si.stockID = ? AND sii.productID = ? AND sii.status = ? AND sii.remainingQuantity > 0",
//                 [businessId, branchId, item.fromStockID, item.productID, "active"], 100000, 0
//             );

//             if (strategy === "FEFO") {
//                 batches.sort((a, b) => {
//                     if (!a.expiryDate && !b.expiryDate) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
//                     if (!a.expiryDate) return 1;
//                     if (!b.expiryDate) return -1;
//                     const expiry = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
//                     return expiry || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
//                 });
//             } else {
//                 batches.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
//             }

//             for (const batch of batches) {
//                 if (quantityNeeded <= 0) break;

//                 const available = Number(batch.remainingQuantity || 0);
//                 if (available <= 0) continue;

//                 const quantity = Math.min(quantityNeeded, available);

//                 stockInItemTable.setValues({
//                     id: batch.stockInItemID,
//                     remainingQuantity: available - quantity
//                 })

//                 const updateResult = await stockInItemTable.update(["remainingQuantity"]);
//                 if (updateResult !== "success") throw new Error("Failed updating source batch");

//                 /*
//                  * Create a destination batch allocation.
//                  * The source batch information is preserved so FIFO/FEFO,
//                  * expiry and cost accounting continue to work.
//                  */

//                 stockInItemTable.setValues({
//                     id: generateID(),
//                     businessID: businessId,
//                     stockInID: batch.stockInID,
//                     productID: item.productID,
//                     productUOMID: batch.productUOMID,
//                     quantity,
//                     remainingQuantity: quantity,
//                     costPrice: Number(batch.costPrice || 0),
//                     batchNumber: batch.batchNumber || null,
//                     expiryDate: batch.expiryDate || null,
//                     status: "active",
//                     createdAt: fullDateTime()
//                 })

//                 const saveResult = await stockInItemTable.save();
//                 if (saveResult.type !== "success") throw new Error("Failed creating destination batch");

//                 quantityNeeded -= quantity;
//             }

//             if (quantityNeeded > 0) throw new Error(`Insufficient batch stock for product ${item.productID}`);

//             await recordInventoryMovement(connection, schemaName, {
//                 id: generateID(),
//                 businessID: businessId,
//                 branchID: branchId,
//                 stockID: item.fromStockID,
//                 productID: item.productID,
//                 created_by: userId,
//                 referenceType: "transfer",
//                 referenceID: transferID,
//                 quantityIn: 0,
//                 quantityOut: item.quantity,
//                 baseQuantity: -item.quantity,
//                 sessionID,
//                 createdAt: fullDateTime()
//             });

//             await recordInventoryMovement(connection, schemaName, {
//                 id: generateID(),
//                 businessID: businessId,
//                 branchID: branchId,
//                 stockID: item.toStockID,
//                 productID: item.productID,
//                 created_by: userId,
//                 referenceType: "transfer",
//                 referenceID: transferID,
//                 quantityIn: item.quantity,
//                 quantityOut: 0,
//                 baseQuantity: item.quantity,
//                 sessionID,
//                 createdAt: fullDateTime()
//             });
//         }

//         await connection.commit();
//         connection.release();
//         connection = null;

//         callback({ status: "success", message: "Stock transferred successfully" });
//         socket.broadcast.emit(`${businessID}/stock/transfer`, "success");
//         socket.emit(`${businessID}/stock/transfer`, "success");
//     } catch (error: any) {
//         if (connection) {
//             try { await connection.rollback(); } catch (rollbackError:any) { Logger.log("error", "transferStock.rollback", rollbackError); }
//             connection.release();
//             connection = null;
//         }

//         Logger.log("error", "transferStock.ts", error);
//         callback({
//             status: "error",
//             message: error?.message || "Failed to transfer stock"
//         });
//     }
// }
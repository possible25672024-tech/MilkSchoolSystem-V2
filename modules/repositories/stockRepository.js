/**
 * Stock Repository
 * จัดการข้อมูลสต็อกทั้งหมด
 */

class StockRepository {

    async getStock() {
        console.log("Load Stock");
        return [];
    }

    async saveStock(stockData) {
        console.log("Save Stock");
        return true;
    }

}

window.StockRepository = new StockRepository();
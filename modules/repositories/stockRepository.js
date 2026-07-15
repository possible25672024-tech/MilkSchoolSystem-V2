class StockRepository extends BaseRepository {

    async loadMainStock(){

        return await this.get("stock");

    }

    async saveMainStock(data){

        await this.set("stock",data);

    }

}

window.StockRepository=new StockRepository();
class ReportRepository extends BaseRepository {
    constructor(
        firebaseService = window.FirebaseService,
        stockRepository = window.StockRepository
    ) {
        super(firebaseService);
        this.appRoot = "milkApp";
        this.stockRepository = stockRepository;
    }

    path(child = "") {
        const cleanChild = String(child).replace(/^\/+|\/+$/g, "");
        return cleanChild ? `${this.appRoot}/${cleanChild}` : this.appRoot;
    }

    ensureStockRepository() {
        if (!this.stockRepository) {
            this.stockRepository = window.StockRepository;
        }

        if (!this.stockRepository?.loadStockSnapshot) {
            throw new Error("StockRepository is not available for report reads.");
        }

        return this.stockRepository;
    }

    loadSettings() {
        return this.get(this.path("settings"));
    }

    async loadReportSnapshot() {
        const [settings, stockSnapshot] = await Promise.all([
            this.loadSettings(),
            this.ensureStockRepository().loadStockSnapshot()
        ]);

        return {
            ...stockSnapshot,
            settings: settings || {}
        };
    }
}

window.ReportRepository = new ReportRepository();

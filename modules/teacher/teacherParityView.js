class TeacherParityView {
    constructor(
        manager = window.TeacherParityManager,
        teacherManager = window.TeacherManager,
        authService = window.AuthService,
        options = {}
    ) {
        this.manager = manager;
        this.teacherManager = teacherManager;
        this.authService = authService;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.openWindow = options.openWindow || ((...args) => window.open(...args));
        this.schedule = options.schedule || (callback => window.setTimeout(callback, 100));
        this.now = options.now || (() => new Date().toISOString());
        this.initialized = false;
        this.bound = false;
        this.activeSession = null;
        this.activeSection = "overview";
        this.currentStudentReport = null;
        this.panelIds = [
            "teacher-overview-panel",
            "attendance-panel",
            "attendance-report-panel",
            "sync-panel",
            "pending-milk-panel",
            "retroactive-milk-panel",
            "vacation-milk-panel",
            "student-report-panel",
            "room-stock-detail-panel",
            "teacher-settings-panel"
        ];

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleTeacherRefreshed = this.handleTeacherRefreshed.bind(this);
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleStudentReportLoad = this.handleStudentReportLoad.bind(this);
        this.handleStudentReportPrint = this.handleStudentReportPrint.bind(this);
        this.handleRoomStockRefresh = this.handleRoomStockRefresh.bind(this);
        this.handleSettingsSave = this.handleSettingsSave.bind(this);
        this.handleTeacherProfileSave = this.handleTeacherProfileSave.bind(this);
    }

    ensureDependencies() {
        this.manager ||= window.TeacherParityManager;
        this.teacherManager ||= window.TeacherManager;
        this.authService ||= window.AuthService;
        if (
            !this.manager?.loadStudentReport ||
            !this.manager?.refreshRoomStock ||
            !this.manager?.saveTeacherProfile
        ) {
            throw new Error("TeacherParityManager is not available.");
        }
        if (!this.teacherManager?.getSnapshot) {
            throw new Error("TeacherManager is not available.");
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
    }

    async initialize() {
        if (this.initialized) {
            return this.getState();
        }
        this.ensureDependencies();
        this.ensureStyles();
        this.ensureStructure();
        this.bindEvents();
        this.initialized = true;

        const session = this.authService.getSession();
        if (session?.role === "teacher") {
            this.activate(session);
        } else {
            this.clear();
        }
        return this.getState();
    }

    ensureStyles() {
        if (this.element("teacher-parity-view-style")) {
            return;
        }
        const style = this.document.createElement("style");
        style.id = "teacher-parity-view-style";
        style.textContent = `
            .teacher-parity-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:64px;margin:-28px -34px 18px;padding:10px 22px;color:#fff;background:linear-gradient(90deg,#174e70 0%,#2b7eae 100%);box-shadow:0 4px 14px rgba(15,46,68,.18)}
            .teacher-parity-topbar-copy{min-width:0}.teacher-parity-topbar h1{margin:0;color:#fff;font-size:1.02rem}.teacher-parity-topbar p{margin:2px 0 0;color:#d9edf8;font-size:.72rem}
            .teacher-parity-topbar-actions{display:flex;align-items:center;gap:12px}.teacher-parity-home{width:auto;min-height:38px;margin:0;padding:7px 12px;border:0;color:#fff;background:transparent}.teacher-parity-room-badge{display:inline-flex;align-items:center;gap:7px;max-width:240px;padding:7px 13px;border:1px solid rgba(255,255,255,.3);border-radius:999px;color:#fff;background:rgba(255,255,255,.12);font-size:.82rem;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .teacher-parity-room-badge::before{content:"";width:9px;height:9px;border-radius:50%;background:#2dd47e;box-shadow:0 0 0 3px rgba(45,212,126,.18)}
            .teacher-parity-nav{position:sticky;top:64px;z-index:20;margin:0 0 8px;padding:10px;border:1px solid #dbe5ef;border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(15,46,68,.08)}
            .teacher-sidebar-brand,.teacher-sidebar-footer,.teacher-parity-nav-group-title{display:none}
            .teacher-parity-nav-list{display:flex;gap:8px;overflow-x:auto;padding:2px;scrollbar-width:thin}
            .teacher-parity-nav-group,.teacher-parity-nav-group-items{display:contents}
            .teacher-parity-nav button{display:flex;align-items:center;gap:10px;flex:0 0 auto;width:auto;min-height:40px;margin:0;padding:8px 13px;color:#1e3a5f;background:#eef3f8;white-space:nowrap}
            .teacher-parity-nav-icon{display:inline-grid;place-items:center;width:22px;flex:0 0 22px}
            .teacher-parity-nav button[aria-current=page]{color:#fff;background:#1a5276}
            .teacher-parity-panel{margin-top:28px;padding-top:26px;border-top:1px solid #dbe5ef}
            .teacher-parity-intro{margin:6px 0 0;color:#64748b;font-size:.9rem}
            .teacher-parity-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
            .teacher-parity-card{margin:0;border:1px solid #dbe5ef;border-radius:12px;padding:14px;background:#f8fafc}
            .teacher-parity-card dt{color:#64748b;font-size:.78rem;font-weight:700}
            .teacher-parity-card dd{margin:6px 0 0;color:#1a5276;font-size:1.18rem;font-weight:800;overflow-wrap:anywhere}
            .teacher-parity-toolbar{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr)) auto;align-items:end;gap:12px;margin-top:18px}
            .teacher-parity-toolbar label,.teacher-settings-grid label{margin:0 0 6px}
            .teacher-parity-toolbar button{width:auto;min-width:150px;margin:0}
            .teacher-parity-table-wrap{margin-top:14px;overflow:auto;border:1px solid #dbe5ef;border-radius:12px}
            .teacher-parity-table{width:100%;min-width:650px;border-collapse:collapse}
            .teacher-parity-table th,.teacher-parity-table td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:.86rem}
            .teacher-parity-table th{background:#eaf2f8;color:#1e3a5f}
            .teacher-parity-table td.note{text-align:left}
            .teacher-parity-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
            .teacher-parity-actions button{width:min(260px,100%)}
            .teacher-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}
            .teacher-settings-option{border:1px solid #dbe5ef;border-radius:12px;padding:14px;background:#f8fafc}
            .teacher-settings-option label{display:flex;align-items:center;gap:10px;margin:0}
            .teacher-settings-option input[type=checkbox]{width:20px;min-height:20px}
            .teacher-settings-surface{margin-top:18px;padding:20px;border:1px solid #dbe5ef;border-radius:14px;background:#fff;box-shadow:0 8px 22px rgba(15,46,68,.06)}
            .teacher-settings-surface h4{margin:0;color:#153d5c;font-size:1.05rem}.teacher-settings-surface .teacher-parity-intro{margin-top:8px}
            .teacher-profile-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:16px;margin-top:18px}.teacher-profile-grid label{margin:0 0 6px}
            .teacher-profile-grid input[readonly]{color:#475569;background:#eef3f8}
            .teacher-profile-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}.teacher-profile-actions button{width:auto;min-width:190px;margin:0;background:#22a85a}
            .teacher-compact-mode .teacher-parity-card,.teacher-compact-mode .info-card,.teacher-compact-mode .metric-card{padding:10px}
            .teacher-compact-mode .teacher-parity-panel,.teacher-compact-mode .attendance-panel,.teacher-compact-mode .attendance-report-panel{margin-top:18px;padding-top:18px}
            #student-report-status[data-state=success],#room-stock-detail-status[data-state=success],#teacher-settings-status[data-state=success],#teacher-profile-status[data-state=success]{color:#166534}
            #student-report-status[data-state=error],#room-stock-detail-status[data-state=error],#teacher-settings-status[data-state=error],#teacher-profile-status[data-state=error]{color:#991b1b}
            @media(min-width:1101px){
                body:has(#teacher-shell:not([hidden])){display:block;padding:0;background:#eef3f8}
                body:has(#teacher-shell:not([hidden])) main{width:100%;max-width:none}
                #app-panel:has(#teacher-shell:not([hidden])){min-height:100vh;margin:0;padding:0 0 0 286px;border-radius:0;background:#eef3f8;box-shadow:none}
                #teacher-shell{min-height:100vh;padding:96px 34px 42px}
                #teacher-shell>.teacher-header,#teacher-shell>.teacher-identity-grid,#teacher-shell>.teacher-metrics{display:none}
                .teacher-parity-topbar{position:fixed;inset:0 0 auto 0;min-height:68px;margin:0;padding:10px 18px;z-index:45}
                .teacher-parity-nav{position:fixed;inset:68px auto 0 0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:286px;height:calc(100vh - 68px);margin:0;padding:0;border:0;border-radius:0;color:#e2edf5;background:linear-gradient(180deg,#102d40 0%,#173f58 100%);box-shadow:8px 0 28px rgba(15,46,68,.2);overflow:hidden}
                .teacher-sidebar-brand{display:block;padding:18px 18px 16px;text-align:left;background:rgba(4,35,55,.28);border-bottom:1px solid rgba(255,255,255,.1)}
                .teacher-sidebar-mark{display:grid;place-items:center;width:70px;height:52px;margin:0 0 10px;border-radius:12px;color:#0f4669;background:#fff;font-size:1.7rem;box-shadow:0 5px 14px rgba(0,0,0,.16)}
                .teacher-sidebar-title{margin:0;color:#fff;font-size:.98rem;font-weight:800;line-height:1.4}
                .teacher-sidebar-teacher{margin:4px 0 0;color:#cfe1ec;font-size:.76rem;font-weight:700;overflow-wrap:anywhere}
                .teacher-sidebar-school{margin:4px 0 0;color:#8faebe;font-size:.68rem;font-weight:700;overflow-wrap:anywhere}
                .teacher-parity-nav-list{display:block;padding:12px 0 18px;overflow-x:hidden;overflow-y:auto;scrollbar-color:#9bb2c1 transparent;scrollbar-width:thin}
                .teacher-parity-nav-group{display:block;margin:0 0 8px}
                .teacher-parity-nav-group-items{display:block}
                .teacher-parity-nav-group-title{display:block;margin:10px 22px 7px;color:#82a3b8;font-size:.72rem;font-weight:800;letter-spacing:.08em}
                .teacher-parity-nav button{display:flex;width:100%;min-height:48px;margin:0;padding:11px 22px;border-left:4px solid transparent;border-radius:0;color:#dbe8f0;background:transparent;text-align:left;white-space:normal}
                .teacher-parity-nav button:hover{color:#fff;background:rgba(255,255,255,.08)}
                .teacher-parity-nav button[aria-current=page]{border-left-color:#f59e0b;color:#fff;background:rgba(148,180,201,.3)}
                .teacher-parity-nav button[data-teacher-section=logout]{color:#fecaca}
                .teacher-parity-nav-icon{font-size:1.12rem}
                .teacher-sidebar-footer{display:flex;align-items:center;gap:10px;min-height:58px;padding:11px 18px;color:#dceaf2;background:rgba(3,39,60,.48);box-shadow:0 -1px 0 rgba(255,255,255,.1)}
                .teacher-sidebar-footer-icon{font-size:1.1rem}
                .teacher-sidebar-footer-copy{min-width:0}
                .teacher-sidebar-footer strong,.teacher-sidebar-footer small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .teacher-sidebar-footer strong{font-size:.8rem}
                .teacher-sidebar-footer small{margin-top:2px;color:#9fbbcc;font-size:.7rem}
            }
            @media(max-width:1100px){.teacher-parity-topbar{margin:-28px -34px 18px}}
            @media(max-width:820px){.teacher-parity-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.teacher-parity-toolbar{grid-template-columns:repeat(2,minmax(0,1fr))}.teacher-parity-toolbar button{width:100%}.teacher-settings-grid,.teacher-profile-grid{grid-template-columns:1fr}.teacher-parity-home{display:none}}
            @media(max-width:600px){.teacher-parity-grid,.teacher-parity-toolbar{grid-template-columns:1fr}.teacher-parity-actions{flex-direction:column}.teacher-parity-actions button{width:100%}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        const shell = this.element("teacher-shell");
        if (!shell) {
            throw new Error("Teacher shell is not available for Sprint 4.9 parity.");
        }
        this.ensureTopbar(shell);
        this.ensureNavigation(shell);
        this.ensureOverviewPanel(shell);
        this.ensureStudentReportPanel(shell);
        this.ensureRoomStockPanel(shell);
        this.ensureSettingsPanel(shell);
    }

    ensureTopbar(shell) {
        if (this.element("teacher-parity-topbar")) {
            return;
        }
        const header = this.document.createElement("header");
        header.id = "teacher-parity-topbar";
        header.className = "teacher-parity-topbar";
        header.hidden = true;
        header.innerHTML = `
            <div class="teacher-parity-topbar-copy">
                <h1>🥛 เช็กดื่มนม – ครูประจำชั้น</h1>
                <p id="teacher-topbar-school">โรงเรียน</p>
            </div>
            <div class="teacher-parity-topbar-actions">
                <button class="teacher-parity-home" type="button" data-teacher-section="overview">🏠 หน้าหลัก</button>
                <span id="teacher-topbar-room" class="teacher-parity-room-badge">ห้องเรียน</span>
            </div>`;
        shell.insertBefore
            ? shell.insertBefore(header, shell.firstChild || null)
            : shell.appendChild(header);
    }

    ensureNavigation(shell) {
        if (this.element("teacher-parity-nav")) {
            return;
        }
        const nav = this.document.createElement("nav");
        nav.id = "teacher-parity-nav";
        nav.className = "teacher-parity-nav";
        nav.setAttribute("aria-label", "เมนูครู");
        nav.hidden = true;
        nav.innerHTML = `<header class="teacher-sidebar-brand">
            <div class="teacher-sidebar-mark" aria-hidden="true">🥛</div>
            <p id="teacher-sidebar-room" class="teacher-sidebar-title">ห้องเรียน</p>
            <p id="teacher-sidebar-teacher" class="teacher-sidebar-teacher">ครูประจำชั้น</p>
            <p id="teacher-sidebar-school" class="teacher-sidebar-school">โรงเรียน</p>
        </header>
        <div class="teacher-parity-nav-list" role="list">
            ${this.navigationGroups().map(group => `
                <section class="teacher-parity-nav-group" aria-label="${group.label}">
                    <p class="teacher-parity-nav-group-title">${group.label}</p>
                    <div class="teacher-parity-nav-group-items">
                        ${group.items.map(item => (
                            `<button type="button" data-teacher-section="${item.id}"><span class="teacher-parity-nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`
                        )).join("")}
                    </div>
                </section>
            `).join("")}
        </div>
        <footer class="teacher-sidebar-footer">
            <span class="teacher-sidebar-footer-icon" aria-hidden="true">👩‍🏫</span>
            <span class="teacher-sidebar-footer-copy"><strong id="teacher-sidebar-footer-teacher">ครูประจำชั้น</strong><small id="teacher-sidebar-footer-room">ห้องเรียน</small></span>
        </footer>`;
        const attendance = this.element("attendance-panel");
        attendance && shell.insertBefore
            ? shell.insertBefore(nav, attendance)
            : shell.appendChild(nav);
    }

    ensureOverviewPanel(shell) {
        if (this.element("teacher-overview-panel")) {
            return;
        }
        const panel = this.document.createElement("section");
        panel.id = "teacher-overview-panel";
        panel.className = "teacher-parity-panel";
        panel.hidden = true;
        panel.innerHTML = `
            <h3>ภาพรวมการดื่มนม</h3>
            <p class="teacher-parity-intro">สถานะวันนี้ของห้องที่เข้าสู่ระบบและสต็อกห้องล่าสุด</p>
            <dl class="teacher-parity-grid">
                <div class="teacher-parity-card"><dt>นักเรียน</dt><dd id="teacher-overview-students">0</dd></div>
                <div class="teacher-parity-card"><dt>ดื่มนมวันนี้</dt><dd id="teacher-overview-present">0</dd></div>
                <div class="teacher-parity-card"><dt>ไม่ดื่มนมวันนี้</dt><dd id="teacher-overview-absent">0</dd></div>
                <div class="teacher-parity-card"><dt>สต็อกห้อง</dt><dd id="teacher-overview-room-stock">0 กล่อง</dd></div>
            </dl>
            <p id="teacher-overview-status" class="status" aria-live="polite"></p>`;
        this.insertBeforeActions(shell, panel);
    }

    ensureStudentReportPanel(shell) {
        if (this.element("student-report-panel")) {
            return;
        }
        const panel = this.document.createElement("section");
        panel.id = "student-report-panel";
        panel.className = "teacher-parity-panel";
        panel.hidden = true;
        panel.innerHTML = `
            <h3>รายงานนักเรียน</h3>
            <p class="teacher-parity-intro">โหลดประวัติของนักเรียนหนึ่งคน เฉพาะห้องและช่วงวันที่ที่เลือก</p>
            <div class="teacher-parity-toolbar">
                <div><label for="student-report-student">นักเรียน</label><select id="student-report-student"></select></div>
                <div><label for="student-report-start-date">วันที่เริ่มต้น</label><input id="student-report-start-date" type="date" required></div>
                <div><label for="student-report-end-date">วันที่สิ้นสุด</label><input id="student-report-end-date" type="date" required></div>
                <button id="student-report-load-button" type="button">โหลดรายงาน</button>
            </div>
            <p id="student-report-identity" class="attendance-report-identity"></p>
            <dl class="teacher-parity-grid">
                <div class="teacher-parity-card"><dt>วันที่มีข้อมูล</dt><dd id="student-report-days">0</dd></div>
                <div class="teacher-parity-card"><dt>ดื่มนม</dt><dd id="student-report-present">0</dd></div>
                <div class="teacher-parity-card"><dt>ไม่ดื่มนม</dt><dd id="student-report-absent">0</dd></div>
                <div class="teacher-parity-card"><dt>อัตราดื่มนม</dt><dd id="student-report-rate">—</dd></div>
            </dl>
            <p id="student-report-status" class="status" data-state="idle" aria-live="polite"></p>
            <p id="student-report-error" class="error" role="alert" hidden></p>
            <div id="student-report-timeline"></div>
            <div class="teacher-parity-actions"><button id="student-report-print-button" type="button" disabled>พิมพ์รายงานนักเรียน A4</button></div>`;
        this.insertBeforeActions(shell, panel);
    }

    ensureRoomStockPanel(shell) {
        if (this.element("room-stock-detail-panel")) {
            return;
        }
        const panel = this.document.createElement("section");
        panel.id = "room-stock-detail-panel";
        panel.className = "teacher-parity-panel";
        panel.hidden = true;
        panel.innerHTML = `
            <h3>สต็อกนมคงเหลือ</h3>
            <p class="teacher-parity-intro">แสดงค่าจริงจากสต็อกห้องที่เข้าสู่ระบบเท่านั้น ไม่มีการคำนวณหรือปรับยอด</p>
            <dl class="teacher-parity-grid">
                <div class="teacher-parity-card"><dt>ห้องเรียน</dt><dd id="room-stock-detail-room">—</dd></div>
                <div class="teacher-parity-card"><dt>คงเหลือ</dt><dd id="room-stock-detail-balance">—</dd></div>
                <div class="teacher-parity-card"><dt>ปรับปรุงล่าสุด</dt><dd id="room-stock-detail-updated">ไม่พบเวลา</dd></div>
                <div class="teacher-parity-card"><dt>สถานะ</dt><dd>อ่านอย่างเดียว</dd></div>
            </dl>
            <p id="room-stock-detail-status" class="status" data-state="idle" aria-live="polite"></p>
            <p id="room-stock-detail-error" class="error" role="alert" hidden></p>
            <div class="teacher-parity-actions"><button id="room-stock-detail-refresh" type="button">อัปเดตสต็อกล่าสุด</button></div>`;
        this.insertBeforeActions(shell, panel);
    }

    ensureSettingsPanel(shell) {
        if (this.element("teacher-settings-panel")) {
            return;
        }
        const panel = this.document.createElement("section");
        panel.id = "teacher-settings-panel";
        panel.className = "teacher-parity-panel";
        panel.hidden = true;
        panel.innerHTML = `
            <h3>ตั้งค่าหน้าครู</h3>
            <section class="teacher-settings-surface" aria-labelledby="teacher-profile-title">
                <h4 id="teacher-profile-title">👤 ข้อมูลครูประจำชั้น (แก้ไขได้)</h4>
                <p class="teacher-parity-intro">ชื่อครูจะบันทึกในข้อมูลห้องเรียนเดียวกับระบบผู้ดูแล และนำไปแสดงในหน้าครูและรายงานครั้งถัดไป</p>
                <div class="teacher-profile-grid">
                    <div><label for="teacher-profile-room">ห้องเรียน</label><input id="teacher-profile-room" type="text" readonly></div>
                    <div><label for="teacher-profile-name">ชื่อ-สกุล ครูประจำชั้น *</label><input id="teacher-profile-name" type="text" maxlength="120" required></div>
                </div>
                <p id="teacher-profile-status" class="status" data-state="idle" aria-live="polite"></p>
                <p id="teacher-profile-error" class="error" role="alert" hidden></p>
                <div class="teacher-profile-actions"><button id="teacher-profile-save" type="button">💾 บันทึกข้อมูลครู</button></div>
            </section>
            <section class="teacher-settings-surface" aria-labelledby="teacher-display-settings-title">
                <h4 id="teacher-display-settings-title">การแสดงผลในอุปกรณ์นี้</h4>
                <p class="teacher-parity-intro">ส่วนนี้บันทึกเฉพาะค่าการแสดงผล ไม่แก้ข้อมูลโรงเรียน ห้องเรียน หรือสต็อก</p>
                <div class="teacher-settings-grid">
                    <div class="teacher-settings-option">
                        <label for="teacher-settings-report-days">ช่วงรายงานเริ่มต้น</label>
                        <select id="teacher-settings-report-days">
                            <option value="15">15 วัน</option>
                            <option value="30">30 วัน</option>
                            <option value="90">90 วัน</option>
                        </select>
                    </div>
                    <div class="teacher-settings-option"><label><input id="teacher-settings-compact" type="checkbox"> แสดงผลแบบกระชับ</label></div>
                    <div class="teacher-settings-option"><label><input id="teacher-settings-remember" type="checkbox"> จำเมนูล่าสุดในอุปกรณ์นี้</label></div>
                </div>
                <p id="teacher-settings-status" class="status" data-state="idle" aria-live="polite"></p>
                <p id="teacher-settings-error" class="error" role="alert" hidden></p>
                <div class="teacher-parity-actions"><button id="teacher-settings-save" type="button">บันทึกการตั้งค่าการแสดงผล</button></div>
            </section>`;
        this.insertBeforeActions(shell, panel);
    }

    insertBeforeActions(shell, panel) {
        const actions = this.element("teacher-logout-button")?.parentElement;
        actions && shell.insertBefore
            ? shell.insertBefore(panel, actions)
            : shell.appendChild(panel);
    }

    navigationItems() {
        return this.navigationGroups().flatMap(group => group.items);
    }

    navigationGroups() {
        return [
            {
                label: "หน้าหลัก",
                items: [{ id: "overview", label: "ภาพรวมการดื่มนม", icon: "📊" }]
            },
            {
                label: "บันทึกและรายงาน",
                items: [
                    { id: "attendance", label: "เช็กดื่มนมรายวัน", icon: "🥛" },
                    { id: "history", label: "ประวัติการเช็ก", icon: "📅" },
                    { id: "summary", label: "สรุปรายงาน", icon: "📋" },
                    { id: "print", label: "พิมพ์รายงาน A4", icon: "🖨️" },
                    { id: "student-report", label: "รายงานนักเรียน", icon: "👥" }
                ]
            },
            {
                label: "จ่ายนม",
                items: [
                    { id: "pending", label: "นมค้างรายสัปดาห์", icon: "🧾" },
                    { id: "retroactive", label: "จ่ายนมย้อนหลัง", icon: "↩️" },
                    { id: "vacation", label: "จ่ายนมช่วงปิดเทอม", icon: "🏖️" }
                ]
            },
            {
                label: "ระบบ",
                items: [
                    { id: "room-stock", label: "สต็อกนมคงเหลือ", icon: "📦" },
                    { id: "settings", label: "ตั้งค่า", icon: "⚙️" },
                    { id: "logout", label: "ออกจากระบบ", icon: "🚪" }
                ]
            }
        ];
    }

    bindEvents() {
        if (this.bound) {
            return;
        }
        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.eventTarget.addEventListener?.("milkapp:teacher-refreshed", this.handleTeacherRefreshed);
        this.element("teacher-parity-nav")?.addEventListener?.("click", this.handleNavigation);
        this.element("teacher-parity-topbar")?.addEventListener?.("click", this.handleNavigation);
        this.element("student-report-load-button")?.addEventListener?.("click", this.handleStudentReportLoad);
        this.element("student-report-print-button")?.addEventListener?.("click", this.handleStudentReportPrint);
        this.element("room-stock-detail-refresh")?.addEventListener?.("click", this.handleRoomStockRefresh);
        this.element("teacher-settings-save")?.addEventListener?.("click", this.handleSettingsSave);
        this.element("teacher-profile-save")?.addEventListener?.("click", this.handleTeacherProfileSave);
        this.bound = true;
    }

    handleLoginSuccess(event) {
        const session = event?.detail?.session;
        session?.role === "teacher" ? this.activate(session) : this.clear();
    }

    handleLogout() {
        this.clear();
    }

    handleTeacherRefreshed() {
        if (this.activeSession?.role === "teacher") {
            const session = this.authService.getSession() || this.activeSession;
            this.activeSession = { ...session };
            this.renderSidebarIdentity(session);
            this.renderTeacherProfile(session);
            this.renderOverview();
            this.populateStudents();
        }
    }

    handleNavigation(event) {
        const button = event?.target?.closest?.("[data-teacher-section]");
        const section = button?.dataset?.teacherSection;
        if (!section) {
            return;
        }
        if (section === "logout") {
            this.manager.logout();
            return;
        }
        this.showSection(section);
        this.manager.rememberSection(section);
    }

    activate(session) {
        this.activeSession = { ...session };
        this.element("teacher-parity-topbar")?.removeAttribute?.("hidden");
        this.element("teacher-parity-nav")?.removeAttribute?.("hidden");
        this.renderSidebarIdentity(session);
        this.renderTeacherProfile(session);
        this.renderOverview();
        this.populateStudents();
        const preferences = this.manager.getPreferences();
        this.renderPreferences(preferences);
        this.applyPreferences(preferences);
        this.setDefaultRange(preferences.defaultReportDays);
        this.showSection(preferences.rememberLastSection ? preferences.lastSection : "overview", false);
    }

    showSection(section, focus = true) {
        const mapping = {
            overview: ["teacher-overview-panel", "sync-panel"],
            attendance: ["attendance-panel"],
            history: ["attendance-report-panel"],
            summary: ["attendance-report-panel"],
            print: ["attendance-report-panel"],
            pending: ["pending-milk-panel"],
            retroactive: ["retroactive-milk-panel"],
            vacation: ["vacation-milk-panel"],
            "student-report": ["student-report-panel"],
            "room-stock": ["room-stock-detail-panel"],
            settings: ["teacher-settings-panel"]
        };
        const targetPanels = new Set(mapping[section] || mapping.overview);
        this.panelIds.forEach(id => {
            const panel = this.element(id);
            if (!panel) {
                return;
            }
            targetPanels.has(id)
                ? panel.removeAttribute?.("hidden")
                : panel.setAttribute?.("hidden", "");
        });
        this.updateNavigationState(section);
        this.activeSection = section;
        if (section === "room-stock") {
            this.renderRoomStock(this.manager.parityService.buildRoomStock(
                this.teacherManager.getSnapshot() || {}
            ));
        }
        if (focus) {
            this.focusSection(section);
        }
    }

    updateNavigationState(section) {
        const buttons = this.element("teacher-parity-nav")?.querySelectorAll?.("[data-teacher-section]") || [];
        buttons.forEach(button => {
            button.dataset.teacherSection === section
                ? button.setAttribute?.("aria-current", "page")
                : button.removeAttribute?.("aria-current");
        });
    }

    focusSection(section) {
        const targetId = {
            history: "attendance-report-daily-title",
            summary: "attendance-report-student-title",
            print: "attendance-report-print-button"
        }[section] || ({
            overview: "teacher-overview-panel",
            attendance: "attendance-panel",
            pending: "pending-milk-panel",
            retroactive: "retroactive-milk-panel",
            vacation: "vacation-milk-panel",
            "student-report": "student-report-panel",
            "room-stock": "room-stock-detail-panel",
            settings: "teacher-settings-panel"
        }[section]);
        this.schedule(() => this.element(targetId)?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
    }

    renderOverview() {
        const model = this.manager.getOverview();
        this.setText("teacher-overview-students", model.students);
        this.setText("teacher-overview-present", model.present);
        this.setText("teacher-overview-absent", model.absent);
        this.setText("teacher-overview-room-stock", `${this.formatNumber(model.roomStock)} กล่อง`);
        this.setText(
            "teacher-overview-status",
            model.date ? `ข้อมูลการเช็กวันที่ ${this.formatDate(model.date)}` : "ยังไม่มีข้อมูลการเช็กของวันนี้"
        );
    }

    renderSidebarIdentity(session = this.activeSession || {}) {
        const snapshot = this.teacherManager.getSnapshot() || {};
        const room = snapshot.room || session.roomSnapshot || {};
        const settings = snapshot.settings || {};
        const schoolName = session.schoolName || settings.schoolName || "โรงเรียน";
        const teacher = session.teacher || room.teacher || "ครูประจำชั้น";
        const roomName = session.roomName || room.name || session.roomId || "ห้องเรียน";
        this.setText(
            "teacher-sidebar-school",
            schoolName
        );
        this.setText("teacher-sidebar-teacher", teacher);
        this.setText("teacher-sidebar-room", roomName);
        this.setText("teacher-sidebar-footer-teacher", teacher);
        this.setText("teacher-sidebar-footer-room", roomName);
        this.setText("teacher-topbar-school", schoolName);
        this.setText("teacher-topbar-room", roomName);
    }

    renderTeacherProfile(session = this.activeSession || {}) {
        const snapshot = this.teacherManager.getSnapshot() || {};
        const room = snapshot.room || session.roomSnapshot || {};
        this.setValue(
            "teacher-profile-room",
            session.roomName || room.name || session.roomId || ""
        );
        this.setValue(
            "teacher-profile-name",
            session.teacher || snapshot.session?.teacher || room.teacher || ""
        );
    }

    populateStudents() {
        const select = this.element("student-report-student");
        if (!select) {
            return;
        }
        const snapshot = this.teacherManager.getSnapshot() || {};
        const students = Array.isArray(snapshot.students)
            ? snapshot.students
            : Object.values(snapshot.students || {});
        const current = String(select.value || "");
        select.innerHTML = `<option value="">-- เลือกนักเรียน --</option>${students.map(student => {
            const id = this.escape(student.id || student.studentId || student["รหัส"] || "");
            const num = this.escape(student.num || student.no || student["เลขที่"] || "");
            const name = this.escape(student.name || student["ชื่อ-นามสกุล"] || id);
            return `<option value="${id}">${num ? `${num} · ` : ""}${name}</option>`;
        }).join("")}`;
        if (students.some(student => String(student.id || student.studentId || student["รหัส"] || "") === current)) {
            select.value = current;
        }
    }

    setDefaultRange(days) {
        const range = this.manager.parityService.defaultRange(days);
        this.setValue("student-report-start-date", range.startDate);
        this.setValue("student-report-end-date", range.endDate);
    }

    async handleStudentReportLoad() {
        this.setStudentBusy(true);
        this.clearError("student-report-error");
        try {
            const report = await this.manager.loadStudentReport({
                studentId: this.value("student-report-student"),
                startDate: this.value("student-report-start-date"),
                endDate: this.value("student-report-end-date")
            });
            this.currentStudentReport = report;
            this.renderStudentReport(report);
        } catch (error) {
            this.currentStudentReport = null;
            this.renderError("student-report-error", "student-report-status", error);
        } finally {
            this.setStudentBusy(false);
        }
    }

    renderStudentReport(report = {}) {
        const metadata = report.metadata || {};
        const totals = report.totals || {};
        this.setText(
            "student-report-identity",
            `${metadata.schoolName || "โรงเรียน"} · ห้อง ${metadata.roomName || "—"} · ${metadata.studentName || "นักเรียน"}`
        );
        this.setText("student-report-days", totals.schoolDays || 0);
        this.setText("student-report-present", totals.present || 0);
        this.setText("student-report-absent", totals.absent || 0);
        this.setText("student-report-rate", totals.attendanceRate === null ? "—" : `${totals.attendanceRate}%`);
        const timeline = this.element("student-report-timeline");
        if (timeline) {
            timeline.innerHTML = report.timeline?.length
                ? `<div class="teacher-parity-table-wrap"><table class="teacher-parity-table">
                    <thead><tr><th>วันที่</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead>
                    <tbody>${report.timeline.map(row => `<tr>
                        <td>${this.escape(this.formatDate(row.date))}</td>
                        <td>${this.escape(this.statusLabel(row.status))}</td>
                        <td class="note">${this.escape(row.note || "—")}</td>
                    </tr>`).join("")}</tbody>
                </table></div>`
                : '<p class="attendance-report-empty">ไม่พบข้อมูลในช่วงวันที่ที่เลือก</p>';
        }
        const button = this.element("student-report-print-button");
        if (button) {
            button.disabled = false;
        }
        this.setStatus("student-report-status", `โหลดรายงานนักเรียนสำเร็จ ${totals.schoolDays || 0} วัน`, "success");
    }

    handleStudentReportPrint() {
        if (!this.currentStudentReport) {
            this.renderError(
                "student-report-error",
                "student-report-status",
                new Error("กรุณาโหลดรายงานนักเรียนก่อนพิมพ์")
            );
            return;
        }
        try {
            const printWindow = this.openWindow("", "_blank");
            if (!printWindow?.document) {
                throw new Error("เบราว์เซอร์ปิดกั้นหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up");
            }
            printWindow.document.write(this.studentPrintDocument(this.currentStudentReport));
            printWindow.document.close();
            this.schedule(() => {
                printWindow.focus?.();
                printWindow.print?.();
            });
        } catch (error) {
            this.renderError("student-report-error", "student-report-status", error);
        }
    }

    studentPrintDocument(report = {}) {
        const metadata = report.metadata || {};
        const totals = report.totals || {};
        const pages = this.chunk(report.timeline || [], 28);
        const safePages = pages.length ? pages : [[]];
        const body = safePages.map((rows, index) => `
            <section class="page${index < safePages.length - 1 ? " break" : ""}">
                <header><h1>รายงานนักเรียน</h1><h2>${this.escape(metadata.schoolName || "โรงเรียน")}</h2>
                    <p>ห้อง ${this.escape(metadata.roomName || "—")} · ${this.escape(metadata.teacher || "ครูประจำชั้น")}</p>
                    <p>เลขที่ ${this.escape(metadata.studentNumber || "—")} · ${this.escape(metadata.studentName || "นักเรียน")}</p>
                    <p>${this.escape(this.formatDate(metadata.startDate))} ถึง ${this.escape(this.formatDate(metadata.endDate))}</p>
                </header>
                <div class="totals">ดื่มนม ${totals.present || 0} · ไม่ดื่มนม ${totals.absent || 0} · ยังไม่ตรวจ ${totals.unchecked || 0} · อัตราดื่มนม ${totals.attendanceRate === null ? "—" : `${totals.attendanceRate}%`}</div>
                <table><thead><tr><th>วันที่</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead>
                    <tbody>${rows.map(row => `<tr><td>${this.escape(this.formatDate(row.date))}</td><td>${this.escape(this.statusLabel(row.status))}</td><td class="note">${this.escape(row.note || "—")}</td></tr>`).join("")}</tbody>
                </table>
                <footer><span>พิมพ์เมื่อ ${this.escape(this.formatTimestamp(this.now()))}</span><span>หน้า ${index + 1} / ${safePages.length}</span></footer>
            </section>`).join("");
        return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>รายงานนักเรียน</title><style>
            @page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;color:#111;font-family:"Sarabun","Noto Sans Thai",sans-serif;font-size:10pt}
            .page{min-height:277mm;display:flex;flex-direction:column}.break{break-after:page;page-break-after:always}header{text-align:center;margin-bottom:4mm}
            h1,h2,p{margin:1mm}.totals{margin-bottom:4mm;padding:3mm;border:1px solid #999;text-align:center;font-weight:700}
            table{width:100%;border-collapse:collapse}th,td{padding:2.2mm;border:1px solid #777;text-align:center}td.note{text-align:left}footer{display:flex;justify-content:space-between;margin-top:auto;padding-top:4mm}
        </style></head><body>${body}</body></html>`;
    }

    async handleRoomStockRefresh() {
        this.setStatus("room-stock-detail-status", "กำลังอัปเดตสต็อกห้อง...", "idle");
        this.clearError("room-stock-detail-error");
        try {
            this.renderRoomStock(await this.manager.refreshRoomStock());
        } catch (error) {
            this.renderError("room-stock-detail-error", "room-stock-detail-status", error);
        }
    }

    renderRoomStock(model = {}) {
        this.setText("room-stock-detail-room", model.roomName || "—");
        this.setText("room-stock-detail-balance", `${this.formatNumber(model.balance)} กล่อง`);
        this.setText("room-stock-detail-updated", this.formatTimestamp(model.updatedAt) || "ไม่พบเวลา");
        this.setStatus("room-stock-detail-status", "แสดงค่าจริงแบบอ่านอย่างเดียว", "success");
    }

    handleSettingsSave() {
        this.clearError("teacher-settings-error");
        try {
            const saved = this.manager.savePreferences({
                defaultReportDays: Number(this.value("teacher-settings-report-days")),
                compactMode: Boolean(this.element("teacher-settings-compact")?.checked),
                rememberLastSection: Boolean(this.element("teacher-settings-remember")?.checked),
                lastSection: this.activeSection
            });
            this.renderPreferences(saved);
            this.applyPreferences(saved);
            this.setDefaultRange(saved.defaultReportDays);
            this.setStatus("teacher-settings-status", "บันทึกการตั้งค่าในอุปกรณ์นี้แล้ว", "success");
        } catch (error) {
            this.renderError("teacher-settings-error", "teacher-settings-status", error);
        }
    }

    async handleTeacherProfileSave() {
        const button = this.element("teacher-profile-save");
        if (button) {
            button.disabled = true;
        }
        this.clearError("teacher-profile-error");
        this.setStatus("teacher-profile-status", "กำลังบันทึกข้อมูลครู...", "idle");
        try {
            const saved = await this.manager.saveTeacherProfile({
                teacher: this.value("teacher-profile-name")
            });
            this.activeSession = {
                ...(this.activeSession || {}),
                teacher: saved.teacher
            };
            this.renderSidebarIdentity(this.activeSession);
            this.renderTeacherProfile(this.activeSession);
            this.setText("teacher-name", saved.teacher);
            this.setStatus("teacher-profile-status", "บันทึกข้อมูลครูประจำชั้นแล้ว", "success");
        } catch (error) {
            this.renderError("teacher-profile-error", "teacher-profile-status", error);
        } finally {
            if (button) {
                button.disabled = false;
            }
        }
    }

    renderPreferences(preferences = {}) {
        this.setValue("teacher-settings-report-days", preferences.defaultReportDays || 30);
        if (this.element("teacher-settings-compact")) {
            this.element("teacher-settings-compact").checked = preferences.compactMode === true;
        }
        if (this.element("teacher-settings-remember")) {
            this.element("teacher-settings-remember").checked = preferences.rememberLastSection !== false;
        }
    }

    applyPreferences(preferences = {}) {
        this.element("teacher-shell")?.classList?.toggle?.(
            "teacher-compact-mode",
            preferences.compactMode === true
        );
    }

    setStudentBusy(busy) {
        const panel = this.element("student-report-panel");
        panel?.setAttribute?.("aria-busy", String(Boolean(busy)));
        const load = this.element("student-report-load-button");
        if (load) {
            load.disabled = Boolean(busy);
        }
    }

    renderError(errorId, statusId, error) {
        const target = this.element(errorId);
        if (target) {
            target.textContent = error?.message || "ไม่สามารถดำเนินการได้";
            target.hidden = false;
        }
        this.setStatus(statusId, "ไม่สามารถดำเนินการได้", "error");
    }

    clearError(errorId) {
        const target = this.element(errorId);
        if (target) {
            target.textContent = "";
            target.hidden = true;
        }
    }

    setStatus(id, message, state = "idle") {
        const target = this.element(id);
        if (target) {
            target.textContent = String(message || "");
            target.dataset.state = state;
        }
    }

    clear() {
        this.activeSession = null;
        this.activeSection = "overview";
        this.currentStudentReport = null;
        this.manager?.clear?.();
        this.element("teacher-parity-topbar")?.setAttribute?.("hidden", "");
        this.element("teacher-parity-nav")?.setAttribute?.("hidden", "");
        [
            "teacher-overview-panel",
            "student-report-panel",
            "room-stock-detail-panel",
            "teacher-settings-panel"
        ].forEach(id => this.element(id)?.setAttribute?.("hidden", ""));
    }

    getState() {
        return {
            initialized: this.initialized,
            active: this.activeSession?.role === "teacher",
            section: this.activeSection,
            studentReportLoaded: Boolean(this.currentStudentReport)
        };
    }

    statusLabel(status) {
        return { present: "ดื่มนม", absent: "ไม่ดื่มนม", unchecked: "ยังไม่ตรวจ" }[status] || "ยังไม่ตรวจ";
    }

    formatNumber(value) {
        const number = Number(value);
        return Number.isFinite(number)
            ? new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(number)
            : "—";
    }

    formatDate(value) {
        const text = String(value || "");
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[3]}/${match[2]}/${Number(match[1]) + 543}` : text;
    }

    formatTimestamp(value) {
        const text = String(value || "").trim();
        if (!text) {
            return "";
        }
        const date = new Date(text);
        return Number.isNaN(date.getTime())
            ? text
            : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
    }

    chunk(rows, size) {
        const result = [];
        for (let index = 0; index < rows.length; index += size) {
            result.push(rows.slice(index, index + size));
        }
        return result;
    }

    escape(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    value(id) {
        return String(this.element(id)?.value || "").trim();
    }

    setValue(id, value) {
        const target = this.element(id);
        if (target) {
            target.value = String(value ?? "");
        }
    }

    setText(id, value) {
        const target = this.element(id);
        if (target) {
            target.textContent = String(value ?? "");
        }
    }

    element(id) {
        return this.document?.getElementById?.(id) || null;
    }
}

window.TeacherParityViewClass = TeacherParityView;
window.TeacherParityView = new TeacherParityView();

class SignaturePad {
    constructor(canvas, policy = window.MediaPolicy, options = {}) {
        if (!canvas?.getContext) {
            throw new Error("A signature canvas is required.");
        }
        if (!policy?.validateSignature || !policy?.dataUrlByteLength) {
            throw new Error("MediaPolicy is required for signature validation.");
        }

        this.canvas = canvas;
        this.policy = policy;
        this.window = options.window || window;
        this.maxWidth = this.positiveInteger(options.maxWidth, 640);
        this.maxHeight = this.positiveInteger(options.maxHeight, 240);
        this.lineWidth = Number.isFinite(Number(options.lineWidth)) ? Math.max(1, Number(options.lineWidth)) : 2;
        this.strokeStyle = String(options.strokeStyle || "#111827");
        this.context = canvas.getContext("2d");
        if (!this.context) {
            throw new Error("The signature canvas does not support a 2D context.");
        }

        this.strokes = [];
        this.activeStroke = null;
        this.activePointerId = null;
        this.initialized = false;
        this.boundListeners = [];
        this.eventMode = null;
        this.width = 0;
        this.height = 0;

        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    initialize() {
        if (this.initialized) return this.getState();
        this.resize(
            this.canvas.clientWidth || this.canvas.width || this.maxWidth,
            this.canvas.clientHeight || this.canvas.height || this.maxHeight
        );
        this.configureContext();
        this.bindInputEvents();
        this.initialized = true;
        return this.getState();
    }

    resize(width, height) {
        const normalizedWidth = Math.min(this.maxWidth, this.positiveInteger(width, this.maxWidth));
        const normalizedHeight = Math.min(this.maxHeight, this.positiveInteger(height, this.maxHeight));
        this.width = normalizedWidth;
        this.height = normalizedHeight;
        this.canvas.width = normalizedWidth;
        this.canvas.height = normalizedHeight;
        this.configureContext();
        this.redraw();
        return { width: this.width, height: this.height };
    }

    configureContext() {
        this.context.lineWidth = this.lineWidth;
        this.context.lineCap = "round";
        this.context.lineJoin = "round";
        this.context.strokeStyle = this.strokeStyle;
        this.context.fillStyle = this.strokeStyle;
    }

    bindInputEvents() {
        const pointerSupported = typeof this.window?.PointerEvent === "function";
        if (pointerSupported) {
            this.eventMode = "pointer";
            this.listen(this.canvas, "pointerdown", this.handlePointerDown);
            this.listen(this.canvas, "pointermove", this.handlePointerMove);
            this.listen(this.canvas, "pointerup", this.handlePointerUp);
            this.listen(this.canvas, "pointercancel", this.handlePointerUp);
            this.listen(this.canvas, "pointerleave", this.handlePointerUp);
            return;
        }

        this.eventMode = "legacy";
        this.listen(this.canvas, "mousedown", this.handleMouseDown);
        this.listen(this.window, "mousemove", this.handleMouseMove);
        this.listen(this.window, "mouseup", this.handleMouseUp);
        this.listen(this.canvas, "touchstart", this.handleTouchStart, { passive: false });
        this.listen(this.canvas, "touchmove", this.handleTouchMove, { passive: false });
        this.listen(this.canvas, "touchend", this.handleTouchEnd, { passive: false });
        this.listen(this.canvas, "touchcancel", this.handleTouchEnd, { passive: false });
    }

    listen(target, name, listener, options) {
        target?.addEventListener?.(name, listener, options);
        this.boundListeners.push({ target, name, listener, options });
    }

    handlePointerDown(event) {
        if (event?.isPrimary === false) return;
        event?.preventDefault?.();
        this.activePointerId = event?.pointerId ?? 1;
        this.canvas.setPointerCapture?.(this.activePointerId);
        this.beginStroke(this.pointFromClient(event?.clientX, event?.clientY, event?.pressure));
    }

    handlePointerMove(event) {
        if (!this.activeStroke || (event?.pointerId ?? 1) !== this.activePointerId) return;
        event?.preventDefault?.();
        this.extendStroke(this.pointFromClient(event?.clientX, event?.clientY, event?.pressure));
    }

    handlePointerUp(event) {
        if (!this.activeStroke || (event?.pointerId ?? 1) !== this.activePointerId) return;
        event?.preventDefault?.();
        this.endStroke();
        this.canvas.releasePointerCapture?.(this.activePointerId);
        this.activePointerId = null;
    }

    handleMouseDown(event) {
        if (Number(event?.button || 0) !== 0) return;
        event?.preventDefault?.();
        this.beginStroke(this.pointFromClient(event?.clientX, event?.clientY, 0.5));
    }

    handleMouseMove(event) {
        if (!this.activeStroke) return;
        event?.preventDefault?.();
        this.extendStroke(this.pointFromClient(event?.clientX, event?.clientY, 0.5));
    }

    handleMouseUp(event) {
        if (!this.activeStroke) return;
        event?.preventDefault?.();
        this.endStroke();
    }

    handleTouchStart(event) {
        const touch = event?.touches?.[0] || event?.changedTouches?.[0];
        if (!touch) return;
        event?.preventDefault?.();
        this.beginStroke(this.pointFromClient(touch.clientX, touch.clientY, touch.force));
    }

    handleTouchMove(event) {
        if (!this.activeStroke) return;
        const touch = event?.touches?.[0] || event?.changedTouches?.[0];
        if (!touch) return;
        event?.preventDefault?.();
        this.extendStroke(this.pointFromClient(touch.clientX, touch.clientY, touch.force));
    }

    handleTouchEnd(event) {
        if (!this.activeStroke) return;
        event?.preventDefault?.();
        this.endStroke();
    }

    pointFromClient(clientX, clientY, pressure = 0.5) {
        const rect = this.canvas.getBoundingClientRect?.() || {
            left: 0,
            top: 0,
            width: this.width || this.canvas.width || 1,
            height: this.height || this.canvas.height || 1
        };
        const rectWidth = Number(rect.width) || this.width || 1;
        const rectHeight = Number(rect.height) || this.height || 1;
        const x = (Number(clientX || 0) - Number(rect.left || 0)) * this.width / rectWidth;
        const y = (Number(clientY || 0) - Number(rect.top || 0)) * this.height / rectHeight;
        return {
            x: this.clamp(x, 0, this.width),
            y: this.clamp(y, 0, this.height),
            pressure: this.clamp(Number(pressure) || 0.5, 0.1, 1)
        };
    }

    beginStroke(point) {
        if (!point) return;
        const stroke = [point];
        this.strokes.push(stroke);
        this.activeStroke = stroke;
        this.drawPoint(point);
    }

    extendStroke(point) {
        if (!this.activeStroke || !point) return;
        const previous = this.activeStroke[this.activeStroke.length - 1];
        this.activeStroke.push(point);
        this.drawSegment(previous, point);
    }

    endStroke() {
        this.activeStroke = null;
    }

    drawPoint(point) {
        this.context.beginPath();
        this.context.arc(point.x, point.y, Math.max(1, this.lineWidth * point.pressure / 2), 0, Math.PI * 2);
        this.context.fill();
    }

    drawSegment(from, to) {
        this.context.beginPath();
        this.context.moveTo(from.x, from.y);
        this.context.lineTo(to.x, to.y);
        this.context.stroke();
    }

    redraw() {
        this.context.clearRect(0, 0, this.canvas.width || this.width, this.canvas.height || this.height);
        this.configureContext();
        for (const stroke of this.strokes) {
            if (!stroke.length) continue;
            this.drawPoint(stroke[0]);
            for (let index = 1; index < stroke.length; index += 1) {
                this.drawSegment(stroke[index - 1], stroke[index]);
            }
        }
    }

    clear() {
        this.strokes = [];
        this.activeStroke = null;
        this.activePointerId = null;
        this.context.clearRect(0, 0, this.canvas.width || this.width, this.canvas.height || this.height);
        return this.getState();
    }

    isEmpty() {
        return this.strokes.every(stroke => !stroke.length);
    }

    exportSignature(options = {}) {
        const required = options.required !== false;
        if (this.isEmpty()) {
            if (!required) {
                return {
                    id: null,
                    dataUrl: "",
                    mime: "",
                    size: 0,
                    width: this.width,
                    height: this.height,
                    strokeCount: 0,
                    pointCount: 0,
                    empty: true
                };
            }
            throw this.error("SIGNATURE_REQUIRED", "กรุณาลงลายเซ็นก่อนบันทึก");
        }

        const dataUrl = String(this.canvas.toDataURL?.("image/png") || "");
        const validation = this.policy.validateSignature({ dataUrl, mime: "image/png" });
        if (!validation.valid) {
            throw this.error(validation.code || "SIGNATURE_INVALID", validation.message || "ลายเซ็นไม่ถูกต้อง", validation.details);
        }

        const signature = {
            id: this.buildIdentifier(dataUrl),
            dataUrl,
            mime: "image/png",
            size: validation.details.size,
            width: this.width,
            height: this.height,
            strokeCount: this.strokes.length,
            pointCount: this.strokes.reduce((sum, stroke) => sum + stroke.length, 0),
            empty: false
        };
        return signature;
    }

    buildSafeSummary(signature = null) {
        const value = signature || (this.isEmpty() ? null : this.exportSignature());
        if (!value || value.empty) {
            return {
                empty: true,
                id: null,
                mime: "",
                size: 0,
                width: this.width,
                height: this.height,
                strokeCount: 0,
                pointCount: 0
            };
        }
        return {
            empty: false,
            id: value.id,
            mime: value.mime,
            size: value.size,
            width: value.width,
            height: value.height,
            strokeCount: value.strokeCount,
            pointCount: value.pointCount
        };
    }

    buildIdentifier(dataUrl) {
        const strokeText = this.strokes
            .map(stroke => stroke.map(point => `${point.x.toFixed(2)}:${point.y.toFixed(2)}:${point.pressure.toFixed(2)}`).join("|"))
            .join(";");
        const input = `${this.width}x${this.height}:${strokeText}:${dataUrl}`;
        let first = 2166136261;
        let second = 2246822519;
        for (let index = 0; index < input.length; index += 1) {
            const code = input.charCodeAt(index);
            first ^= code;
            first = Math.imul(first, 16777619);
            second ^= code + index;
            second = Math.imul(second, 3266489917);
        }
        return `signature-${this.hex(first)}${this.hex(second)}`;
    }

    destroy() {
        for (const { target, name, listener, options } of this.boundListeners) {
            target?.removeEventListener?.(name, listener, options);
        }
        this.boundListeners = [];
        this.activeStroke = null;
        this.activePointerId = null;
        this.initialized = false;
    }

    getState() {
        return {
            initialized: this.initialized,
            eventMode: this.eventMode,
            empty: this.isEmpty(),
            width: this.width,
            height: this.height,
            strokeCount: this.strokes.length,
            pointCount: this.strokes.reduce((sum, stroke) => sum + stroke.length, 0)
        };
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }

    positiveInteger(value, fallback) {
        const number = Math.round(Number(value));
        return Number.isFinite(number) && number > 0 ? number : fallback;
    }

    clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, Number(value) || 0));
    }

    hex(value) {
        return (value >>> 0).toString(16).padStart(8, "0");
    }
}

window.SignaturePadClass = SignaturePad;

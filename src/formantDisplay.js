export class FormantDisplay {
    constructor(f1Element, f2Element) {
        this.f1Element = f1Element;
        this.f2Element = f2Element;
    }

    update(f1, f2) {
        this.f1Element.textContent = Math.round(f1);
        this.f2Element.textContent = Math.round(f2);
    }

    reset() {
        this.update(0, 0);
    }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Linkage {
    constructor(value) {
        this.set(value);
    }
    set(value) {
        if (value === null) {
            this.value = value;
        }
        else if (!Array.isArray(value)) {
            if (isValidLinkageObject(value)) {
                this.value = value;
            }
            else {
                throw new InvalidLinkageError(value);
            }
        }
        else {
            this.value = [];
            value.forEach(this.add.bind(this));
        }
    }
    add(newValue) {
        if (Array.isArray(this.value)) {
            if (isValidLinkageObject(newValue)) {
                this.value.push(newValue);
            }
            else {
                throw new InvalidLinkageError(newValue);
            }
        }
        else {
            throw new Error("You can only add values to Linkage objects for to-many relationships.");
        }
    }
    empty() {
        this.value = Array.isArray(this.value) ? [] : null;
    }
    toJSON() {
        return this.value;
    }
}
exports.default = Linkage;
class InvalidLinkageError extends Error {
    constructor(value) {
        super("Invalid linkage value: " + JSON.stringify(value));
    }
}
function isValidLinkageObject(it) {
    return typeof it.type === "string" && typeof it.id === "string";
}

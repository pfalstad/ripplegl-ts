/*
    Copyright (C) 2017 by Paul Falstad

    This file is part of RippleGL.

    RippleGL is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    RippleGL is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with RippleGL.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Choice } from "./Choice";
import { Checkbox } from "./Checkbox";

export interface Editable {
    getEditInfo(n: number): EditInfo | null;
    setEditValue(n: number, ei: EditInfo): void;
}

export class EditInfo {
    name: string;
    text: string | null = null;
    value: number;
    textf: HTMLInputElement | null = null;
    choice: Choice | null = null;
    checkbox: Checkbox | null = null;
    button: HTMLButtonElement | null = null;
    textArea: HTMLTextAreaElement | null = null;

    newDialog = false;
    forceLargeM: boolean;
    dimensionless = false;
    noCenti = false;

    // slider (Adjustable) support
    minVal: number;
    maxVal: number;
    noSliders = false;
    minBox: HTMLInputElement | null = null;
    maxBox: HTMLInputElement | null = null;
    labelBox: HTMLInputElement | null = null;
    stepBox: HTMLInputElement | null = null;

    constructor(n: string, val: number, mn: number = 0, mx: number = 0) {
        this.name = n;
        this.value = val;
        this.minVal = mn;
        this.maxVal = mx;
        this.forceLargeM = n.indexOf("(ohms)") > 0 || n.indexOf("(Hz)") > 0;
    }

    setDimensionless(): EditInfo {
        this.dimensionless = true;
        return this;
    }

    setNoCenti(): EditInfo {
        this.noCenti = true;
        return this;
    }

    disallowSliders(): EditInfo {
        this.noSliders = true;
        return this;
    }

    // whether an Adjustable (slider) can be created for this edit item
    canCreateAdjustable(): boolean {
        return this.choice == null && this.checkbox == null && this.button == null &&
            this.textArea == null && !this.noSliders;
    }
}

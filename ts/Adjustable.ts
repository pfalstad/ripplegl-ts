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

// values with sliders
import { DragObject } from "./DragObject";
import { RippleSim } from "./RippleSim";
import { StringTokenizer } from "./StringTokenizer";
import { Scrollbar } from "./Scrollbar";
import { EditDialog } from "./EditDialog";

export class Adjustable {
    elm: DragObject | null;
    minValue: number;
    maxValue: number;
    sliderStep: number; // step increment; 0 = continuous (no stepping)
    sliderText: string;
    logarithmic: boolean;

    // null if this Adjustable has its own slider, non-null if it's sharing another one.
    sharedSlider: Adjustable | null;

    // index of value in getEditInfo() list that this slider controls
    editItem: number;

    labelEl: HTMLElement | null;
    slider: Scrollbar | null;
    settingValue: boolean;

    constructor(elm: DragObject, item: number);
    constructor(st: StringTokenizer, sim: RippleSim);
    constructor(elmOrSt: DragObject | StringTokenizer, itemOrSim: number | RippleSim) {
        this.minValue = 1;
        this.maxValue = 1000;
        this.sliderText = "";
        this.sliderStep = 0;
        this.logarithmic = false;
        this.sharedSlider = null;
        this.labelEl = null;
        this.slider = null;
        this.settingValue = false;
        this.elm = null;
        this.editItem = 0;

        if (elmOrSt instanceof DragObject) {
            const elm = elmOrSt;
            const item = itemOrSim as number;
            this.elm = elm;
            this.editItem = item;
            const ei = elm.getEditInfo(item);
            if (ei != null && ei.maxVal > 0) {
                this.minValue = ei.minVal;
                this.maxValue = ei.maxVal;
            }
        } else {
            // undump
            const st = elmOrSt;
            const sim = itemOrSim as RippleSim;
            const idx = parseInt(st.nextToken());
            if (idx === -1)
                return;
            try {
                this.editItem = parseInt(st.nextToken());
                this.minValue = parseFloat(st.nextToken());
                this.maxValue = parseFloat(st.nextToken());
                const shared = parseInt(st.nextToken());
                this.sharedSlider = shared === -1 ? null : sim.adjustables[shared];
                this.sliderText = decodeURIComponent(st.nextToken());
                this.sliderStep = parseFloat(st.nextToken());
                this.logarithmic = parseInt(st.nextToken()) !== 0;
            } catch (ex) { /* ignored */ }
            this.elm = idx >= 0 && idx < sim.dragObjects.length ? sim.dragObjects[idx] : null;
        }
    }

    createSlider(sim: RippleSim): boolean {
        if (this.elm == null)
            return false;
        const ei = this.elm.getEditInfo(this.editItem);
        if (ei == null)
            return false;
        if (this.sharedSlider != null)
            return true;
        if (this.sliderText.length === 0)
            return false;
        this.createSliderWithValue(sim, ei.value);
        return true;
    }

    createSliderWithValue(sim: RippleSim, value: number): void {
        const lbl = document.createElement("div");
        lbl.textContent = this.sliderText;
        lbl.classList.add("topSpace");
        this.labelEl = lbl;
        sim.addWidgetToVerticalPanel(lbl);
        const intValue = this.valueToSliderPosition(value);
        this.slider = new Scrollbar(Scrollbar.HORIZONTAL, intValue, 1, 0, 101, () => this.execute(),
            (pos) => this.formatSliderPosition(pos));
        sim.addWidgetToVerticalPanel(this.slider.element);
        const barWidth = sim.verticalPanelWidth - RippleSim.SIDEBAR_PADDING * 2;
        this.slider.setWidth(barWidth);
    }

    setSliderValue(value: number): void {
        if (this.sharedSlider != null) {
            this.sharedSlider.setSliderValue(value);
            return;
        }
        if (this.slider == null)
            return;
        const intValue = this.valueToSliderPosition(value);
        this.settingValue = true; // don't recursively set value again in execute()
        this.slider.setValue(intValue);
        this.settingValue = false;
    }

    execute(): void {
        if (this.settingValue)
            return;
        const sim = RippleSim.theSim;
        for (let i = 0; i !== sim.adjustables.length; i++) {
            const adj = sim.adjustables[i];
            if (adj === this || adj.sharedSlider === this)
                adj.executeSlider();
        }
    }

    executeSlider(): void {
        if (this.elm == null) return;
        const ei = this.elm.getEditInfo(this.editItem);
        if (ei == null) return;
        ei.value = this.getSliderValue();
        this.elm.setEditValue(this.editItem, ei);
        RippleSim.theSim.changedWalls = true;
    }

    getSliderValue(): number {
        const val = this.sharedSlider == null
            ? (this.slider ? this.slider.getValue() : 0)
            : (this.sharedSlider.slider ? this.sharedSlider.slider.getValue() : 0);
        let result = this.sliderPositionToValue(val);
        const step = this.sharedSlider != null ? this.sharedSlider.sliderStep : this.sliderStep;
        if (step > 0)
            result = this.minValue + Math.round((result - this.minValue) / step) * step;
        return result;
    }

    // convert a value to a slider position (0-100)
    valueToSliderPosition(value: number): number {
        if (this.logarithmic && this.minValue > 0) {
            const logMin = Math.log(this.minValue);
            const logMax = Math.log(this.maxValue);
            return Math.floor((Math.log(value) - logMin) / (logMax - logMin) * 100);
        }
        return Math.floor((value - this.minValue) * 100 / (this.maxValue - this.minValue));
    }

    // convert a slider position (0-100) to a value
    sliderPositionToValue(pos: number): number {
        if (this.logarithmic && this.minValue > 0) {
            const logMin = Math.log(this.minValue);
            const logMax = Math.log(this.maxValue);
            return Math.exp(logMin + (logMax - logMin) * pos / 100);
        }
        return this.minValue + (this.maxValue - this.minValue) * pos / 100;
    }

    // format a slider position (0-100) as the display text shown on the slider itself
    formatSliderPosition(pos: number): string {
        const value = this.sliderPositionToValue(pos);
        const ei = this.elm == null ? null : this.elm.getEditInfo(this.editItem);
        return ei == null ? String(value) : EditDialog.formatUnits(ei, value);
    }

    deleteSlider(sim: RippleSim): void {
        if (this.labelEl) sim.removeWidgetFromVerticalPanel(this.labelEl);
        if (this.slider) sim.removeWidgetFromVerticalPanel(this.slider.element);
        this.labelEl = null;
        this.slider = null;
    }

    sliderBeingShared(): boolean {
        const sim = RippleSim.theSim;
        for (let i = 0; i !== sim.adjustables.length; i++) {
            if (sim.adjustables[i].sharedSlider === this)
                return true;
        }
        return false;
    }

    dump(): string {
        const sim = RippleSim.theSim;
        const idx = this.elm == null ? -1 : sim.dragObjects.indexOf(this.elm);
        const shared = this.sharedSlider == null ? -1 : sim.adjustables.indexOf(this.sharedSlider);
        return idx + " " + this.editItem + " " + this.minValue + " " + this.maxValue + " " + shared + " " +
            encodeURIComponent(this.sliderText) + " " + this.sliderStep + " " + (this.logarithmic ? 1 : 0);
    }

    // get the name of the edit item this adjustable controls
    getEditItemName(): string {
        if (this.elm == null) return "";
        const ei = this.elm.getEditInfo(this.editItem);
        return ei != null ? ei.name : "";
    }

    // reorder adjustables so that items with sliders come first in the list, followed by items
    // that reference them. this simplifies the UI code, and also makes it much easier to
    // dump/undump the adjustables list, since we will always be undumping the adjustables with
    // sliders first, then the adjustables that reference them.
    static reorderAdjustables(): void {
        const sim = RippleSim.theSim;
        const newList: Adjustable[] = [];
        const oldList = sim.adjustables;
        for (const adj of oldList)
            if (adj.sharedSlider == null)
                newList.push(adj);
        for (const adj of oldList)
            if (adj.sharedSlider != null)
                newList.push(adj);
        sim.adjustables = newList;
    }
}

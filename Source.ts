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

import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { RippleSim } from "./RippleSim";
import { EditInfo } from "./EditInfo";
import { Choice } from "./Choice";
import { EditDialog } from "./EditDialog";

export class Source extends DragObject {
    static readonly WF_SINE = 0;
    static readonly WF_PULSE = 1;
    static readonly WF_PACKET = 2;
    static readonly WF_TRIANGLE = 3;
    static readonly FLAG_STRENGTH = 2;
    static readonly freqScale = 92 / 3 * .5;

    waveform = 0;
    frequency = 0;
    phaseShift = 0;
    freqTimeZero = 0;
    strength = 0;
    // named pulseLength (not length) to avoid colliding with DragObject.length(), the
    // handle-distance method; this is the Source's on-duration for pulse/packet waveforms.
    pulseLength = 0;
    delay = 0;
    startDelay = 0;
    enabled = false;
    frequencyEditInfo: EditInfo | null = null;
    wavelengthEditInfo: EditInfo | null = null;

    constructor();
    constructor(st: StringTokenizer, ct: number);
    constructor(x: number, y: number);
    constructor(arg0?: number | StringTokenizer, arg1?: number) {
        if (arg0 instanceof StringTokenizer) {
            super(arg0);
            let ct = arg1 as number;
            while (ct-- > 0)
                this.handles.push(new DragHandle(this, arg0));
            this.waveform = parseInt(arg0.nextToken());
            this.frequency = parseFloat(arg0.nextToken());
            this.phaseShift = parseFloat(arg0.nextToken());
            this.pulseLength = parseFloat(arg0.nextToken());
            this.delay = parseFloat(arg0.nextToken());
            this.strength = 1;
            if ((this.flags & Source.FLAG_STRENGTH) !== 0) {
                this.strength = parseFloat(arg0.nextToken());
                this.startDelay = parseFloat(arg0.nextToken());
            }
            this.setTransform();
        } else if (arg0 !== undefined) {
            super();
            this.handles.push(new DragHandle(this, arg0, arg1 as number));
            this.frequency = .5;
            this.pulseLength = 10;
            this.delay = 100;
            this.strength = 1;
            this.setTransform();
        } else {
            super();
            this.handles.push(new DragHandle(this));
            this.frequency = .5;

            // get freq from last source if any
            for (let i = this.sim.dragObjects.length - 1; i >= 0; i--) {
                const obj = this.sim.dragObjects[i];
                if (obj instanceof Source) {
                    this.frequency = obj.frequency;
                    break;
                }
            }

            this.pulseLength = 10;
            this.delay = 100;
            this.strength = 1;
            this.setTransform();
        }
    }

    dump(): string {
        this.flags |= Source.FLAG_STRENGTH;
        return super.dump() + " " + this.waveform + " " + this.frequency + " " + this.phaseShift + " " + this.pulseLength + " " +
            this.delay + " " + this.strength + " " + this.startDelay;
    }

    setFrequency(f: number): void {
        const oldfreq = this.frequency;
        this.frequency = f;
        if (this.sim.useFreqTimeZero())
            this.freqTimeZero = this.sim.t - oldfreq * (this.sim.t - this.freqTimeZero) / f;
        else
            this.freqTimeZero = 0;
    }

    triangleFunc(x: number): number {
        const pi = Math.PI;
        x += pi;
        x %= 2 * pi;
        if (x < pi)
            return x * (2 / pi) - 1;
        return 1 - (x - pi) * (2 / pi);
    }

    isSimpleWaveform(): boolean {
        return this.waveform === Source.WF_SINE || this.waveform === Source.WF_TRIANGLE;
    }

    getValue(): number {
        this.enabled = true;
        const t = this.sim.t - this.startDelay;
        if (t < 0)
            return 0;
        if (this.isSimpleWaveform()) {
            const freq = this.frequency;
            const w = freq * (t - this.freqTimeZero) + this.phaseShift;
            if (this.waveform === Source.WF_TRIANGLE)
                return this.triangleFunc(w) * this.strength;
            return Math.cos(w) * this.strength;
        }
        const w = t % (this.pulseLength + this.delay);
        let v = 1;
        if (w > this.pulseLength) {
            this.enabled = false;
            v = 0;
        }
        if (this.waveform === Source.WF_PACKET && v > 0)
            v = Math.cos(this.frequency * this.sim.t) * Math.sin(w * Math.PI / this.pulseLength);
        return v * this.strength;
    }

    run(): void {
        const dh = this.handles[0];
        const v = this.getValue();
        if (this.enabled)
            RippleSim.drawSource(dh.x, dh.y, v);
    }

    draw(): void {
        for (const dh of this.handles)
            RippleSim.drawHandle(dh.x, dh.y);
        super.draw();
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0) {
            const ei = new EditInfo("Waveform", this.waveform, -1, -1);
            ei.choice = new Choice();
            ei.choice.add("Sine");
            ei.choice.add("Pulse");
            ei.choice.add("Packet");
            ei.choice.add("Triangle");
            ei.choice.select(this.waveform);
            return ei;
        }
        if (n === 1)
            return new EditInfo("Strength", this.strength, 0, 1).setDimensionless();
        if (n === 2)
            return new EditInfo("Start Delay (s)", this.sim.timeToRealTime(this.startDelay), 0, 1).setNoCenti();
        if (this.isSimpleWaveform()) {
            if (n === 3)
                return this.frequencyEditInfo = new EditInfo("Frequency (Hz)", this.getRealFrequency(), 4, 500);
            if (n === 4)
                return new EditInfo("Phase Offset (degrees)", this.phaseShift * 180 / Math.PI, -180, 180).setDimensionless();
        } else {
            if (n === 3)
                return new EditInfo("On Duration (s)", this.sim.timeToRealTime(this.pulseLength), 0, 0).setNoCenti();
            if (n === 4)
                return new EditInfo("Off Duration (s)", this.sim.timeToRealTime(this.delay), 0, 0).setNoCenti();
            if (this.waveform === Source.WF_PACKET && n === 5)
                return this.frequencyEditInfo = new EditInfo("Frequency (Hz)", this.getRealFrequency(), 4, 500);
        }
        if ((this.isSimpleWaveform() && n === 5) || (this.waveform === Source.WF_PACKET && n === 6))
            return this.wavelengthEditInfo = new EditInfo("Wavelength (m)", this.getWavelength(), 4, 500);
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0) {
            const ow = this.waveform;
            this.waveform = ei.choice!.getSelectedIndex();
            if (this.waveform !== ow)
                ei.newDialog = true;
        }
        if (n === 1)
            this.strength = ei.value;
        if (n === 2)
            this.startDelay = this.sim.realTimeToTime(ei.value);
        if ((this.isSimpleWaveform() && n === 3) || (this.waveform === Source.WF_PACKET && n === 5)) {
            // adjust time zero to maintain continuity in the waveform
            // even though the frequency has changed.
            const oldfreq = this.frequency;
            const wavelength = this.sim.waveSpeed / ei.value;
            this.frequency = Source.freqScale * this.sim.lengthScale / wavelength;
            this.enforceMaxFrequency();
            if (this.sim.useFreqTimeZero())
                this.freqTimeZero = this.sim.t - oldfreq * (this.sim.t - this.freqTimeZero) / this.frequency;
            else
                this.freqTimeZero = 0;
            this.wavelengthEditInfo!.value = this.getWavelength();
            EditDialog.theEditDialog!.updateValue(this.wavelengthEditInfo!);
        }
        if (this.isSimpleWaveform()) {
            if (n === 4)
                this.phaseShift = ei.value * Math.PI / 180;
        } else {
            if (n === 3)
                this.pulseLength = this.sim.realTimeToTime(ei.value);
            if (n === 4)
                this.delay = this.sim.realTimeToTime(ei.value);
        }
        if ((this.isSimpleWaveform() && n === 5) || (this.waveform === Source.WF_PACKET && n === 6)) {
            // set wavelength
            this.frequency = Source.freqScale * this.sim.lengthScale / ei.value;
            this.enforceMaxFrequency();
            this.frequencyEditInfo!.value = this.getRealFrequency();
            EditDialog.theEditDialog!.updateValue(this.frequencyEditInfo!);
        }
    }

    enforceMaxFrequency(): void {
        // enforce minimum wavelength of 6 pixels
        const maxfreq = Source.freqScale / 6;
        if (this.frequency <= maxfreq)
            return;
        this.frequency = maxfreq;
        this.frequencyEditInfo!.value = this.getRealFrequency();
        EditDialog.theEditDialog!.updateValue(this.frequencyEditInfo!);
        this.wavelengthEditInfo!.value = this.getWavelength();
        EditDialog.theEditDialog!.updateValue(this.wavelengthEditInfo!);
    }

    getWavelength(): number {
        return (Source.freqScale / this.frequency) * this.sim.lengthScale;
    }

    getRealFrequency(): number {
        return this.sim.waveSpeed / this.getWavelength();
    }

    getDumpType(): number { return "s".charCodeAt(0); }

    selectText(): string | null {
        if (!this.isSimpleWaveform())
            return null;
        return RippleSim.getUnitText(this.getRealFrequency(), "Hz") + ", λ = " +
            this.sim.getUnitText(this.getWavelength(), "m");
    }
}

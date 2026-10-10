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

import { Dimension } from "./Dimension";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";
import { Color } from "./Color";
import { Choice } from "./Choice";
import { Checkbox } from "./Checkbox";
import { Scrollbar } from "./Scrollbar";
import { EditDialog } from "./EditDialog";
import { EditOptions } from "./EditOptions";
import type { Editable } from "./EditInfo";
import { AboutBox } from "./AboutBox";
import { ExportAsUrlDialog } from "./ExportAsUrlDialog";
import { ExportAsTextDialog } from "./ExportAsTextDialog";
import { ExportAsLocalFileDialog } from "./ExportAsLocalFileDialog";
import { ImportFromTextDialog } from "./ImportFromTextDialog";
import { LoadFile } from "./LoadFile";
import { QueryParameters } from "./QueryParameters";
import { moduleBaseURL } from "./ModuleBase";
import { StringTokenizer } from "./StringTokenizer";
import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { Wall } from "./Wall";
import { Box } from "./Box";
import { MediumBox } from "./MediumBox";
import { GradientBox } from "./GradientBox";
import { Cavity } from "./Cavity";
import { MediumEllipse } from "./MediumEllipse";
import { Ellipse } from "./Ellipse";
import { SolidBox } from "./SolidBox";
import { Image } from "./Image";
import { MovingWall } from "./MovingWall";
import { MovingSource } from "./MovingSource";
import { ModeBox } from "./ModeBox";
import { TrianglePrism } from "./TrianglePrism";
import { Parabola } from "./Parabola";
import { Lens } from "./Lens";
import { Source } from "./Source";
import { Probe } from "./Probe";
import { LineSource } from "./LineSource";
import { PhasedArraySource } from "./PhasedArraySource";
import { MultipoleSource } from "./MultipoleSource";
import { RotatingSource } from "./RotatingSource";
import { Slit } from "./Slit";
import { Adjustable } from "./Adjustable";
import { SliderDialog } from "./SliderDialog";
import { Graphics } from "./Graphics";
import { Line } from "./Line";
import { Arrow } from "./Arrow";
import { Text } from "./Text";

// the WebGL renderer, defined in renderer.js (loaded as a classic <script>).
// `passCanvas` returns an object with all the drawing/solver callbacks used below.
export let renderer: any = null;

declare global {
    interface Document {
        passCanvas(cv: HTMLCanvasElement): any;
    }
}

interface MenuItemDesc {
    label?: string;
    html?: string;
    action?: () => void;
    element?: HTMLButtonElement;
    separator?: boolean;
    disabled?: boolean;
    children?: MenuItemDesc[]; // if set, this item opens a submenu
}

abstract class Setup {
    abstract getName(): string;
    select(): void {}
}

class FileSetup extends Setup {
    sim: RippleSim;
    title: string;
    file: string;

    constructor(sim: RippleSim, title: string, file: string) {
        super();
        this.sim = sim;
        this.title = title;
        this.file = file;
    }

    select(): void {
        this.sim.readSetupFile(this.file, this.title);
    }

    getName(): string { return this.title; }
}

export class RippleSim {
    static theSim: RippleSim;

    static readonly sourceRadius = 17;
    static readonly freqMult = .0233333 * 5;
    static readonly MODE_DRAW = 0;
    static readonly MODE_DRAW_MINUS = 1;
    static readonly MODE_CLEAR = 2;
    static readonly MODE_HOLD = 3;
    static readonly MODE_HOLD_MINUS = 4;
    static readonly MODE_RULER = 5;
    static readonly WAVE_SOUND = 0;
    static readonly timeStep = .25;
    static readonly MENUBARHEIGHT = 30;
    static readonly MAXVERTICALPANELWIDTH = 166;
    static readonly SIDEBAR_PADDING = 4; // must match #sidebar padding in style.css
    static readonly FASTTIMER = 33;

    static editDialog: EditDialog | null = null;

    // ==================== DOM elements ====================
    appEl!: HTMLElement;
    menuBarEl!: HTMLElement;
    canvasWrapEl!: HTMLElement;
    sidebarEl!: HTMLElement;
    cv!: HTMLCanvasElement;
    coordsLabel!: HTMLElement;
    overlayCv!: HTMLCanvasElement;
    private overlayCtx!: CanvasRenderingContext2D;

    // ==================== simulation state ====================
    winSize!: Dimension;
    gridSizeX = 0;
    gridSizeY = 0;
    gridSizeXY = 0;
    windowWidth = 50;
    windowHeight = 50;
    windowOffsetX = 0;
    windowOffsetY = 0;
    windowBottom = 0;
    windowRight = 0;
    snapGridSize = 0; // 0 = snap-to-grid disabled

    blankButton!: HTMLButtonElement;
    stoppedCheck!: Checkbox;
    view3dCheck!: Checkbox;
    setupChooser!: Choice;
    colorChooser!: Choice;
    waveChooser!: Choice;
    modeChooser!: Choice;
    setupList: Setup[] = [];
    dragObjects: DragObject[] = [];
    selectedObject: DragObject | null = null;
    mouseObject: DragObject | null = null;
    menuObject: DragObject | null = null;
    draggingHandle: DragHandle | null = null;
    setup: Setup | null = null;
    dampingBar!: Scrollbar;
    speedBar!: Scrollbar;
    freqBar!: Scrollbar;
    resBar!: Scrollbar;
    brightnessBar!: Scrollbar;
    dampcoef = 0;
    freqTimeZero = 0;
    brightMult = 1;
    zoom3d = 1.2;
    mouseLocation: Point | null = null;

    dragX = 0; dragY = 0; dragStartX = -1; dragStartY = 0;
    freqBarValue = 0;
    dragging = false;
    dragStop = false;
    changedWalls = false;
    needsRedraw = true;
    ignoreFreqBarSetting = false;
    t = 0;
    lengthScale = 0;
    waveSpeed = 0;
    iters = 0;
    rotationMode = false;
    preserveSelection = false;
    mouseWheelAccum = 0;

    editDialog: EditDialog | null = null;
    sliderDialog: SliderDialog | null = null;
    adjustables: Adjustable[] = [];
    exportAsUrlDialog: ExportAsUrlDialog | null = null;
    exportAsTextDialog: ExportAsTextDialog | null = null;
    exportAsLocalFileDialog: ExportAsLocalFileDialog | null = null;
    importFromTextDialog: ImportFromTextDialog | null = null;
    aboutBox: AboutBox | null = null;

    wallColor!: Color; posColor!: Color; negColor!: Color; zeroColor!: Color;
    medColor!: Color; posMedColor!: Color; negMedColor!: Color; sourceColor!: Color;
    absorbColor!: Color;
    schemeColors: Color[][] = [];
    dragPoint: Point | null = null;
    pokePoint: Point | null = null;
    rulerStart: Point | null = null;
    rulerEnd: Point | null = null;
    pokeValue = 0;

    loadFileInput: LoadFile | null = null;
    imageFileInputEl: HTMLInputElement | null = null;
    ripArea!: Rectangle;
    clipboard = "";
    undoStack: string[] = [];
    redoStack: string[] = [];
    verticalPanelWidth = 0;
    startExampleText: string | null = null;
    startExample: string | null = null;
    versionString = "1.5ts";

    // menu items that need to be enabled/disabled dynamically
    undoItem!: HTMLButtonElement;
    redoItem!: HTMLButtonElement;
    pasteItem!: HTMLButtonElement;
    importFromLocalFileItem!: HTMLButtonElement;
    exportAsLocalFileItem!: HTMLButtonElement;
    elmEditMenuItem!: MenuItemDesc;
    elmRotateMenuItem!: MenuItemDesc;
    elmSliderMenuItem!: MenuItemDesc;
    mainMenuItems: MenuItemDesc[] = [];
    elmMenuItems: MenuItemDesc[] = [];

    private timerHandle: ReturnType<typeof setInterval> | null = null;

    constructor() {
        RippleSim.theSim = this;
    }

    // ==================== static renderer passthroughs ====================
    static console(text: string): void { console.log(text); }

    static passCanvas(cv: HTMLCanvasElement): any { return document.passCanvas(cv); }
    static updateRippleGL(bright: number, threed: boolean): void {
        if (threed) renderer.updateRipple3D(bright); else renderer.updateRipple(bright);
    }
    static simulate(): void { renderer.simulate(); }
    static setAcoustic(ac: boolean): void { renderer.acoustic = ac; }
    static set3dViewAngle(a1: number, a2: number): void { renderer.set3dViewAngle(a1, a2); }
    static set3dViewZoom(zoom: number): void { renderer.set3dViewZoom(zoom); }
    static setResolutionGL(x: number, y: number, wx: number, wy: number): void { renderer.setResolution(x, y, wx, wy); }
    static drawSource(x: number, y: number, value: number): void { renderer.drawSource(x, y, value); }
    static drawHandle(x: number, y: number): void { renderer.drawHandle(x, y); }
    static drawFocus(x: number, y: number): void { renderer.drawFocus(x, y); }
    static drawPoke(x: number, y: number, value: number): void { renderer.drawPoke(x, y, value); }
    static drawLineSource(x1: number, y1: number, x2: number, y2: number, value: number, gauss: boolean): void {
        renderer.drawLineSource(x1, y1, x2, y2, value, gauss);
    }
    static drawPhasedArray(x1: number, y1: number, x2: number, y2: number, w1: number, w2: number): void {
        renderer.drawPhasedArray(x1, y1, x2, y2, w1, w2);
    }
    static drawWall(x1: number, y1: number, x2: number, y2: number): void { renderer.drawWall(x1, y1, x2, y2); }
    static getProbeValue(x: number, y: number): number { return renderer.getProbeValue(x, y); }
    static clearWall(x1: number, y1: number, x2: number, y2: number): void { renderer.clearWall(x1, y1, x2, y2); }
    static drawEllipse(x1: number, y1: number, rx: number, ry: number): void { renderer.drawEllipse(x1, y1, rx, ry); }
    static drawParabola(x1: number, y1: number, w: number, h: number): void { renderer.drawParabola(x1, y1, w, h); }
    static drawLens(x1: number, y1: number, w: number, h: number, med: number): void { renderer.drawLens(x1, y1, w, h, med); }
    static setDrawingSelection(ds: number): void { renderer.drawingSelection = ds; }
    static setDrawingColor(r: number, g: number, b: number, a: number): void { renderer.drawingColor = [r, g, b, a]; }
    static setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        renderer.setTransform(a, b, c, d, e, f);
    }
    static drawSolidEllipse(x1: number, y1: number, rx: number, ry: number, med: number, absorb?: number): void {
        renderer.drawSolidEllipse(x1, y1, rx, ry, med, absorb);
    }
    static drawMedium(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number,
        med: number, med2: number, absorb1?: number, absorb2?: number): void {
        renderer.drawMedium(x1, y1, x2, y2, x3, y3, x4, y4, med, med2, absorb1, absorb2);
    }
    static drawImageMedium(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number,
        source: HTMLCanvasElement): void {
        renderer.drawImageMedium(x1, y1, x2, y2, x3, y3, x4, y4, source);
    }
    static deleteImageTexture(source: HTMLCanvasElement): void { renderer.deleteImageTexture(source); }
    static drawModes(x1: number, y1: number, x2: number, y2: number, a: number, b: number, c: number, d: number): void {
        renderer.drawModes(x1, y1, x2, y2, a, b, c, d);
    }
    static drawTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, med: number): void {
        renderer.drawTriangle(x1, y1, x2, y2, x3, y3, med);
    }
    static doBlank(): void { renderer.doBlank(); }
    static doBlankWalls(): void { renderer.doBlankWalls(); }
    static readPixelsWorks(): boolean { return renderer.readPixelsWorks; }
    static setColors(wallColor: number, posColor: number, negColor: number, zeroColor: number, posMedColor: number,
        negMedColor: number, medColor: number, sourceColor: number, zeroColor3d: number, absorbColor: number): void {
        renderer.setColors(wallColor, posColor, negColor, zeroColor, posMedColor, negMedColor, medColor, sourceColor, zeroColor3d, absorbColor);
    }
    static setDamping(d: number): void { renderer.setDamping(d); }

    static showFormat(v: number): string { return String(Math.round(v * 100) / 100); }
    static shortFormat(v: number): string { return String(Math.round(v * 10) / 10); }

    console(text: string): void { RippleSim.console(text); }

    // ==================== layout / init ====================

    setCanvasSize(): void {
        const fullwidth = document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight - RippleSim.MENUBARHEIGHT;
        let width = fullwidth - RippleSim.MAXVERTICALPANELWIDTH;
        width = height = Math.min(width, height);
        this.winSize = new Dimension(width, height);
        this.verticalPanelWidth = fullwidth - width;
        if (this.sidebarEl)
            this.sidebarEl.style.width = this.verticalPanelWidth + "px";
        if (this.resBar) {
            const barWidth = this.verticalPanelWidth - RippleSim.SIDEBAR_PADDING * 2;
            this.resBar.setWidth(barWidth);
            this.dampingBar.setWidth(barWidth);
            this.speedBar.setWidth(barWidth);
            this.freqBar.setWidth(barWidth);
            this.brightnessBar.setWidth(barWidth);
        }
        if (this.cv) {
            this.cv.style.width = width + "px";
            this.cv.style.height = height + "px";
            this.cv.width = width;
            this.cv.height = height;
        }
        if (this.overlayCv) {
            this.overlayCv.style.width = width + "px";
            this.overlayCv.style.height = height + "px";
            this.overlayCv.width = width;
            this.overlayCv.height = height;
        }
        if (this.coordsLabel)
            this.coordsLabel.style.top = (height - this.coordsLabel.offsetHeight) + "px";
        const h = Math.trunc(height / 5);
        this.ripArea = new Rectangle(0, 0, width, height - h);
    }

    init(): void {
        RippleSim.theSim = this;

        const qp = new QueryParameters();
        let startColorScheme: string | null = null;
        try {
            const cct = qp.getValue("rol");
            if (cct != null)
                this.startExampleText = cct.replace(/%24/g, "$");
            this.startExample = qp.getValue("startExample");
            startColorScheme = qp.getValue("colorScheme");
        } catch (e) { /* ignored */ }

        this.appEl = document.getElementById("app")!;
        this.appEl.innerHTML = "";

        this.menuBarEl = document.createElement("div");
        this.menuBarEl.id = "menubar";
        this.appEl.appendChild(this.menuBarEl);

        const bodyEl = document.createElement("div");
        bodyEl.id = "bodyrow";
        this.appEl.appendChild(bodyEl);

        this.canvasWrapEl = document.createElement("div");
        this.canvasWrapEl.id = "canvasWrap";
        bodyEl.appendChild(this.canvasWrapEl);

        this.cv = document.createElement("canvas");
        this.canvasWrapEl.appendChild(this.cv);
        renderer = RippleSim.passCanvas(this.cv);
        if (!this.cv) {
            this.canvasWrapEl.textContent = "Not working. You need a browser that supports the CANVAS element.";
            return;
        }

        this.overlayCv = document.createElement("canvas");
        this.overlayCv.className = "overlayCanvas";
        this.canvasWrapEl.appendChild(this.overlayCv);
        this.overlayCtx = this.overlayCv.getContext("2d")!;

        this.coordsLabel = document.createElement("div");
        this.coordsLabel.className = "coordsLabel";
        this.coordsLabel.textContent = "(0,0)";
        this.canvasWrapEl.appendChild(this.coordsLabel);

        this.dragObjects = [];
        this.setCanvasSize();

        this.sidebarEl = document.createElement("div");
        this.sidebarEl.id = "sidebar";
        bodyEl.appendChild(this.sidebarEl);

        this.setupList = [];
        this.undoStack = [];
        this.redoStack = [];

        this.setupChooser = new Choice();
        this.setupChooser.addChangeHandler(() => this.onChange(this.setupChooser));
        this.getSetupList();

        this.colorChooser = new Choice();
        this.colorChooser.addChangeHandler(() => this.onChange(this.colorChooser));
        this.colorChooser.addStyleName("topSpace");

        this.waveChooser = new Choice();
        this.waveChooser.add("Waves = Sound");
        this.waveChooser.add("Waves = Visible Light/IR/UV");
        this.waveChooser.add("Waves = AM Radio");
        this.waveChooser.add("Waves = FM Radio");
        this.waveChooser.add("Waves = Microwave");
        this.waveChooser.addChangeHandler(() => this.onChange(this.waveChooser));
        this.waveChooser.addStyleName("topSpace");

        this.modeChooser = new Choice();
        this.modeChooser.add("Mouse = Draw Wave (+)");
        this.modeChooser.add("Mouse = Draw Wave (-)");
        this.modeChooser.add("Mouse = Clear Wave");
        this.modeChooser.add("Mouse = Hold Wave (+)");
        this.modeChooser.add("Mouse = Hold Wave (-)");
        this.modeChooser.add("Mouse = Ruler");
        this.modeChooser.addChangeHandler(() => {
            if (this.modeChooser.getSelectedIndex() !== RippleSim.MODE_RULER) {
                this.rulerStart = null;
                this.rulerEnd = null;
            }
        });

        this.sidebarEl.appendChild(this.setupChooser.element);
        this.sidebarEl.appendChild(this.modeChooser.element);
        this.sidebarEl.appendChild(this.waveChooser.element);
        this.sidebarEl.appendChild(this.colorChooser.element);

        this.blankButton = document.createElement("button");
        this.blankButton.textContent = "Clear Waves";
        this.blankButton.onclick = () => {
            RippleSim.doBlank();
            this.reset();
            this.resetTime();
        };
        this.sidebarEl.appendChild(this.blankButton);

        this.stoppedCheck = new Checkbox("Stopped");
        this.sidebarEl.appendChild(this.stoppedCheck.element);
        this.view3dCheck = new Checkbox("3-D View");
        this.sidebarEl.appendChild(this.view3dCheck.element);

        if (LoadFile.isSupported()) {
            this.loadFileInput = new LoadFile(this);
            this.sidebarEl.appendChild(this.loadFileInput.element);
        }

        if (LoadFile.isSupported()) {
            this.imageFileInputEl = document.createElement("input");
            this.imageFileInputEl.type = "file";
            this.imageFileInputEl.accept = "image/*";
            this.imageFileInputEl.className = "offScreen";
            this.imageFileInputEl.addEventListener("change", () => this.onImageFileSelected());
            this.sidebarEl.appendChild(this.imageFileInputEl);
        }

        const addLabel = (text: string): HTMLElement => {
            const l = document.createElement("div");
            l.textContent = text;
            l.classList.add("topSpace");
            this.sidebarEl.appendChild(l);
            return l;
        };

        const res = 512;
        addLabel("Simulation Speed");
        this.speedBar = new Scrollbar(Scrollbar.HORIZONTAL, 4, 1, 1, 40);
        this.sidebarEl.appendChild(this.speedBar.element);

        addLabel("Resolution");
        this.resBar = new Scrollbar(Scrollbar.HORIZONTAL, res, 5, 384, 1024);
        this.resBar.addClickHandler(() => this.setResolution());
        this.sidebarEl.appendChild(this.resBar.element);
        this.setResolution();

        addLabel("Damping");
        this.dampingBar = new Scrollbar(Scrollbar.HORIZONTAL, 0, 0, 0, 100, () => this.setDamping());
        this.sidebarEl.appendChild(this.dampingBar.element);

        addLabel("Source Frequency");
        this.freqBar = new Scrollbar(Scrollbar.HORIZONTAL, 15, 1, 1, 30, () => { if (!this.ignoreFreqBarSetting) this.setFreq(); });
        this.freqBarValue = 15;
        this.sidebarEl.appendChild(this.freqBar.element);

        addLabel("Brightness");
        this.brightnessBar = new Scrollbar(Scrollbar.HORIZONTAL, 27, 1, 1, 1200);
        this.sidebarEl.appendChild(this.brightnessBar.element);

        const barWidth = this.verticalPanelWidth - RippleSim.SIDEBAR_PADDING * 2;
        this.resBar.setWidth(barWidth);
        this.dampingBar.setWidth(barWidth);
        this.speedBar.setWidth(barWidth);
        this.freqBar.setWidth(barWidth);
        this.brightnessBar.setWidth(barWidth);

        this.createMenus();

        this.schemeColors = [];
        if (this.colorChooser.getItemCount() === 0)
            this.addDefaultColorScheme();
        if (startColorScheme != null) {
            this.decodeColorScheme(startColorScheme);
            this.colorChooser.select(this.colorChooser.getItemCount() - 1);
        }
        this.doColor();
        this.setWaveType();
        this.setDamping();

        this.cv.addEventListener("mousemove", (e) => this.onMouseMove(e));
        this.cv.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.cv.addEventListener("mouseout", (e) => this.onMouseOut(e));
        this.cv.addEventListener("mouseup", (e) => this.onMouseUp(e));
        this.cv.addEventListener("wheel", (e) => this.onMouseWheel(e as WheelEvent), { passive: false });
        this.cv.addEventListener("click", (e) => this.onClick(e));
        this.cv.addEventListener("dblclick", (e) => this.onDoubleClick(e));
        this.cv.addEventListener("contextmenu", (e) => this.onContextMenu(e));
        this.doTouchHandlers(this.cv);

        // when the sim is stopped, updateRipple() skips rendering unless something
        // that could affect the picture has happened; these listeners flag that
        const markDirty = () => { this.needsRedraw = true; };
        for (const evt of ["mousemove", "mousedown", "mouseup", "mouseout", "wheel",
            "touchstart", "touchmove", "click", "input", "change"])
            document.addEventListener(evt, markDirty, { passive: true });
        window.addEventListener("resize", markDirty);

        this.reinit();
        RippleSim.set3dViewZoom(this.zoom3d);
        this.setCanvasSize();

        this.timerHandle = setInterval(() => this.updateRipple(), RippleSim.FASTTIMER);
    }

    repaint(): void {
        this.updateRipple();
    }

    // ==================== menus ====================

    private closeAllDropdowns(): void {
        document.querySelectorAll(".menu-dropdown.open, .menu-submenu.open").forEach(el => el.classList.remove("open"));
    }

    private makeMenuButton(container: HTMLElement, label: string): { btn: HTMLButtonElement, dropdown: HTMLElement } {
        const wrap = document.createElement("div");
        wrap.className = "menu";
        const btn = document.createElement("button");
        btn.className = "menu-label";
        btn.textContent = label;
        const dropdown = document.createElement("div");
        dropdown.className = "menu-dropdown";
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const wasOpen = dropdown.classList.contains("open");
            this.closeAllDropdowns();
            if (!wasOpen) dropdown.classList.add("open");
        });
        wrap.appendChild(btn);
        wrap.appendChild(dropdown);
        container.appendChild(wrap);
        return { btn, dropdown };
    }

    private addMenuItem(dropdown: HTMLElement, desc: MenuItemDesc): HTMLButtonElement {
        return this.renderMenuItem(dropdown, desc, (d) => {
            this.closeAllDropdowns();
            d.action!();
        });
    }

    // build a menu item (or separator, or submenu with its children) into container.
    // onPick is called when a leaf item is chosen.
    private renderMenuItem(container: HTMLElement, desc: MenuItemDesc, onPick: (d: MenuItemDesc) => void): HTMLButtonElement {
        if (desc.separator) {
            const sep = document.createElement("div");
            sep.className = "menu-separator";
            container.appendChild(sep);
            return null as any;
        }
        const item = document.createElement("button");
        item.className = "menu-item";
        if (desc.html != null)
            item.innerHTML = desc.html;
        else
            item.textContent = desc.label!;
        item.disabled = !!desc.disabled;
        desc.element = item;

        if (desc.children == null) {
            item.addEventListener("click", () => onPick(desc));
            container.appendChild(item);
            return item;
        }

        // submenu: opens on hover, or on tap for touch screens
        const wrap = document.createElement("div");
        wrap.className = "menu-submenu";
        item.classList.add("menu-submenu-label");
        const arrow = document.createElement("span");
        arrow.className = "menu-arrow";
        arrow.textContent = "\u25B8";
        item.appendChild(arrow);
        const panel = document.createElement("div");
        panel.className = "menu-subpanel";
        for (const child of desc.children)
            this.renderMenuItem(panel, child, onPick);
        wrap.appendChild(item);
        wrap.appendChild(panel);
        container.appendChild(wrap);

        wrap.addEventListener("mouseenter", () => this.openSubmenu(wrap, panel));
        wrap.addEventListener("mouseleave", () => wrap.classList.remove("open"));
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            this.openSubmenu(wrap, panel);
        });
        return item;
    }

    private openSubmenu(wrap: HTMLElement, panel: HTMLElement): void {
        // close any other submenu open at this level
        for (const sib of Array.from(wrap.parentElement!.children))
            if (sib !== wrap) sib.classList.remove("open");
        wrap.classList.add("open");
        // keep the submenu on screen: open to the left if there's no room on the right,
        // and shift it up if it would run off the bottom
        panel.classList.remove("flip-left");
        panel.style.top = "";
        const rect = panel.getBoundingClientRect();
        if (rect.right > window.innerWidth)
            panel.classList.add("flip-left");
        if (rect.bottom > window.innerHeight)
            panel.style.top = Math.max(window.innerHeight - rect.bottom, -rect.top) + "px";
    }

    composeMainMenu(): MenuItemDesc[] {
        const add = (label: string, item: string): MenuItemDesc =>
            ({ label: label, action: () => this.menuPerformed("main", item) });
        return [
            { label: "Sources", children: [
                add("Point Source", "Source"),
                add("Line Source", "LineSource"),
                add("Multipole Source", "MultipoleSource"),
                add("Phased Array Source", "PhasedArraySource"),
                add("Moving Source", "MovingSource"),
                add("Rotating Source", "RotatingSource"),
            ] },
            { label: "Walls & Obstacles", children: [
                add("Wall", "Wall"),
                add("Slit", "Slit"),
                add("Box", "Box"),
                add("Solid Box", "SolidBox"),
                add("Ellipse", "Ellipse"),
                add("Parabola", "Parabola"),
                add("Cavity", "Cavity"),
                add("Moving Wall", "MovingWall"),
            ] },
            { label: "Media", children: [
                add("Medium", "MediumBox"),
                add("Ellipse Medium", "MediumEllipse"),
                add("Gradient", "GradientBox"),
                add("Prism", "TrianglePrism"),
                add("Lens", "Lens"),
                add("Mode Box", "ModeBox"),
            ] },
            { label: "Measurement", children: [
                add("Probe", "Probe"),
            ] },
            { label: "Annotations", children: [
                add("Text", "Text"),
                add("Line", "Line"),
                add("Arrow", "Arrow"),
            ] },
            { separator: true },
            add("Image...", "Image"),
        ];
    }

    createMenus(): void {
        document.addEventListener("click", () => this.closeAllDropdowns());

        // File menu
        const file = this.makeMenuButton(this.menuBarEl, "File");
        this.addMenuItem(file.dropdown, { label: "New", action: () => this.menuPerformed("file", "new") });
        this.importFromLocalFileItem = this.addMenuItem(file.dropdown, { label: "Open File...", action: () => this.menuPerformed("file", "importfromlocalfile") });
        this.importFromLocalFileItem.disabled = !LoadFile.isSupported();
        this.addMenuItem(file.dropdown, { label: "Import From Text...", action: () => this.menuPerformed("file", "importfromtext") });
        this.addMenuItem(file.dropdown, { label: "Export As Link...", action: () => this.menuPerformed("file", "exportasurl") });
        this.exportAsLocalFileItem = this.addMenuItem(file.dropdown, { label: "Save As...", action: () => this.menuPerformed("file", "exportaslocalfile") });
        this.exportAsLocalFileItem.disabled = !ExportAsLocalFileDialog.downloadIsSupported();
        this.addMenuItem(file.dropdown, { label: "Export As Text...", action: () => this.menuPerformed("file", "exportastext") });
        this.addMenuItem(file.dropdown, { label: "Options...", action: () => this.menuPerformed("file", "Options") });
        this.addMenuItem(file.dropdown, { separator: true });
        this.addMenuItem(file.dropdown, { label: "About...", action: () => this.menuPerformed("file", "about") });

        // Edit menu
        const edithtml = `<div style="display:inline-block;width:80px;">`;
        const edit = this.makeMenuButton(this.menuBarEl, "Edit");
        this.undoItem = this.addMenuItem(edit.dropdown, { html: edithtml + "Undo</div>Ctrl-Z", action: () => this.menuPerformed("edit", "undo") });
        this.redoItem = this.addMenuItem(edit.dropdown, { html: edithtml + "Redo</div>Ctrl-Y", action: () => this.menuPerformed("edit", "redo") });
        this.addMenuItem(edit.dropdown, { separator: true });
        this.addMenuItem(edit.dropdown, { html: edithtml + "Cut</div>Ctrl-X", action: () => this.menuPerformed("edit", "cut") });
        this.addMenuItem(edit.dropdown, { html: edithtml + "Copy</div>Ctrl-C", action: () => this.menuPerformed("edit", "copy") });
        this.pasteItem = this.addMenuItem(edit.dropdown, { html: edithtml + "Paste</div>Ctrl-V", action: () => this.menuPerformed("edit", "paste") });
        this.pasteItem.disabled = true;
        this.addMenuItem(edit.dropdown, { html: edithtml + "Duplicate</div>Ctrl-D", action: () => this.menuPerformed("edit", "duplicate") });
        this.addMenuItem(edit.dropdown, { separator: true });
        this.addMenuItem(edit.dropdown, { html: edithtml + "Select All</div>Ctrl-A", action: () => this.menuPerformed("edit", "selectAll") });

        // Add menu
        const add = this.makeMenuButton(this.menuBarEl, "Add");
        this.mainMenuItems = this.composeMainMenu();
        for (const d of this.mainMenuItems)
            this.addMenuItem(add.dropdown, d);

        // element context menu descriptors (used for canvas right-click / long-press when object selected)
        this.elmEditMenuItem = { label: "Edit...", action: () => this.menuPerformed("elm", "edit") };
        this.elmRotateMenuItem = { label: "Rotate", action: () => this.menuPerformed("elm", "rotate") };
        this.elmSliderMenuItem = { label: "Sliders...", action: () => this.menuPerformed("elm", "sliders") };
        this.elmMenuItems = [
            this.elmEditMenuItem,
            { label: "Cut", action: () => this.menuPerformed("elm", "cut") },
            { label: "Copy", action: () => this.menuPerformed("elm", "copy") },
            { label: "Delete", action: () => this.menuPerformed("elm", "delete") },
            this.elmRotateMenuItem,
            { label: "Duplicate", action: () => this.menuPerformed("elm", "duplicate") },
            this.elmSliderMenuItem,
        ];

        document.addEventListener("keydown", (e) => this.onKeyDown(e));
    }

    onKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT"))
            return;
        const ctrl = e.ctrlKey || e.metaKey;
        if (!ctrl) return;
        switch (e.key.toLowerCase()) {
            case 'z': this.menuPerformed("edit", "undo"); e.preventDefault(); break;
            case 'y': this.menuPerformed("edit", "redo"); e.preventDefault(); break;
            case 'x': this.menuPerformed("edit", "cut"); e.preventDefault(); break;
            case 'c': this.menuPerformed("edit", "copy"); e.preventDefault(); break;
            case 'v': this.menuPerformed("edit", "paste"); e.preventDefault(); break;
            case 'd': this.menuPerformed("edit", "duplicate"); e.preventDefault(); break;
            case 'a': this.menuPerformed("edit", "selectAll"); e.preventDefault(); break;
        }
    }

    // install touch handlers to handle touch events properly on mobile devices, by
    // translating them into synthetic mouse events dispatched on the canvas.
    doTouchHandlers(cv: HTMLCanvasElement): void {
        let lastTap = 0;
        let tmout: ReturnType<typeof setTimeout> | null = null;
        const sim = this;

        cv.addEventListener("touchstart", (e: TouchEvent) => {
            const touch = e.touches[0];
            let etype = "mousedown";
            if (tmout != null) clearTimeout(tmout);
            if (e.timeStamp - lastTap < 300) {
                etype = "dblclick";
            } else {
                tmout = setTimeout(() => sim.longPress(), 1000);
            }
            lastTap = e.timeStamp;
            const mouseEvent = new MouseEvent(etype, { clientX: touch.clientX, clientY: touch.clientY });
            e.preventDefault();
            cv.dispatchEvent(mouseEvent);
        }, { passive: false });

        cv.addEventListener("touchend", (e: TouchEvent) => {
            const mouseEvent = new MouseEvent("mouseup", {});
            e.preventDefault();
            if (tmout != null) clearTimeout(tmout);
            cv.dispatchEvent(mouseEvent);
        }, { passive: false });

        cv.addEventListener("touchmove", (e: TouchEvent) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousemove", { clientX: touch.clientX, clientY: touch.clientY });
            e.preventDefault();
            if (tmout != null) clearTimeout(tmout);
            cv.dispatchEvent(mouseEvent);
        }, { passive: false });
    }

    menuPerformed(menu: string, item: string): void {
        if (item === "about")
            this.aboutBox = new AboutBox(this.versionString);
        if (item === "new")
            this.doNew();
        if (item === "importfromlocalfile") {
            this.pushUndo();
            this.loadFileInput?.click();
        }
        if (item === "importfromtext")
            this.importFromTextDialog = new ImportFromTextDialog(this);
        if (item === "exportasurl")
            this.doExportAsUrl();
        if (item === "exportaslocalfile")
            this.doExportAsLocalFile();
        if (item === "exportastext")
            this.doExportAsText();

        if (item === "undo") this.doUndo();
        if (item === "redo") this.doRedo();
        if (item === "cut") {
            if (menu !== "elm") this.menuObject = null;
            this.doCut();
        }
        if (item === "copy") {
            if (menu !== "elm") this.menuObject = null;
            this.doCopy();
        }
        if (item === "delete") {
            if (menu !== "elm") this.menuObject = null;
            this.doDelete();
        }
        if (item === "paste") this.doPaste(null);
        if (item === "duplicate") {
            if (menu !== "elm") this.menuObject = null;
            this.doDuplicate();
        }
        if (item === "selectAll") this.doSelectAll();

        this.closeContextPanel();
        if (item === "edit") this.doEdit(this.selectedObject!);
        if (item === "rotate" && this.selectedObject != null && this.selectedObject.canRotate())
            this.rotationMode = true;
        if (item === "sliders" && this.selectedObject != null)
            this.doSliders(this.selectedObject);

        if (item === "Image") {
            if (this.imageFileInputEl == null)
                alert("Not supported in this browser.");
            else {
                // the image is added after the file is chosen, so remember where to put it
                this.imagePlacementPoint = this.placementPoint;
                this.imageFileInputEl.click();
            }
        }

        let newObject: DragObject | null = null;
        if (item === "Wall") newObject = new Wall();
        if (item === "Box") newObject = new Box();
        if (item === "MediumBox") newObject = new MediumBox();
        if (item === "GradientBox") newObject = new GradientBox();
        if (item === "Cavity") newObject = new Cavity();
        if (item === "MediumEllipse") newObject = new MediumEllipse();
        if (item === "Ellipse") newObject = new Ellipse();
        if (item === "SolidBox") newObject = new SolidBox();
        if (item === "MovingWall") {
            if (this.waveChooser.getSelectedIndex() === RippleSim.WAVE_SOUND) {
                alert("Moving walls are not supported for acoustic waves.");
                return;
            }
            newObject = new MovingWall();
        }
        if (item === "MovingSource") newObject = new MovingSource();
        if (item === "ModeBox") newObject = new ModeBox();
        if (item === "TrianglePrism") newObject = new TrianglePrism();
        if (item === "Parabola") newObject = new Parabola();
        if (item === "Lens") newObject = new Lens();
        if (item === "Source") newObject = new Source();
        if (item === "Probe") {
            if (!RippleSim.readPixelsWorks()) {
                alert("Not supported in this browser.  Try Chrome.");
                return;
            }
            newObject = new Probe();
        }
        if (item === "LineSource") newObject = new LineSource();
        if (item === "PhasedArraySource") newObject = new PhasedArraySource();
        if (item === "MultipoleSource") newObject = new MultipoleSource();
        if (item === "RotatingSource") newObject = new RotatingSource();
        if (item === "Slit") newObject = new Slit();
        if (item === "Line") newObject = new Line();
        if (item === "Arrow") newObject = new Arrow();
        if (item === "Text") newObject = new Text();
        if (newObject != null) {
            this.pushUndo();
            newObject.setInitialPosition();
            this.dragObjects.push(newObject);
            this.setSelectedObject(newObject);
            this.preserveSelection = true;
        }
        if (item === "Options")
            this.doEdit(new EditOptions(this));
    }

    createObj(tint: number, st: StringTokenizer): DragObject | null {
        if (tint === 'b'.charCodeAt(0)) return new Box(st);
        if (tint === 'c'.charCodeAt(0)) return new Cavity(st);
        if (tint === 'e'.charCodeAt(0)) return new Ellipse(st);
        if (tint === 'g'.charCodeAt(0)) return new GradientBox(st);
        if (tint === 'l'.charCodeAt(0)) return new Lens(st);
        if (tint === 'L'.charCodeAt(0)) return new Line(st);
        if (tint === 'A'.charCodeAt(0)) return new Arrow(st);
        if (tint === 'x'.charCodeAt(0)) return new Text(st);
        if (tint === 'S'.charCodeAt(0)) return new LineSource(st);
        if (tint === 'm'.charCodeAt(0)) return new MediumBox(st);
        if (tint === 'E'.charCodeAt(0)) return new MediumEllipse(st);
        if (tint === 'M'.charCodeAt(0)) return new ModeBox(st);
        if (tint === 'd'.charCodeAt(0)) return new MovingSource(st);
        if (tint === 'W'.charCodeAt(0)) return new MovingWall(st);
        if (tint === 200) return new MultipoleSource(st);
        if (tint === 'p'.charCodeAt(0)) return new Parabola(st);
        if (tint === 'P'.charCodeAt(0)) return new Probe(st);
        if (tint === 201) return new PhasedArraySource(st);
        if (tint === 203) return new Slit(st);
        if (tint === 202) return new SolidBox(st);
        if (tint === 205) return new Image(st);
        if (tint === 's'.charCodeAt(0)) return new Source(st, 1);
        if (tint === 't'.charCodeAt(0)) return new TrianglePrism(st);
        if (tint === 'w'.charCodeAt(0)) return new Wall(st);
        if (tint === 204) return new RotatingSource(st);
        return null;
    }

    doEdit(eable: Editable): void {
        this.clearSelection();
        this.pushUndo();
        if (this.editDialog != null) {
            this.editDialog.closeDialog();
            this.editDialog = null;
        }
        this.editDialog = new EditDialog(eable, this);
    }

    doSliders(obj: DragObject): void {
        this.clearSelection();
        this.pushUndo();
        if (this.sliderDialog != null) {
            this.sliderDialog.closeDialog();
            this.sliderDialog = null;
        }
        this.sliderDialog = new SliderDialog(obj, this);
    }

    // whether the user can create sliders for this object
    sliderItemEnabled(obj: DragObject): boolean {
        for (let i = 0; ; i++) {
            const ei = obj.getEditInfo(i);
            if (ei == null)
                return false;
            if (ei.canCreateAdjustable())
                return true;
        }
    }

    findAdjustable(obj: DragObject, item: number): Adjustable | null {
        for (const adj of this.adjustables) {
            if (adj.elm === obj && adj.editItem === item)
                return adj;
        }
        return null;
    }

    deleteSliders(obj: DragObject): void {
        for (let i = this.adjustables.length - 1; i >= 0; i--) {
            const adj = this.adjustables[i];
            if (adj.elm === obj) {
                adj.deleteSlider(this);
                this.adjustables.splice(i, 1);
            }
        }
    }

    addWidgetToVerticalPanel(el: HTMLElement): void {
        this.sidebarEl.appendChild(el);
    }

    removeWidgetFromVerticalPanel(el: HTMLElement): void {
        if (el.parentElement === this.sidebarEl)
            this.sidebarEl.removeChild(el);
    }

    doExportAsUrl(): void {
        const dump = this.dumpLayout();
        this.exportAsUrlDialog = new ExportAsUrlDialog(dump);
    }

    doExportAsText(): void {
        const dump = this.dumpLayout();
        this.exportAsTextDialog = new ExportAsTextDialog(this, dump);
    }

    onImageFileSelected(): void {
        const files = this.imageFileInputEl?.files;
        if (files && files.length >= 1) {
            this.pushUndo();
            const obj = Image.fromFile(files[0]);
            this.placementPoint = this.imagePlacementPoint;
            obj.setInitialPosition();
            this.placementPoint = null;
            this.dragObjects.push(obj);
            this.setSelectedObject(obj);
            this.preserveSelection = true;
            this.changedWalls = true;
        }
        this.imageFileInputEl!.value = "";
    }

    doExportAsLocalFile(): void {
        const dump = this.dumpLayout();
        this.exportAsLocalFileDialog = new ExportAsLocalFileDialog(dump);
    }

    // ==================== main loop ====================

    reinit(setup: boolean = true): void {
        this.gridSizeXY = this.gridSizeX * this.gridSizeY;
        this.console("reinit " + this.gridSizeX + " " + this.gridSizeY);
        if (setup)
            this.doSetup();
    }

    // draw objects into blue channel of render texture
    prepareObjects(): void {
        RippleSim.doBlankWalls();
        RippleSim.setAcoustic(this.waveChooser.getSelectedIndex() === RippleSim.WAVE_SOUND); // need this for mode boxes
        for (const obj of this.dragObjects) {
            const xform = obj.transform!;
            RippleSim.setTransform(xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
            obj.prepare();
        }
        RippleSim.setTransform(1, 0, 0, 0, 1, 0);
    }

    // call reset() on objects after clearing waves
    // used to draw mode boxes, reset probe data, etc
    reset(): void {
        for (const obj of this.dragObjects) {
            const xform = obj.transform!;
            RippleSim.setTransform(xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
            obj.reset();
        }
        RippleSim.setTransform(1, 0, 0, 0, 1, 0);
    }

    updateRipple(): void {
        let iterCount = this.speedBar.getValue();
        if (this.stoppedCheck.getState() || this.dragStop)
            iterCount = 0;
        // while stopped, skip the whole render if nothing that could change the picture has happened
        if (iterCount === 0 && !this.needsRedraw && !this.changedWalls)
            return;
        this.needsRedraw = false;
        if (this.changedWalls) {
            this.prepareObjects();
            this.changedWalls = false;
        }
        RippleSim.setAcoustic(this.waveChooser.getSelectedIndex() === RippleSim.WAVE_SOUND);
        for (let i = 0; i !== iterCount; i++) {
            RippleSim.simulate();
            this.t += RippleSim.timeStep;
            for (const obj of this.dragObjects)
                obj.run();
            this.iters++;
            if (this.pokePoint != null && this.modeChooser.getSelectedIndex() >= RippleSim.MODE_HOLD)
                RippleSim.drawPoke(this.pokePoint.x, this.pokePoint.y, this.pokeValue);
        }
        this.brightMult = Math.exp(this.brightnessBar.getValue() / 100. - 5.);
        RippleSim.updateRippleGL(this.brightMult, this.view3dCheck.getState());
        if (!this.view3dCheck.getState())
            for (const obj of this.dragObjects) {
                RippleSim.setDrawingColor(1, 1, 0, .5);
                if (obj.selected)
                    RippleSim.setDrawingSelection(.6 + .4 * Math.sin(Date.now() * .008));
                else
                    RippleSim.setDrawingSelection(-1);
                const xform = obj.transform!;
                RippleSim.setTransform(xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
                obj.draw();
            }
        RippleSim.setTransform(1, 0, 0, 0, 1, 0);
        RippleSim.setDrawingSelection(-1);
        this.drawOverlay2D();
        if (this.view3dCheck.getState())
            for (const obj of this.dragObjects)
                if (obj instanceof Probe)
                    obj.probeView.draw();
        if (!this.view3dCheck.getState() && this.rulerStart != null && this.rulerEnd != null) {
            RippleSim.setDrawingColor(1, 1, 1, 1);
            RippleSim.setDrawingSelection(1);
            RippleSim.drawWall(this.rulerStart.x, this.rulerStart.y, this.rulerEnd.x, this.rulerEnd.y);
            RippleSim.setDrawingSelection(-1);
            RippleSim.drawFocus(this.rulerStart.x, this.rulerStart.y);
            RippleSim.drawFocus(this.rulerEnd.x, this.rulerEnd.y);
        }
        this.doCoordsLabel();
    }

    // draw cosmetic objects (LineElm, TextElm) onto the 2D overlay canvas that sits on
    // top of the WebGL canvas. These objects don't participate in the wave simulation.
    private drawOverlay2D(): void {
        const ctx = this.overlayCtx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.overlayCv.width, this.overlayCv.height);
        if (this.view3dCheck.getState())
            return;
        const scale = this.winSize.width / this.windowWidth;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        const g = new Graphics(ctx);
        for (const obj of this.dragObjects)
            obj.draw2D(g);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // returns a sine-wave Source if all sources in the circuit are sine waves of the same frequency, else null
    getSoleSineSource(): Source | null {
        let found: Source | null = null;
        for (const obj of this.dragObjects) {
            if (!(obj instanceof Source))
                continue;
            if (obj.waveform !== Source.WF_SINE)
                return null;
            if (found == null)
                found = obj;
            else if (Math.abs(obj.frequency - found.frequency) > 1e-3)
                return null;
        }
        return found;
    }

    doCoordsLabel(): void {
        if (this.mouseLocation == null) {
            this.coordsLabel.style.display = "none";
            return;
        }
        let txt = (this.selectedObject != null) ? this.selectedObject.selectText() : null;
        if (txt == null && this.rulerStart != null && this.rulerEnd != null) {
            const dx = this.rulerEnd.x - this.rulerStart.x;
            const dy = this.rulerEnd.y - this.rulerStart.y;
            const distPx = Math.hypot(dx, dy);
            txt = "distance = " + this.getLengthText(distPx);
            const src = this.getSoleSineSource();
            if (src != null) {
                const wavelengths = (distPx * this.lengthScale) / src.getWavelength();
                txt += " (" + wavelengths.toFixed(2) + " λ)";
            }
        }
        if (txt == null)
            txt = "t = " + RippleSim.getUnitText(this.getRealTime(), "s");
        const pt = this.mouseLocation;
        this.coordsLabel.textContent = "(" + this.getLengthText(pt.x) + ", " + this.getLengthText(this.windowHeight - 1 - pt.y) + ") " + txt;
        if (pt.x < this.windowWidth / 4 && pt.y > this.windowHeight * 3 / 4)
            this.coordsLabel.style.top = "0px";
        else
            this.coordsLabel.style.top = (this.cv.offsetHeight - this.coordsLabel.offsetHeight) + "px";
        this.coordsLabel.style.display = "";
    }

    setDamping(): void {
        const damper = this.dampingBar.getValue() * .0002;
        this.dampcoef = Math.exp(-damper);
        RippleSim.setDamping(this.dampcoef);
        this.console("damp " + this.dampcoef + " " + this.dampingBar.getValue());
    }

    setFreqBar(x: number): void {
        this.freqBar.setValue(x);
        this.freqBarValue = x;
        this.freqTimeZero = 0;
    }

    setFreq(): void {
        // adjust time zero to maintain continuity in the freq func
        // even though the frequency has changed.
        this.freqBarValue = this.freqBar.getValue();
        const newfreq = this.freqBarValue * RippleSim.freqMult;
        for (const obj of this.dragObjects) {
            if (obj instanceof Source)
                obj.setFrequency(newfreq);
        }
    }

    setResolution(): void;
    setResolution(newWidth: number): void;
    setResolution(newWidth: number, border: number): void;
    setResolution(newWidth?: number, border: number = 0): void {
        if (newWidth === undefined) {
            newWidth = this.resBar.getValue();
        }
        const oldWidth = this.windowWidth;
        if (newWidth === oldWidth && border === 0)
            return;
        if (border === 0) {
            border = Math.trunc(newWidth / 8);
            if (border < 20)
                border = 20;
        }
        if (this.resBar.getValue() !== newWidth)
            this.resBar.setValue(newWidth);
        this.windowWidth = this.windowHeight = newWidth;
        this.windowOffsetX = this.windowOffsetY = border;
        this.gridSizeX = this.windowWidth + this.windowOffsetX * 2;
        this.gridSizeY = this.windowHeight + this.windowOffsetY * 2;
        this.windowBottom = this.windowOffsetY + this.windowHeight - 1;
        this.windowRight = this.windowOffsetX + this.windowWidth - 1;
        RippleSim.setResolutionGL(this.gridSizeX, this.gridSizeY, this.windowOffsetX, this.windowOffsetY);
        this.console("res " + this.gridSizeX + " " + this.speedBar.getValue());
        for (const obj of this.dragObjects)
            obj.rescale(this.windowWidth / oldWidth);
        this.changedWalls = true;
    }

    view3dDrag(dx: number, dy: number): void {
        RippleSim.set3dViewAngle(dx, dy);
    }

    deleteAllObjects(): void {
        for (let i = this.dragObjects.length - 1; i >= 0; i--)
            this.dragObjects[i].delete();
        for (let i = this.adjustables.length - 1; i >= 0; i--)
            this.adjustables[i].deleteSlider(this);
        this.adjustables = [];
        this.dragObjects = [];
        this.selectedObject = null;
        RippleSim.doBlankWalls();
    }

    resetTime(): void {
        this.t = 0;
        this.iters = 0;
    }

    doNew(): void {
        this.pushUndo();
        this.resetTime();
        RippleSim.doBlank();
        this.deleteAllObjects();
        this.enableDisableUI();
    }

    doSetup(): void {
        if (this.setupList.length === 0)
            return;
        this.resetTime();
        if (this.resBar.getValue() < 32)
            this.setResolution(32);
        RippleSim.doBlank();
        this.deleteAllObjects();
        this.dampingBar.setValue(0);
        this.setFreqBar(5);
        this.setBrightness(10);
        this.waveChooser.setSelectedIndex(1);
        this.setWaveType();
        this.setup = this.setupList[this.setupChooser.getSelectedIndex()];
        this.setup.select();
        this.setDamping();
        this.enableDisableUI();
    }

    setBrightness(x: number): void {
        let m = x / 5.;
        m = (Math.log(m) + 5.) * 100;
        this.brightnessBar.setValue(Math.round(m));
    }

    doColor(): void {
        const cn = this.colorChooser.getSelectedIndex();
        this.wallColor = this.schemeColors[cn][0];
        this.posColor = this.schemeColors[cn][1];
        this.negColor = this.schemeColors[cn][2];
        this.zeroColor = this.schemeColors[cn][3];
        this.posMedColor = this.schemeColors[cn][4];
        this.negMedColor = this.schemeColors[cn][5];
        this.medColor = this.schemeColors[cn][6];
        this.sourceColor = this.schemeColors[cn][7];
        this.absorbColor = this.schemeColors[cn][8];
        let zerocol3d = this.zeroColor.toInteger();
        if (zerocol3d === 0)
            zerocol3d = 0x808080;
        RippleSim.setColors(this.wallColor.toInteger(), this.posColor.toInteger(), this.negColor.toInteger(),
            this.zeroColor.toInteger(), this.posMedColor.toInteger(), this.negMedColor.toInteger(),
            this.medColor.toInteger(), this.sourceColor.toInteger(), zerocol3d, this.absorbColor.toInteger());
    }

    addDefaultColorScheme(): void {
        const schemes = [
            "#808080 #00ffff #000000 #008080 #0000ff #000000 #000080 #ffffff #ffff00",
            "#808080 #00ff00 #ff0000 #000000 #00ffff #ff00ff #0000ff #0000ff #ffff00",
            "#800000 #00ffff #0000ff #000000 #80c8c8 #8080c8 #808080 #ffffff #ffff00",
            "#800000 #ffffff #000000 #808080 #0000ff #000000 #000080 #00ff00 #ffff00",
            "#800000 #ffff00 #0000ff #000000 #ffff80 #8080ff #808080 #ffffff #ff8000",
            "#808080 #00ff00 #ff0000 #FFFFFF #00ffff #ff00ff #0000ff #0000ff #ffff00",
            "#FF0000 #00FF00 #0000FF #FFFF00 #00FFFF #FF00FF #FFFFFF #000000 #FFA500",
        ];
        for (const s of schemes)
            this.decodeColorScheme(s);
    }

    decodeColorScheme(s: string): void {
        const st = new StringTokenizer(s, " \t\n,");
        const cn = this.colorChooser.getItemCount();
        this.schemeColors[cn] = [];
        for (let i = 0; i !== 9; i++) {
            // colors left out (e.g. the absorbing area color, which older 8-color
            // schemes don't have) come from the first scheme
            if (st.hasMoreTokens())
                this.schemeColors[cn][i] = Color.hex2Rgb(st.nextToken());
            else
                this.schemeColors[cn][i] = cn > 0 ? this.schemeColors[0][i] : new Color(0, 0, 0);
        }
        this.colorChooser.add("Color Scheme " + (cn + 1));
    }

    // set length scale and speed for a particular wave type, which determines what units we report
    // in coordinates box and editing values.  Also, choice of sound/non-sound affects boundary conditions
    // at walls.
    setWaveType(): void {
        let windowScale = 25;
        switch (this.waveChooser.getSelectedIndex()) {
            case 0: // sound
                this.waveSpeed = 343.2;
                windowScale = 25;
                break;
            case 1: // light
                this.waveSpeed = 299792458;
                windowScale = 8000e-9;
                break;
            case 2: // AM
                this.waveSpeed = 299792458;
                windowScale = 50000;
                break;
            case 3: // FM
                this.waveSpeed = 299792458;
                windowScale = 60;
                break;
            case 4: // uwave
                this.waveSpeed = 299792458;
                windowScale = 2;
                break;
        }
        this.lengthScale = windowScale / 512;
    }

    async getSetupList(): Promise<void> {
        try {
            const url = moduleBaseURL + "setuplist.txt?v=" + Math.floor(Math.random() * 0x7fffffff);
            const response = await fetch(url);
            if (response.ok) {
                const text = await response.text();
                this.processSetupList(text);
                if (this.startExampleText != null)
                    this.readImport(this.startExampleText);
                else if (this.startExample != null)
                    this.readSetupFile(this.startExample, null);
                else
                    this.doSetup();
            } else
                this.console("Bad file server response:" + response.statusText);
        } catch (e) {
            this.console("failed file reading " + e);
        }
    }

    processSetupList(text: string): void {
        const lines = text.split("\n");
        for (const rawLine of lines) {
            const line = rawLine.replace(/\r$/, "");
            if (line.length === 0)
                continue;
            if (line.charAt(0) === '#')
                continue;
            const i = line.indexOf(' ');
            if (i > 0) {
                const title = line.substring(i + 1);
                const first = line.charAt(0) === '>';
                const file = line.substring(first ? 1 : 0, i);
                const s = new FileSetup(this, title, file);
                this.setupList.push(s);
                this.setupChooser.add("Example: " + title);
            }
        }
    }

    readSetupFile(str: string, _title: string | null): void {
        this.resetTime();
        this.console("reading example " + str);
        ExportAsLocalFileDialog.setLastFileName(null);
        const url = moduleBaseURL + "examples/" + str + "?v=" + Math.floor(Math.random() * 0x7fffffff);
        this.loadFileFromURL(url);
        this.enableDisableUI();
    }

    async loadFileFromURL(url: string): Promise<void> {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const text = await response.text();
                this.readImport(text);
            } else
                this.console("Bad file server response:" + response.statusText);
        } catch (e) {
            this.console("failed file reading " + e);
        }
    }

    dumpLayout(): string {
        let dump = "$ 3 " + this.windowWidth + " " + this.windowOffsetX + " " + this.dampingBar.getValue() + " " +
            this.waveChooser.getSelectedIndex() + " " + this.brightnessBar.getValue() + " " + this.lengthScale + " " +
            this.snapGridSize + "\n";
        for (const obj of this.dragObjects)
            dump += obj.dump() + "\n";
        for (const adj of this.adjustables)
            dump += "a " + adj.dump() + "\n";
        return dump;
    }

    readImport(s: string, retain: boolean = false): void {
        if (!retain) {
            RippleSim.doBlank();
            this.resetTime();
            this.deleteAllObjects();
        }
        const lines = s.split(/\r\n|\r|\n/);
        for (const line of lines) {
            if (line.length === 0)
                continue;
            const st = new StringTokenizer(line, " +\t\n\r\f");
            if (!st.hasMoreTokens())
                continue;
            const type = st.nextToken();
            let tint = type.charCodeAt(0);
            try {
                if (tint === '$'.charCodeAt(0)) {
                    const flags = parseInt(st.nextToken());
                    if ((flags & 1) === 0)
                        return;

                    const ww = parseInt(st.nextToken());
                    const wo = parseInt(st.nextToken());
                    this.setResolution(ww, wo);
                    this.reinit(false);

                    const damp = parseInt(st.nextToken());

                    // ignore damping values on old dumps
                    if ((flags & 2) !== 0)
                        this.dampingBar.setValue(damp);

                    this.waveChooser.setSelectedIndex(parseInt(st.nextToken()));
                    this.setWaveType();
                    this.brightnessBar.setValue(parseInt(st.nextToken()));
                    this.lengthScale = parseFloat(st.nextToken());
                    if (st.hasMoreTokens())
                        this.snapGridSize = parseInt(st.nextToken());
                    continue;
                }
                if (tint === 'a'.charCodeAt(0)) {
                    const adj = new Adjustable(st, this);
                    if (adj.elm != null)
                        this.adjustables.push(adj);
                    continue;
                }

                if (tint >= '0'.charCodeAt(0) && tint <= '9'.charCodeAt(0))
                    tint = parseInt(type);

                // ignore probes if we can't display them
                if (tint === 'P'.charCodeAt(0) && !RippleSim.readPixelsWorks())
                    continue;

                const newobj = this.createObj(tint, st);
                if (newobj == null) {
                    this.console("unrecognized dump type: " + type);
                    continue;
                }
                if (newobj.getDumpType() !== tint)
                    this.console("dump type mismatch for " + tint);
                this.dragObjects.push(newobj);
            } catch (ee) {
                this.console("got exception when reading setup");
                continue;
            }
        }
        if (!retain) {
            for (let i = this.adjustables.length - 1; i >= 0; i--) {
                if (!this.adjustables[i].createSlider(this))
                    this.adjustables.splice(i, 1);
            }
        }
        this.setDamping();
        this.wallsChanged();
        this.enableDisableUI();
        this.console("done with reading setup, " + this.dragObjects.length + " " + this.changedWalls);
    }

    wallsChanged(): void {
        this.changedWalls = true;
    }

    // ==================== mouse / touch interaction ====================

    private eventPos(event: MouseEvent): { x: number, y: number } {
        const rect = this.cv.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    getPointFromEvent(event: MouseEvent): Point {
        const p = this.eventPos(event);
        const xp = Math.trunc(p.x * this.windowWidth / this.winSize.width);
        const yp = Math.trunc(p.y * this.windowHeight / this.winSize.height);
        return new Point(xp, yp);
    }

    // used only when actually repositioning objects/handles, not for hit-testing,
    // so objects between grid points can still be selected
    snapPoint(p: Point): Point {
        if (this.snapGridSize <= 0)
            return p;
        const x = Math.round(p.x / this.snapGridSize) * this.snapGridSize;
        const y = Math.round(p.y / this.snapGridSize) * this.snapGridSize;
        return new Point(x, y);
    }

    getRealTime(): number {
        return this.t / (2 * Math.PI * this.waveSpeed / Source.freqScale / this.lengthScale);
    }

    timeToRealTime(x: number): number {
        return x / (2 * Math.PI * this.waveSpeed / Source.freqScale / this.lengthScale);
    }

    realTimeToTime(x: number): number {
        return x * (2 * Math.PI * this.waveSpeed / Source.freqScale / this.lengthScale);
    }

    onMouseUp(event: MouseEvent): void {
        event.preventDefault();
        this.dragging = false;
        this.dragStop = false;
        this.pokePoint = null;
        if (this.mouseObject == null)
            this.preserveSelection = false;
    }

    onMouseMove(event: MouseEvent): void {
        event.preventDefault();
        this.doMouseMove(event);
    }

    doMouseMove(event: MouseEvent): void {
        const pt = this.getPointFromEvent(event);
        this.mouseLocation = pt;
        if (this.rotationMode) {
            this.selectedObject!.rotateTo(pt.x, pt.y);
            return;
        }
        if (this.dragging) {
            this.dragMouse(event);
            return;
        }
        const p = this.eventPos(event);
        const x = p.x, y = p.y;
        this.dragPoint = this.snapPoint(this.getPointFromEvent(event));
        this.dragStartX = this.dragX = x;
        this.dragStartY = this.dragY = y;

        const minf = 5 * this.windowWidth / this.winSize.height + 1;
        let bestf = minf;
        const mp = this.getPointFromEvent(event);
        this.draggingHandle = null;
        if (this.selectedObject != null) {
            const pt2 = this.selectedObject.inverseTransformPoint(mp);
            for (const dh of this.selectedObject.handles) {
                const r = DragObject.hypotf(pt2.x - dh.x, pt2.y - dh.y);
                if (r < bestf) {
                    this.draggingHandle = dh;
                    bestf = r;
                }
            }
            if (this.draggingHandle != null)
                return;
        }

        // select object?
        let sel: DragObject | null = null;
        bestf = 1e8;
        for (const obj of this.dragObjects) {
            const p2 = obj.inverseTransformPoint(mp);
            const ht = obj.hitTest(p2.x, p2.y);

            // if there are no better options, select a RectDragObject if we're tapping
            // inside it.
            if (ht > minf && !obj.hitTestInside(p2.x, p2.y))
                continue;

            if (ht < bestf) {
                sel = obj;
                bestf = ht;
            }
        }
        if (!this.preserveSelection)
            this.setSelectedObject(sel);
        this.mouseObject = sel;
    }

    static getUnitText(v: number, u: string): string {
        const va = Math.abs(v);
        if (va < 1e-17)
            return "0 " + u;
        if (va < 1e-12)
            return RippleSim.showFormat(v * 1e15) + " f" + u;
        if (va < 1e-9)
            return RippleSim.showFormat(v * 1e12) + " p" + u;
        if (va < 1e-6)
            return RippleSim.showFormat(v * 1e9) + " n" + u;
        if (va < 1e-3)
            return RippleSim.showFormat(v * 1e6) + " μ" + u;
        if (va < 1e-2 || (va < 1 && u === "s"))
            return RippleSim.showFormat(v * 1e3) + " m" + u;
        if (va < 1)
            return RippleSim.showFormat(v * 1e2) + " c" + u;
        if (va < 1e3)
            return RippleSim.showFormat(v) + " " + u;
        if (va < 1e6)
            return RippleSim.showFormat(v * 1e-3) + " k" + u;
        if (va < 1e9)
            return RippleSim.showFormat(v * 1e-6) + " M" + u;
        if (va < 1e12)
            return RippleSim.showFormat(v * 1e-9) + " G" + u;
        if (va < 1e15)
            return RippleSim.showFormat(v * 1e-12) + " T" + u;
        if (va < 1e18)
            return RippleSim.showFormat(v * 1e-15) + " P" + u;
        return RippleSim.showFormat(v * 1e-18) + " E" + u;
    }

    static getShortUnitText(v: number, u: string): string | null {
        const va = Math.abs(v);
        if (va < 1e-13)
            return null;
        if (va < 1e-9)
            return RippleSim.shortFormat(v * 1e12) + "p" + u;
        if (va < 1e-6)
            return RippleSim.shortFormat(v * 1e9) + "n" + u;
        if (va < 1e-3)
            return RippleSim.shortFormat(v * 1e6) + "μ" + u;
        if (va < 1e-2)
            return RippleSim.shortFormat(v * 1e3) + "m" + u;
        if (va < 1)
            return RippleSim.shortFormat(v * 1e2) + "c" + u;
        if (va < 1e3)
            return RippleSim.shortFormat(v) + u;
        if (va < 1e6)
            return RippleSim.shortFormat(v * 1e-3) + "k" + u;
        if (va < 1e9)
            return RippleSim.shortFormat(v * 1e-6) + "M" + u;
        if (va < 1e12)
            return RippleSim.shortFormat(v * 1e-9) + "G" + u;
        if (va < 1e15)
            return RippleSim.shortFormat(v * 1e-12) + "T" + u;
        if (va < 1e18)
            return RippleSim.shortFormat(v * 1e-15) + "P" + u;
        return RippleSim.shortFormat(v * 1e-18) + "E" + u;
    }

    getUnitText(v: number, u: string): string { return RippleSim.getUnitText(v, u); }

    // convert pixels to meters and return as string
    getLengthText(px: number): string {
        return this.getUnitText(px * this.lengthScale, "m");
    }

    // convert pixels/iter to m/s and return as string
    getSpeedText(px: number): string {
        return this.getUnitText(px * 4 * 2 * Math.PI * this.waveSpeed / Source.freqScale, "m/s");
    }

    dragMouse(event: MouseEvent): void {
        if (this.view3dCheck.getState()) {
            const p = this.eventPos(event);
            this.view3dDrag(p.x - this.dragX, p.y - this.dragY);
            this.dragX = p.x;
            this.dragY = p.y;
            return;
        }
        this.dragging = true;

        const rawPt = this.getPointFromEvent(event);
        if (this.draggingHandle != null) {
            const pt = this.snapPoint(rawPt);
            const mp = this.selectedObject!.inverseTransformPoint(pt);
            this.draggingHandle.dragTo(mp.x, mp.y);
            this.changedWalls = true;
        } else if (this.isSelection()) {
            const pt = this.snapPoint(rawPt);
            if (this.dragPoint!.x !== pt.x || this.dragPoint!.y !== pt.y) {
                for (const obj of this.dragObjects) {
                    if (obj.isSelected())
                        obj.drag(pt.x - this.dragPoint!.x, pt.y - this.dragPoint!.y);
                }
                this.dragPoint = pt;
                this.changedWalls = true;
            }
        } else if (this.rulerStart != null) {
            this.rulerEnd = rawPt;
        } else {
            if (this.pokePoint != null)
                this.pokePoint = rawPt;
            RippleSim.drawPoke(rawPt.x, rawPt.y, this.pokeValue);
        }
    }

    isSelection(): boolean {
        for (const obj of this.dragObjects)
            if (obj.isSelected())
                return true;
        return false;
    }

    enableDisableUI(): void {
        // check if all sources are same frequency
        let src1: Source | null = null;
        for (const obj of this.dragObjects) {
            if (!(obj instanceof Source))
                continue;
            const src = obj;

            // don't let freq be adjusted if we have pulse sources
            if (src.waveform === Source.WF_PULSE) {
                src1 = null;
                break;
            }
            if (src1 == null)
                src1 = src;
            else if (Math.abs(src.frequency - src1.frequency) > 1e-3) {
                src1 = null;
                break;
            }
        }
        if (src1 == null)
            this.freqBar.disable();
        else {
            this.freqBar.enable();
            this.ignoreFreqBarSetting = true;
            this.freqBar.setValue(Math.trunc(src1.frequency / RippleSim.freqMult));
            this.ignoreFreqBarSetting = false;
        }
    }

    onMouseDown(event: MouseEvent): void {
        event.preventDefault();
        this.pushUndo();
        this.doMouseMove(event);
        if (this.rotationMode) {
            this.rotationMode = false;
            return;
        }
        this.dragging = true;

        if (this.view3dCheck.getState())
            return;

        if (this.mouseObject != null)
            this.mouseObject.mouseDown();
        const mp = this.getPointFromEvent(event);

        if (this.draggingHandle == null) {
            if (this.mouseObject == null)
                this.setSelectedObject(null);
            else {
                if (!this.mouseObject.isSelected())
                    this.setSelectedObject(this.mouseObject);
                this.preserveSelection = true;
            }
        }

        if (this.mouseObject == null && event.button !== 2) {
            if (this.modeChooser.getSelectedIndex() === RippleSim.MODE_RULER) {
                this.rulerStart = mp;
                this.rulerEnd = mp;
                return;
            }
            this.pokeValue = 1;
            if (this.modeChooser.getSelectedIndex() === RippleSim.MODE_CLEAR)
                this.pokeValue = 0;
            else if (this.modeChooser.getSelectedIndex() === RippleSim.MODE_DRAW_MINUS || this.modeChooser.getSelectedIndex() === RippleSim.MODE_HOLD_MINUS)
                this.pokeValue = -1;
            if (event.shiftKey)
                this.pokeValue *= -1;
            if (event.metaKey || event.ctrlKey)
                this.dragStop = true;
            else
                this.pokePoint = mp;
            RippleSim.drawPoke(mp.x, mp.y, this.pokeValue);
        }
    }

    setSelectedObject(obj: DragObject | null): void {
        if (obj != null && obj.isSelected())
            return;
        for (const dd of this.dragObjects)
            dd.setSelected(false);
        this.selectedObject = obj;
        if (obj != null)
            obj.setSelected(true);
        this.preserveSelection = false;
    }

    onMouseWheel(event: WheelEvent): void {
        event.preventDefault();
        if (this.selectedObject != null && this.selectedObject.canRotate()) {
            // rotate in 15 degree steps, but save mouse wheel motions that aren't large enough for a rotation
            const dy = event.deltaY + this.mouseWheelAccum;
            const dy10 = Math.trunc(dy / 10);
            this.mouseWheelAccum = dy - dy10 * 10;
            this.selectedObject.rotate(dy10 * Math.PI / 12);
            this.preserveSelection = true;
        }
        if (this.view3dCheck.getState()) {
            this.zoom3d *= Math.exp(-event.deltaY * .01);
            RippleSim.set3dViewZoom(this.zoom3d);
        }
    }

    onMouseOut(_event: MouseEvent): void {
        this.dragging = false;
        this.dragStop = false;
        this.pokePoint = null;
        this.imagePlacementPoint = null;
        this.mouseLocation = null;
    }

    private menuX = 0;
    private menuY = 0;
    private contextPanel: HTMLElement | null = null;
    // where to put objects added from the context menu (window coordinates), or null to find space
    private placementPoint: Point | null = null;
    private imagePlacementPoint: Point | null = null;

    onContextMenu(e: MouseEvent): void {
        e.preventDefault();
        this.menuX = e.clientX;
        this.menuY = e.clientY;
        this.doPopupMenu();
    }

    longPress(): void {
        // dragStartX/Y are relative to the canvas; the menu position is in client coordinates
        const rect = this.cv.getBoundingClientRect();
        this.menuX = rect.left + this.dragStartX;
        this.menuY = rect.top + this.dragStartY;
        this.doPopupMenu();
    }

    closeContextPanel(): void {
        if (this.contextPanel != null) {
            document.body.removeChild(this.contextPanel);
            this.contextPanel = null;
        }
    }

    doPopupMenu(): void {
        this.closeContextPanel();
        const panel = document.createElement("div");
        panel.className = "context-menu";
        // hidden while we build it, so we can measure its real size below without
        // it flashing at the (possibly off-screen) unclamped position first
        panel.style.visibility = "hidden";
        document.body.appendChild(panel);
        this.contextPanel = panel;
        // keep the current selection while the menu is open: without this, moving the
        // mouse back over empty canvas on the way to a menu item re-triggers doMouseMove's
        // hover hit-test and clears selectedObject out from under the still-open menu.
        this.preserveSelection = true;

        if (this.selectedObject != null) {
            for (const d of this.elmMenuItems) {
                const item = document.createElement("button");
                item.className = "menu-item";
                item.textContent = d.label!;
                if (d === this.elmEditMenuItem)
                    item.disabled = this.selectedObject.getEditInfo(0) == null;
                if (d === this.elmRotateMenuItem)
                    item.disabled = !this.selectedObject.canRotate();
                if (d === this.elmSliderMenuItem)
                    item.disabled = !this.sliderItemEnabled(this.selectedObject);
                item.addEventListener("click", () => { this.closeContextPanel(); d.action!(); });
                panel.appendChild(item);
            }
        } else {
            const rect = this.cv.getBoundingClientRect();
            const clickPoint = this.snapPoint(new Point(
                Math.trunc((this.menuX - rect.left) * this.windowWidth / this.winSize.width),
                Math.trunc((this.menuY - rect.top) * this.windowHeight / this.winSize.height)));
            const items: MenuItemDesc[] = [
                { label: "Paste", disabled: this.pasteItem.disabled, action: () => this.menuPerformed("edit", "paste") },
                { label: "Select All", action: () => this.menuPerformed("edit", "selectAll") },
                { separator: true },
                ...this.mainMenuItems,
            ];
            const onPick = (d: MenuItemDesc) => {
                this.closeContextPanel();
                this.placementPoint = clickPoint;
                try { d.action!(); } finally { this.placementPoint = null; }
            };
            for (const d of items)
                this.renderMenuItem(panel, d, onPick);
        }

        // clamp against the panel's actual rendered size and the viewport (the panel
        // is position:fixed), rather than guessing a size, so it can't get cut off
        // regardless of how many items it has or where on the page it opens
        const rect = panel.getBoundingClientRect();
        const x = Math.max(0, Math.min(this.menuX, window.innerWidth - rect.width));
        const y = Math.max(0, Math.min(this.menuY, window.innerHeight - rect.height));
        panel.style.left = x + "px";
        panel.style.top = y + "px";
        panel.style.visibility = "";

        const closeOnOutside = (ev: MouseEvent) => {
            if (this.contextPanel && !this.contextPanel.contains(ev.target as Node)) {
                this.closeContextPanel();
                document.removeEventListener("mousedown", closeOnOutside);
            }
        };
        setTimeout(() => document.addEventListener("mousedown", closeOnOutside), 0);
    }

    onDoubleClick(event: MouseEvent): void {
        event.preventDefault();
    }

    doCreateWall(): void {
        const w = new Wall();
        w.setInitialPosition();
        this.dragObjects.push(w);
    }

    findSpace(_obj: DragObject, _sx: number, _sy: number): Rectangle {
        const spsize = 20;
        if (this.placementPoint != null) {
            // put the object where the user clicked, kept inside the window
            const w = Math.trunc(this.windowWidth / spsize) - 4;
            const h = Math.trunc(this.windowHeight / spsize) - 4;
            const x = Math.max(0, Math.min(this.placementPoint.x, this.windowWidth - 1 - w));
            const y = Math.max(0, Math.min(this.placementPoint.y, this.windowHeight - 1 - h));
            return new Rectangle(x, y, w, h);
        }
        const spacegrid: boolean[][] = [];
        for (let i = 0; i !== spsize; i++)
            spacegrid.push(new Array(spsize).fill(false));
        for (const d of this.dragObjects) {
            const r = d.boundingBox();
            for (let jx = Math.trunc(r.x * spsize / this.windowWidth); jx <= Math.trunc((r.x + r.width) * spsize / this.windowWidth); jx++)
                for (let jy = Math.trunc(r.y * spsize / this.windowHeight); jy <= Math.trunc((r.y + r.height) * spsize / this.windowHeight); jy++)
                    if (jx >= 0 && jy >= 0 && jx < spsize && jy < spsize)
                        spacegrid[jx][jy] = true;
        }
        let spiralIndex = 1, spiralCounter = 1;
        let tx = Math.trunc(spsize / 2);
        let ty = Math.trunc(spsize / 2);
        let dx = 1, dy = 0;
        while (true) {
            if (!spacegrid[tx][ty]) {
                return new Rectangle(Math.trunc(tx * this.windowWidth / spsize) + 2, Math.trunc(ty * this.windowHeight / spsize) + 2,
                    Math.trunc(this.windowWidth / spsize) - 4, Math.trunc(this.windowHeight / spsize) - 4);
            }
            tx += dx;
            ty += dy;
            if (--spiralIndex === 0) {
                const d0 = dx;
                dx = dy;
                dy = -d0;
                if (dy === 0) spiralCounter++;
                spiralIndex = spiralCounter;
            }
            if (tx < 0 || ty < 0 || tx >= spsize || ty >= spsize)
                break;
        }
        return new Rectangle(Math.trunc(this.gridSizeX / 2), Math.trunc(this.gridSizeY / 2), spsize, spsize);
    }

    onClick(event: MouseEvent): void {
        event.preventDefault();
    }

    onChange(source: Choice): void {
        if (source === this.setupChooser)
            this.doSetup();
        if (source === this.colorChooser)
            this.doColor();
        if (source === this.waveChooser)
            this.setWaveType();
    }

    // ==================== undo / redo / clipboard ====================

    pushUndo(): void {
        const s = this.dumpLayout();
        if (this.undoStack.length > 0 && s === this.undoStack[this.undoStack.length - 1])
            return;
        this.redoStack = [];
        this.undoStack.push(s);
        this.enableUndoRedo();
    }

    doUndo(): void {
        if (this.undoStack.length === 0)
            return;
        this.redoStack.push(this.dumpLayout());
        const s = this.undoStack.pop()!;
        this.readImport(s);
        this.enableUndoRedo();
    }

    doRedo(): void {
        if (this.redoStack.length === 0)
            return;
        this.undoStack.push(this.dumpLayout());
        const s = this.redoStack.pop()!;
        this.readImport(s);
        this.enableUndoRedo();
    }

    enableUndoRedo(): void {
        this.redoItem.disabled = this.redoStack.length === 0;
        this.undoItem.disabled = this.undoStack.length === 0;
    }

    setMenuSelection(): void {
        if (this.menuObject != null) {
            if (this.menuObject.selected)
                return;
            this.clearSelection();
            this.menuObject.setSelected(true);
        }
    }

    doCut(): void {
        this.pushUndo();
        this.setMenuSelection();
        this.clipboard = "";
        for (let i = this.dragObjects.length - 1; i >= 0; i--) {
            const ce = this.dragObjects[i];
            if (ce.isSelected()) {
                this.clipboard = ce.dump() + "\n" + this.clipboard;
                this.deleteSliders(ce);
                ce.delete();
                this.dragObjects.splice(i, 1);
            }
        }
        this.writeClipboardToStorage();
        this.enablePaste();
        this.wallsChanged();
    }

    writeClipboardToStorage(): void {
        try { localStorage.setItem("rippleClipboard", this.clipboard); } catch (e) { /* ignored */ }
    }

    readClipboardFromStorage(): void {
        try {
            const v = localStorage.getItem("rippleClipboard");
            if (v != null) this.clipboard = v;
        } catch (e) { /* ignored */ }
    }

    doDelete(): void {
        this.pushUndo();
        this.setMenuSelection();
        let hasDeleted = false;
        for (let i = this.dragObjects.length - 1; i >= 0; i--) {
            const ce = this.dragObjects[i];
            if (ce.isSelected()) {
                this.deleteSliders(ce);
                ce.delete();
                this.dragObjects.splice(i, 1);
                hasDeleted = true;
            }
        }
        if (hasDeleted)
            this.wallsChanged();
    }

    doCopy(): void {
        this.clipboard = "";
        this.setMenuSelection();
        for (let i = this.dragObjects.length - 1; i >= 0; i--) {
            const ce = this.dragObjects[i];
            if (ce.isSelected())
                this.clipboard += ce.dump() + "\n";
        }
        this.writeClipboardToStorage();
        this.enablePaste();
    }

    enablePaste(): void {
        if (this.clipboard == null || this.clipboard.length === 0)
            this.readClipboardFromStorage();
        this.pasteItem.disabled = !(this.clipboard != null && this.clipboard.length > 0);
    }

    doDuplicate(): void {
        let s = "";
        this.setMenuSelection();
        for (const ce of this.dragObjects) {
            if (ce.isSelected())
                s += ce.dump() + "\n";
        }
        this.doPaste(s);
    }

    doPaste(dump: string | null): void {
        this.pushUndo();
        this.clearSelection();
        const oldsz = this.dragObjects.length;
        if (dump != null)
            this.readImport(dump, true);
        else {
            this.readClipboardFromStorage();
            this.readImport(this.clipboard, true);
        }

        if (this.placementPoint != null && this.dragObjects.length > oldsz) {
            // pasting from the context menu: move the pasted group so its top left corner
            // is at the click point, keeping it inside the window if possible
            let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
            for (let i = oldsz; i !== this.dragObjects.length; i++) {
                const r = this.dragObjects[i].boundingBox();
                minx = Math.min(minx, r.x);
                miny = Math.min(miny, r.y);
                maxx = Math.max(maxx, r.x + r.width);
                maxy = Math.max(maxy, r.y + r.height);
            }
            const x = Math.max(0, Math.min(this.placementPoint.x, this.windowWidth - 1 - (maxx - minx)));
            const y = Math.max(0, Math.min(this.placementPoint.y, this.windowHeight - 1 - (maxy - miny)));
            for (let i = oldsz; i !== this.dragObjects.length; i++)
                this.dragObjects[i].drag(x - minx, y - miny);
        }

        // select new items
        for (let i = oldsz; i !== this.dragObjects.length; i++) {
            const ce = this.dragObjects[i];
            for (let j = 0; this.placementPoint == null && j !== oldsz; j++) {
                if (ce.boundingBox().equals(this.dragObjects[j].boundingBox())) {
                    ce.drag(Math.trunc(this.windowWidth / 32), 0);
                    j = -1;
                }
            }
            ce.setSelected(true);
        }
        if (this.dragObjects.length === oldsz + 1)
            this.selectedObject = this.dragObjects[oldsz];
        this.preserveSelection = true;
        this.wallsChanged();
    }

    clearSelection(): void {
        for (const ce of this.dragObjects)
            ce.setSelected(false);
        this.selectedObject = null;
        this.preserveSelection = false;
    }

    doSelectAll(): void {
        for (const ce of this.dragObjects)
            ce.setSelected(true);
        this.selectedObject = null;
        this.preserveSelection = true;
    }

    createNewLoadFile(): void {
        // This is a hack to fix what IMHO is a bug in the <INPUT FILE> element:
        // reloading the same file doesn't create a change event so importing the same file twice
        // doesn't work unless you destroy the original input element and replace it with a new one
        if (this.loadFileInput == null)
            return;
        const old = this.loadFileInput.element;
        const newlf = new LoadFile(this);
        old.parentElement!.replaceChild(newlf.element, old);
        this.loadFileInput = newlf;
    }

    useFreqTimeZero(): boolean {
        // automatically adjust phase to avoid discontinuities in sine wave when we change frequencies.
        // But don't do that if the user manually adjusts phase in one of the sources.
        for (const ce of this.dragObjects) {
            if (ce instanceof Source) {
                if (ce.phaseShift !== 0)
                    return false;
            }
        }
        return true;
    }
}

/**
 * @name WebGUIPro
 * @version 2.5.0
 * @description 网页控件
 * @author Wang Jia Ming
 * @createDate 2023-5-7
 * @license AGPL-3.0
 * 
 * https://opensource.org/licenses/AGPL-3.0
 * 
 * 依赖库/框架:
 * - WebUtilPro.js (2.5.0)
 */
const WebGUIPro = (function () {
    "use strict";

    const {
        $,
        getAppointParent,
        forEnd,
        debounce,
        WEvent,
        WInputType,
        AddDraggable,
        elementAnimation,
        Judge,
        TypeCast,
        generateUniqueId,
        eventTrigger,
        includeCssFiles,
        uniquenessElement,
        createElement,
        WDirection,
        WWindowOperation,
        WPlace
    } = WebUtilPro;

    // Ui 错误
    const UI_Error = {
        // 参数不匹配
        ParameterMismatch: (...arg) => {
            return `UI Error : <${arg}> Parameter mismatch`;
        },
        // 不存在的项
        NotExistItem: (...arg) => {
            return `UI Error : <${arg}> Not exist item`;
        },
        // 变量不存在
        VariableDoesNotExist: (...arg) => {
            return `UI Error: <${arg}> Variable does not exist`;
        },
        // 缺失重要元素
        MissingVitalElement: (...arg) => {
            return `UI Error: <${arg}> Missing vital element`;
        },
        // 自定义错误
        CustomError: (error, ...arg) => {
            return `UI Error: <${arg}> ${error}`;
        },
    }

    // 删除子 ui
    function _DeleteSonUi(ui) {
        forEnd(ui.$("[winit]"), e => e.Class.delete());
    }

    // 设置或移除类名
    function _SetClassList(ui, bool, className) {
        if (!Judge.isBoolean(bool)) throw UI_Error.ParameterMismatch(bool);
        if (!Judge.isString(className)) throw UI_Error.ParameterMismatch(className);
        bool ? ui.addClass(className) : ui.removeClass(className);
    }

    class WindowFlags {
        static MinButtonHint = 0x000001;
        static RestoreButtonHint = 0x000010;
        static CloseButtonHint = 0x000100;

        static Get(flags, {
            min = {
                text: "\ue15b"
            },
            restore = {
                text: "\ue3c1"
            },
            close = {
                text: "\ue14c"
            }
        } = {}) {
            const minBtn = createElement(min);
            minBtn.addClass(["material-icons", "min", "btn"]);
            const restoreBtn = createElement(restore);
            restoreBtn.addClass(["material-icons", "restore", "btn"]);
            const closeBtn = createElement(close);
            closeBtn.addClass(["material-icons", "close", "btn"]);
            const group = createElement({
                classList: ["w-window-flags"]
            });

            if ((flags & this.MinButtonHint) === 0) group.appendChild(minBtn);
            if ((flags & this.RestoreButtonHint) === 0) group.appendChild(restoreBtn);
            if ((flags & this.CloseButtonHint) === 0) group.appendChild(closeBtn);

            group.ClickEvent = function (event) { }
            group.addEvent("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const TargetElement = event.target;
                let eventName;
                const btn = getAppointParent(TargetElement, e => { return e.hasClass("btn") && e.parentNode === group });
                if (btn.hasClass("min")) {
                    eventName = "min";
                } else if (btn.hasClass("restore")) {
                    eventName = "restore";
                } else if (btn.hasClass("close")) {
                    eventName = "close";
                }
                group.ClickEvent(eventName);
            });

            return group;
        }
    }

    class WItem {
        #Item;

        constructor(item = null) {
            if (Judge.isHTMLElement(item)) {
                this.#Item = item;
            } else if (Judge.isNull(item)) {
                this.#Item = createElement({
                    attribute: [["w-item", ""]]
                });
            } else {
                throw UI_Error.ParameterMismatch(item);
            }
        }

        getIndex() {
            return WItem.GetIndex(this.#Item);
        }

        removeItem() {
            return WItem.RemoveItem(this.#Item);
        }

        selectItem() {
            return WItem.SelectItem(this.#Item);
        }

        isDisabled() {
            return WItem.IsDisabled(this.#Item);
        }

        // 判断是否是 item
        static Is(item) {
            return item.hasAttr("w-item");
        }

        // 获取项索引
        static GetIndex(item) {
            if (Judge.isHTMLElement(item) && item.hasAttribute("w-index"))
                return parseInt(item.getAttribute("w-index"));
            else return -1;
        }

        // 移除项
        static RemoveItem(item) {
            if (Judge.isHTMLElement(item)) {
                item.remove();
            } else {
                throw UI_Error.ParameterMismatch(item);
            }
        }

        // 判断项是否被禁用
        static IsDisabled(item) {
            return item.hasAttr("disabled");
        }

        // 判断是否被选择
        static IsSelect(item) {
            return item.hasClass("select");
        }

        // 获取项
        static GetItem(element, parentNode) {
            return getAppointParent(element, e => { return e.hasAttr("w-item") && e.parentNode === parentNode });
        }

        // 选择项
        static SelectItem$(item, parentNode) {
            let target;
            if (Judge.isHTMLElement(item)) {
                if (item.attr("w-item")) {
                    target = item;
                } else {
                    target = WItem.GetItem(item, parentNode);
                }
            } else {
                throw UI_Error.ParameterMismatch(item);
            }
            if (WItem.IsDisabled(target)) {
                target.removeClass("select");
                return false;
            } else if (target) {
                target.addClass("select");
                return target;
            } else {
                throw UI_Error.NotExistItem(item);
            }
        }

        // 选择项
        static SelectItem(item) {
            if (!Judge.isHTMLElement(item)) {
                throw UI_Error.ParameterMismatch(item);
            }
            if (WItem.IsDisabled(item)) {
                item.removeClass("select");
                return false;
            } else if (item) {
                item.addClass("select");
                return item;
            } else {
                throw UI_Error.NotExistItem(item);
            }
        }

        // 清除带选择标签的项
        static RemoveSelectTagItem(container) {
            if (Judge.isHTMLElement(container)) {
                forEnd(container.$(">.select"), (item) => { item.removeClass("select"); });
            } else {
                throw UI_Error.ParameterMismatch(container);
            }
        }
    }

    class WView {
        #View;

        constructor(view = null) {
            if (Judge.isHTMLElement(view)) {
                this.#View = view;
            } else if (Judge.isNull(view)) {
                this.#View = createElement({
                    attribute: [["w-view", ""]]
                });
            } else {
                throw UI_Error.ParameterMismatch(view);
            }
        }

        getIndex() {
            return WView.GetItemView(this.#View);
        }

        removeView() {
            return WView.RemoveView(this.#View);
        }

        selectView() {
            return WView.SelectView(this.#View);
        }

        // 判断是否是 view
        static Is(view) {
            return view.hasAttr("w-view");
        }

        // 获取视图索引
        static GetIndex(view) {
            if (Judge.isHTMLElement(view) && view.hasAttribute("w-index"))
                return parseInt(view.getAttribute("w-index"));
            else return -1;
        }

        // 移除视图
        static RemoveView(view) {
            if (Judge.isHTMLElement(view)) {
                view.remove();
            } else {
                throw UI_Error.ParameterMismatch(view);
            }
        }

        // 选择视图
        static SelectView(view) {
            if (!Judge.isHTMLElement(view)) throw UI_Error.ParameterMismatch(view);
            if (view) {
                view.addClass("select");
                return view;
            } else {
                throw UI_Error.NotExistItem(view);
            }
        }

        // 清除带选择标签的视图
        static RemoveSelectTagView(container) {
            if (Judge.isHTMLElement(container)) {
                forEnd(container.$(">.select"), (view) => { view.removeClass("select"); });
            } else {
                throw UI_Error.ParameterMismatch(container);
            }
        }
    }

    class WList {
        #TriggerMode = WEvent.mousedown;

        // 删除回调
        callback_Delete() { }
        // 移除项回调
        callback_RemoveItem() { }
        // 选择项回调
        callback_SelectItem() { }

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 设置反转排序项
        setReverse(bool = true, direction = WDirection.Column) {
            if (!Judge.isValueInObject(direction, WDirection)) throw UI_Error.ParameterMismatch(direction);
            _SetClassList(this.ui, bool, `w-${direction}-reverse`);
        }

        // 设置排序方向
        setSortDirection(direction = WDirection.Column) {
            if (!Judge.isValueInObject(direction, WDirection)) throw UI_Error.ParameterMismatch(direction);
            _SetClassList(this.ui, false, `w-${WDirection.Column}-direction`);
            _SetClassList(this.ui, false, `w-${WDirection.Row}-direction`);

            _SetClassList(this.ui, true, `w-${direction}-direction`);
        }

        // 排序项
        sortItem() {
            forEnd(this.ui.$(">[w-item]"), (item, i) => { item.attr("w-index", i); });
        }

        // 返回项数量
        itemSize() {
            return this.getItemAll().length;
        }

        // 通过索引获取项
        getItem(index = 0) {
            return this.getItemAll()[index];
        }

        // 获取所有项
        getItemAll() {
            return this.ui.$("[w-item]");
        }

        // 获取选中的项
        getSelectItem() {
            return this.ui.$(">.select")[0];
        }

        // 获取禁用的项
        getDisabledItem() {
            return this.ui.$(">[disabled]");
        }

        // 根据索引或者项移除项
        removeItem(indexOrItem = 0 || HTMLElement) {
            this.callback_RemoveItem(indexOrItem);
            if (Judge.isNumber(indexOrItem)) {
                WItem.RemoveItem(this.getItem(indexOrItem));
            } else if (Judge.isHTMLElement(indexOrItem) && this.ui.contains(indexOrItem) && WItem.Is(indexOrItem)) {
                WItem.RemoveItem(indexOrItem);
            } else {
                throw UI_Error.ParameterMismatch(indexOrItem);
            }
            this.sortItem();
        }

        // 添加项
        addItem(item = "" || HTMLElement, isSort = true) {
            if (item && Judge.isHTMLElement(item)) {
                item.attr("w-item", "");
                this.ui.appendChild(item);
            } else if (item && Judge.isString(item)) {
                this.ui.appendChild(createElement({
                    attribute: [["w-item", ""]],
                    text: item
                }));
            } else {
                throw UI_Error.ParameterMismatch(item);
            }
            isSort && this.sortItem();
        }

        // 添加多项
        addItems(items = [], isSort = true) {
            forEnd(items, (item, i) => {
                try {
                    this.addItem(item, false);
                } catch (error) {
                    throw `${error} #Error index : ${i}`;
                }
            });
            isSort && this.sortItem();
        }

        // 在项之后插入项
        insertItem(item = 0 || HTMLElement, target = 0 || HTMLElement) {
            let v1, v2;
            if (Judge.isHTMLElement(item) && this.ui.contains(item)) {
                v1 = item;
            } else if (Judge.isNumber(item)) {
                v1 = this.getItem(item);
                if (!v1) throw UI_Error.NotExistItem(item);
            } else {
                throw UI_Error.ParameterMismatch(item);
            }

            if (Judge.isHTMLElement(target) && this.ui.contains(target)) {
                v2 = target;
            } else if (Judge.isNumber(target)) {
                v2 = this.getItem(target);
                if (!v2) throw UI_Error.NotExistItem(target);
            } else {
                throw UI_Error.ParameterMismatch(target);
            }

            v2.insertAdjacentElement('afterend', v1);
            this.sortItem();
        }

        // 在项之前插入项
        insertBeforeItem(item = 0 || HTMLElement, target = 0 || HTMLElement) {
            let v1, v2;
            if (Judge.isHTMLElement(item) && this.ui.contains(item)) {
                v1 = item;
            } else if (Judge.isNumber(item)) {
                v1 = this.getItem(item);
                if (!v1) throw UI_Error.NotExistItem(item);
            } else {
                throw UI_Error.ParameterMismatch(item);
            }

            if (Judge.isHTMLElement(target) && this.ui.contains(target)) {
                v2 = target;
            } else if (Judge.isNumber(target)) {
                v2 = this.getItem(target);
                if (!v2) throw UI_Error.NotExistItem(target);
            } else {
                throw UI_Error.ParameterMismatch(target);
            }

            this.ui.insertBefore(v1, v2);
            this.sortItem();
        }

        // 交换项
        swapItem(item = 0 || HTMLElement, target = 0 || HTMLElement) {
            let v1, v2;
            if (Judge.isHTMLElement(item) && item.attr("w-item")) {
                v1 = item;
            } else if (Judge.isNumber(item)) {
                v1 = this.getItem(item);
                if (!v1) throw UI_Error.NotExistItem(item);
            } else {
                throw UI_Error.ParameterMismatch(item);
            }

            if (Judge.isHTMLElement(target) && target.attr("w-item")) {
                v2 = target;
            } else if (Judge.isNumber(target)) {
                v2 = this.getItem(target);
                if (!v2) throw UI_Error.NotExistItem(target);
            } else {
                throw UI_Error.ParameterMismatch(target);
            }

            this.ui.insertBefore(v1, v2);
            this.sortItem();
        }

        // 设置项
        setItemContent(indexOrItem = 0 || HTMLElement, content = "" || HTMLElement) {
            let item;
            if (Judge.isNumber(indexOrItem)) {
                item = this.getItem(indexOrItem);
            } else if (Judge.isHTMLElement(indexOrItem) && this.ui.contains(indexOrItem)) {
                item = indexOrItem;
            } else {
                throw UI_Error.ParameterMismatch(indexOrItem);
            }

            if (Judge.isString(content)) {
                item.innerRemove();
                item.innerText = content;
            } else if (Judge.isHTMLElement(content)) {
                item.innerRemove();
                item.appendChild(content);
            } else {
                throw UI_Error.ParameterMismatch(content);
            }
        }

        // 设置禁用项
        setDisabledItem(indexOrItem = Number || HTMLElement) {
            if (Judge.isNumber(indexOrItem)) {
                WItem.RemoveItem(this.getItem(indexOrItem));
            } else if (Judge.isHTMLElement(indexOrItem) && this.ui.contains(indexOrItem)) {
                WItem.RemoveItem(indexOrItem);
            } else {
                throw UI_Error.ParameterMismatch(indexOrItem);
            }
        }

        // 选择项
        selectItem(indexOrItem = 0 || HTMLElement) {
            let item;
            if (Judge.isHTMLElement(indexOrItem) && indexOrItem.hasAttr("w-item") && this.ui.contains(indexOrItem)) {
                item = indexOrItem;
            } else if (Judge.isNumber(indexOrItem)) {
                item = this.getItem(indexOrItem);
                if (!item && !this.ui.contains(indexOrItem)) throw UI_Error.NotExistItem(indexOrItem);
            } else {
                throw UI_Error.ParameterMismatch(indexOrItem);
            }
            WItem.RemoveSelectTagItem(this.ui);
            WItem.SelectItem(item);
            this.callback_SelectItem(item);
        }

        // 设置选择项的触发方式
        setSelectItemTriggerMode(mode = WEvent.mousedown || WEvent.click) {
            if (mode !== WEvent.mousedown || mode !== WEvent.click) throw UI_Error.ParameterMismatch(content);
            this.#TriggerMode = mode;
        }

        // 初始化
        #init() {
            this.sortItem();

            this.ui.addEvent("mousedown", (event) => {
                if (this.#TriggerMode !== WEvent.mousedown) return;

                const TargetElement = event.target;
                const item = WItem.GetItem(TargetElement, this.ui);
                if (!item) return;
                this.selectItem(item);

            }, () => {
                const selectItem = this.ui.$(">.select")[0];
                if (selectItem) eventTrigger(selectItem, WEvent.mousedown);
            });
            this.ui.addEvent("click", (event) => {
                if (this.#TriggerMode !== WEvent.click) return;

                const TargetElement = event.target;
                const item = WItem.GetItem(TargetElement, this.ui);
                if (!item) return;
                this.selectItem(item);
            }, () => {
                const selectItem = this.ui.$(">.select")[0];
                if (selectItem) eventTrigger(selectItem, WEvent.click);
            });
        }

        constructor(Element = null) {
            if (IsUiInit(this, Element)) return;
            if (Judge.isHTMLElement(Element)) {
                this.ui = Element;
            } else if (Judge.isNull(Element)) {
                this.ui = createElement({
                    classList: ["w-list"]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init();
        }
    }

    class WButton {
        #EventWait = false;

        #EventAgent = (event) => {
            const TargetElement = event.target;
            if (this.ui.hasAttr("disabled")) return;
            if (this.#EventWait) {
                _SetClassList(this.ui, true, "w-pointer-events-none");
                this.callback_Click(TargetElement, event);
                _SetClassList(this.ui, false, "w-pointer-events-none");
            } else
                this.callback_Click(TargetElement, event);
        }

        // 删除回调
        callback_Delete() { }
        // 点击回调
        callback_Click() { }

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 设置事件代理
        setEventAgent(bool = true) {
            if (bool) {
                this.ui.addEvent("click", this.#EventAgent);
            } else {
                this.ui.removeEvent("click", this.#EventAgent);
            }
        }

        // 设置事件等待
        setEventWait(bool = true) {
            if (!Judge.isBoolean(bool)) throw UI_Error.ParameterMismatch(bool);
            this.#EventWait = bool;
        }

        // 设置 ui 禁用
        setDisabled(bool = true) {
            if (bool) {
                this.ui.attr("disabled", "");
            } else {
                this.ui.removeAttr("disabled");
            }
        }

        // 设置文本
        setText(text = "") {
            this.ui.textContent = text;
        }

        // 初始化
        #init() {
        }

        constructor(Element = null) {
            if (IsUiInit(this, Element)) return;
            if (Judge.isHTMLElement(Element)) {
                this.ui = Element;
            } else if (Judge.isNull(Element)) {
                this.ui = createElement({
                    tagName: "button",
                    classList: ["w-button"]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init();
        }
    }

    class WEdit {
        // 删除回调
        callback_Delete() { }
        // 输入事件回调
        callback_Input() { }
        // 值变化事件回调
        callback_ValueChange() { }
        // 复制事件回调
        callback_Copy() { }
        // 粘贴事件回调
        callback_Paste() { }
        // 剪贴事件回调
        callback_Cut() { }

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 获取值
        getValue(returnType = String) {
            if (returnType === String) {
                return this.ui.value;
            } else if (returnType === Number) {
                return parseInt(this.ui.value);
            } else if (returnType === "Float") {
                return parseFloat(this.ui.value);
            } else throw UI_Error.ParameterMismatch(returnType);
        }

        // 设置只读
        setReadObly(bool = true) {
            bool ? this.ui.attr("readonly", "") : this.ui.removeAttr("readonly");
        }

        // 设置最大输入长度
        setMaxLength(length = null) {
            if (!Judge.isNumber(length) || !Judge.isNull(length)) throw UI_Error.ParameterMismatch(length);
            Judge.isNull(length) ? this.ui.removeAttr("maxlength") : this.ui.attr("maxlength", length);
        }

        // 设置类型
        setType(type = WInputType.text) {
            if (!Judge.isValueInObject(type, WInputType)) throw UI_Error.ParameterMismatch(type);
            this.ui.attr("type", type);
        }

        // 设置 ui 禁用
        setDisabled(bool = true) {
            if (bool) {
                this.ui.attr("disabled", "");
            } else {
                this.ui.removeAttr("disabled");
            }
        }

        // 初始化
        #init() {
            const fn = debounce((event) => { this.callback_ValueChange(event) }, 80);
            this.ui.w_Event = (event) => {
                if (event.wEventName === "input") {
                    this.callback_Input(event);
                    fn(event);
                } else if (event.wEventName === "copy") {
                    this.callback_Copy(event);
                } else if (event.wEventName === "paste") {
                    this.callback_Paste(event);
                } else if (event.wEventName === "cut") {
                    this.callback_Cut(event);
                }
            }
        }

        constructor(Element = null) {
            if (IsUiInit(this, Element)) return;
            if (Judge.isHTMLElement(Element)) {
                this.ui = Element;
            } else if (Judge.isNull(Element)) {
                this.ui = createElement({
                    tagName: "input",
                    attribute: [["type", WInputType.text]],
                    classList: ["w-edit"]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init();
        }
    }

    class WText {
        // 删除回调
        callback_Delete() { }
        // 输入事件回调
        callback_Input() { }
        // 值变化事件回调
        callback_ValueChange() { }
        // 复制事件回调
        callback_Copy() { }
        // 粘贴事件回调
        callback_Paste() { }
        // 剪贴事件回调
        callback_Cut() { }

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 获取值
        getValue(returnType = String) {
            if (returnType === String) {
                return this.ui.value;
            } else if (returnType === Number) {
                return parseInt(this.ui.value);
            } else if (returnType === "Float") {
                return parseFloat(this.ui.value);
            } else throw UI_Error.ParameterMismatch(returnType);
        }

        // 设置只读
        setReadObly(bool = true) {
            bool ? this.ui.attr("readonly", "") : this.ui.removeAttr("readonly");
        }

        // 设置最大输入长度
        setMaxLength(length = null) {
            if (!Judge.isNumber(length) || !Judge.isNull(length)) throw UI_Error.ParameterMismatch(length);
            Judge.isNull(length) ? this.ui.removeAttr("maxlength") : this.ui.attr("maxlength", length);
        }

        // 设置 ui 禁用
        setDisabled(bool = true) {
            if (bool) {
                this.ui.attr("disabled", "");
            } else {
                this.ui.removeAttr("disabled");
            }
        }

        // 设置大小调整模式
        setResizeMode(mode = WWindowOperation.both) {
            if (!Judge.isValueInObject(mode, WWindowOperation)) throw UI_Error.ParameterMismatch(mode);
            this.ui.removeClass([
                "w-resize-none",
                "w-resize-both",
                "w-resize-horizontal",
                "w-resize-vertical"
            ]);

            this.ui.addClass(`w-resize-${mode}`);
        }

        // 初始化
        #init() {
            const fn = debounce((event) => { this.callback_ValueChange(event) }, 80);
            this.ui.w_Event = (event) => {
                if (event.wEventName === "input") {
                    this.callback_Input(event);
                    fn(event);
                } else if (event.wEventName === "copy") {
                    this.callback_Copy(event);
                } else if (event.wEventName === "paste") {
                    this.callback_Paste(event);
                } else if (event.wEventName === "cut") {
                    this.callback_Cut(event);
                }
            }
        }

        constructor(Element = null) {
            if (IsUiInit(this, Element)) return;
            if (Judge.isHTMLElement(Element)) {
                this.ui = Element;
            } else if (Judge.isNull(Element)) {
                this.ui = createElement({
                    tagName: "textarea",
                    classList: ["w-text"]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init();
        }
    }

    class WFieldset {
        // 删除回调
        callback_Delete() { }

        #legendElement = createElement({
            tagName: "legend",
            classList: ["legend"]
        });

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 设置 legend 文本
        setLegendText(text) {
            this.#legendElement.textContent = text;
        }

        // 初始化
        #init() {
            const first = this.ui.firstElementChild;
            this.ui.appendChild(this.#legendElement);
            if (first !== this.#legendElement) {
                this.ui.insertBefore(this.#legendElement, first);
            }
            const legendText = this.ui.attr("legend");
            if (Judge.isTrue(legendText)) {
                this.setLegendText(legendText);
            } else {
                throw UI_Error.MissingVitalElement("legend text");
            }
        }

        constructor(Element = null, legend = "") {
            if (IsUiInit(this, Element)) return;
            if (Judge.isHTMLElement(Element)) {
                this.ui = Element;
            } else if (Judge.isNull(Element)) {
                this.ui = createElement({
                    tagName: "fieldset",
                    classList: ["w-fieldset"],
                    attribute: [["legend", legend]]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init();
        }
    }

    class WStacked {
        // 删除回调
        callback_Delete() { }
        // 移除视图回调
        callback_RemoveView() { }

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 移除视图
        removeView(indexOrView = 0 || HTMLElement) {
            this.callback_RemoveView(indexOrView);
            if (Judge.isNumber(indexOrView)) {
                WView.RemoveView(this.getView(indexOrView));
            } else if (Judge.isHTMLElement(indexOrView) && this.ui.contains(indexOrView) && WView.Is(indexOrView)) {
                WView.RemoveView(indexOrView);
            } else {
                throw UI_Error.ParameterMismatch(indexOrView);
            }
            this.sortView();
        }

        // 添加视图
        addView(view = HTMLElement, isSort = true) {
            if (view && Judge.isHTMLElement(view)) {
                view.attr("w-view", "");
                this.ui.appendChild(view);
            } else {
                throw UI_Error.ParameterMismatch(view);
            }
            isSort && this.sortView();
        }

        // 添加多视图
        addViews(views = [], isSort = true) {
            forEnd(views, (view, i) => {
                try {
                    this.addView(view, false);
                } catch (error) {
                    throw `${error} #Error index : ${i}`;
                }
            });
            isSort && this.sortView();
        }

        // 获取视图
        getView(index = 0) {
            return this.getViewAll()[index];
        }

        // 获取所有视图
        getViewAll() {
            return this.ui.$("[w-view]");
        }

        // 选择视图
        selectView(indexOrView = 0 || HTMLElement) {
            WView.RemoveSelectTagView(this.ui);
            if (Judge.isNumber(indexOrView)) {
                WView.SelectView(this.getView(indexOrView));
            } else if (Judge.isHTMLElement(indexOrView) && this.ui.contains(indexOrView)) {
                WView.SelectView(indexOrView);
            } else {
                throw UI_Error.ParameterMismatch(indexOrView);
            }
        }

        // 排序视图
        sortView() {
            forEnd(this.ui.$(">[w-view]"), (view, i) => { view.attr("w-index", i); });
        }

        // 返回视图数量
        viewSize() {
            return this.getItemAll().length;
        }

        // 初始化
        #init() {
            this.sortView();
        }

        constructor(Element = null) {
            if (IsUiInit(this, Element)) return;
            if (Judge.isHTMLElement(Element)) {
                this.ui = Element;
            } else if (Judge.isNull(Element)) {
                this.ui = createElement({
                    classList: ["w-stacked"]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init();
        }
    }

    class WTab {
        #barElement = createElement({ attribute: [["w-bar", ""]] });
        #contentElement = createElement({ attribute: [["w-content", ""]] });

        // 删除回调
        callback_Delete() { }
        // 移除 tab 回调
        callback_RemoveTab() { }

        // 渲染 bar
        #renderBar() {
            this.#barElement.innerRemove();
            forEnd(this.getTabAll(), view => {
                const title = createElement({ attribute: [["w-item", ""]] });
                const config = view.attr("tab-config").split(" ");
                forEnd(config, (arg) => {
                    const str = arg.substring(0, 5);
                    if (str === "icon:") {
                        const path = arg.substring(5);
                        if (path !== "") {
                            title.appendChild(createElement({
                                tagName: "img",
                                classList: ["icon", "w-center-flex"],
                                attribute: [["src", path]]
                            }));
                        }
                        return true;
                    }
                });
                title.appendChild(createElement({
                    tagName: "span",
                    classList: ["text", "w-center-flex"],
                    text: view.attr("tab-title")
                }));
                if (config.includes("disabled")) title.attr("disabled", "");
                if (config.includes("move")) title.attr("move", "");
                if (config.includes("delete")) {
                    const deleteBtn = createElement({
                        tagName: "i",
                        classList: ["delete-btn", "material-icons", "w-center-flex"],
                        text: "\ue14c"
                    });
                    if (config.includes("hide-delete")) deleteBtn.addClass("hide");
                    title.appendChild(deleteBtn);
                }

                this.#barElement.appendChild(title);
            });
        }

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 移除 tab
        removeTab(indexOrView = 0 || HTMLElement) {
            this.callback_RemoveTab(indexOrView);
            let current = false;
            if (Judge.isNumber(indexOrView)) {
                WView.RemoveView(this.getTab(indexOrView));
            } else if (Judge.isHTMLElement(indexOrView) && this.ui.contains(indexOrView) && WView.Is(indexOrView)) {
                if (WItem.IsSelect(indexOrView)) current = true;
                WView.RemoveView(indexOrView);
            } else {
                throw UI_Error.ParameterMismatch(indexOrView);
            }
            this.sortTab();
        }

        // 添加 tab
        addTab(view = HTMLElement, isSort = true) {
            if (view && Judge.isHTMLElement(view)) {
                view.attr("w-view", "");
                this.#contentElement.appendChild(view);
            } else {
                throw UI_Error.ParameterMismatch(view);
            }
            isSort && this.sortTab();
        }

        // 添加多 tab
        addTabs(views = [], isSort = true) {
            forEnd(views, (view, i) => {
                try {
                    this.addTab(view, false);
                } catch (error) {
                    throw `${error} #Error index : ${i}`;
                }
            });
            isSort && this.sortTab();
        }

        // 获取 tab
        getTab(index) {
            return this.getTabAll()[index];
        }

        // 获取所有 tab
        getTabAll() {
            return this.#contentElement.$("[w-view]");
        }

        // 获取选中 tab
        getSelectTab(){
            
        }

        // 选择 tab
        selectTab(indexOrView = 0 || HTMLElement) {
            WView.RemoveSelectTagView(this.#barElement);
            WItem.RemoveSelectTagItem(this.#contentElement);
            if (Judge.isNumber(indexOrView)) {
                WView.SelectView(this.getTab(indexOrView));
                WItem.SelectItem(this.#barElement.$(">[w-item]")[indexOrView]);
            } else if (Judge.isHTMLElement(indexOrView) && this.ui.contains(indexOrView)) {
                WView.SelectView(indexOrView);
                WItem.SelectItem(this.#barElement.$(">[w-item]")[parseInt(indexOrView.attr("w-index"))]);
            } else {
                throw UI_Error.ParameterMismatch(indexOrView);
            }
        }

        // 排序 tab
        sortTab() {
            this.#renderBar();

            const v1 = this.#barElement.$(">[w-item]");
            const v2 = this.getTabAll();
            if (v1.length !== v2.length) throw UI_Error.CustomError("Tab and view asymmetry", `Tab size : ${v1.length}, View size : ${v2.length}`);
            forEnd(v1, (item, i) => { item.attr("w-index", i); });
            forEnd(v2, (view, i) => { view.attr("w-index", i); });
        }

        // 返回 tab 数量
        tabSize() {
            return this.getTabAll().length;
        }

        // 初始化
        #init() {
            this.ui.append(this.#barElement, this.#contentElement);
            this.addTabs(this.ui.$(">[w-view]"));

            const defaultSelect = this.#contentElement.$(">.select")[0];
            if (defaultSelect) this.selectTab(defaultSelect); else this.selectTab(0);

            this.#barElement.addEvent("mousedown", (event) => {
                const TargetElement = event.target;
                if (TargetElement.hasAttr("w-bar")) return;
                const item = WItem.SelectItem$(TargetElement, this.#barElement);
                if (item) {
                    this.selectTab(parseInt(item.attr("w-index")));
                }
            });
            this.#barElement.addEvent("click", (event) => {
                const TargetElement = event.target;
                if (TargetElement.hasAttr("w-bar")) return;
                const item = WItem.GetItem(TargetElement, this.#barElement);
                if (item && !WItem.IsDisabled(item)) {
                    if (TargetElement.hasClass("delete-btn")) {
                        this.removeTab(parseInt(item.attr("w-index")));
                    }
                }
            });
        }

        constructor(Element = null) {
            if (IsUiInit(this, Element)) return;
            if (Judge.isHTMLElement(Element)) {
                this.ui = Element;
            } else if (Judge.isNull(Element)) {
                this.ui = createElement({
                    classList: ["w-tab"],
                    child: [
                        this.#barElement,
                        this.#contentElement
                    ]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init();
        }
    }

    class Dialog {
        #draggableClass;

        #view = {
            titleIcon: createElement({
                tagName: "img",
                classList: ["icon"],
                attribute: [["draggable", "false"]]
            }),
            titleText: createElement({
                tagName: "h1",
                classList: ["text"],
            }),
            titleBtn: WindowFlags.Get(WindowFlags.MinButtonHint | WindowFlags.RestoreButtonHint),
            title: createElement({
                classList: ["title"]
            }),

            content: createElement({
                classList: ["content"],
            }),
            bottom: createElement({
                classList: ["bottom"],
            }),
        };

        // 删除回调
        callback_Delete() { }

        // 删除 ui
        delete() {
            _DeleteSonUi(this.ui);
            this.callback_Delete();
            this.ui.remove();
        }

        // 显示
        show() {
            this.close();
            this.ui.show();
        }

        // 模态显示
        showModal() {
            this.close();
            this.ui.showModal();
        }

        // 设置标题图标
        setTitleIcon(src = "") {
            if (src === "") {
                this.#view.titleIcon.css("display", "none");
                this.#view.titleIcon.src = "";
            } else {
                this.#view.titleIcon.css("display", "block");
                this.#view.titleIcon.src = src;
            }
        }

        // 设置窗口操作
        setWindowOperation(operation = WWindowOperation.default) {
            if (!Judge.isValueInObject(operation, WWindowOperation)) throw UI_Error.ParameterMismatch(operation);
            this.ui.removeClass([
                "w-resize-none",
                "w-resize-both",
                "w-resize-horizontal",
                "w-resize-vertical"
            ]);
            this.ui.addClass(`w-resize-${operation}`);
        }

        // 设置最大宽度
        setMaxWidth(width) {
            this.ui.css({ maxWidth: `${width}px` });
        }

        // 设置最大高度
        setMaxHeight(height) {
            this.ui.css({ maxHeight: `${height}px` });
        }

        // 设置最小宽度
        seMinWidth(width) {
            this.ui.css({ minWidth: `${width}px` });
        }

        // 设置最小高度
        setMinHeight(height) {
            this.ui.css({ minHeight: `${height}px` });
        }

        // 设置宽度
        setWidth(width) {
            this.ui.css({ width: `${width}px` });
        }

        // 设置高度
        setHeight(height) {
            this.ui.css({ height: `${height}px` });
        }

        // 设置坐标 x
        setX(x) {
            if (this.#draggableClass) {
                this.#draggableClass.setTransformX(x);
            } else {
                this.ui.css({ left: `${x}px` });
            }
        }

        // 设置坐标 y
        setY(y) {
            if (this.#draggableClass) {
                this.#draggableClass.setTransformY(y);
            } else {
                this.ui.css({ top: `${y}px` });
            }
        }

        // 设置坐标 x,y
        setXY(x, y) {
            this.setX(x);
            this.setY(y);
        }

        // 关闭
        close() {
            this.ui.close();
        }

        // 初始化窗口出现位置
        #initPosition(position) {
            const wH = MainWindow.rect().height;
            const wW = MainWindow.rect().width;
            const uH = this.ui.rect().height;
            const uW = this.ui.rect().width;
            if (position === 0) {
                this.setXY(0, 0);
            } else if (position === 1) {
                this.setXY(0, wH / 2 - uH / 2);
            } else if (position === 2) {
                this.setXY(0, wH - uH);
            } else if (position === 3) {
                this.setXY(wW / 2 - uW / 2, 0);
            } else if (position === 4) {
                this.setXY(wW / 2 - uW / 2, wH / 2 - uH / 2);
            } else if (position === 5) {
                this.setXY(wW / 2 - uW / 2, wH - uH);
            } else if (position === 6) {
                this.setXY(wW - uW, 0);
            } else if (position === 7) {
                this.setXY(wW - uW, wH / 2 - uH / 2);
            } else if (position === 8) {
                this.setXY(wW - uW, wH - uH);
            } else {
                throw UI_Error.ParameterMismatch(position);
            }
        }

        // 初始化
        #init({
            parent = MainWindow,
            iconSrc = "",
            title = "",
            width = 300,
            height = 200,
            minWidth = 300,
            minHeight = 200,
            maxWidth = 327671,
            maxHeight = 327671,
            windowOperation = WWindowOperation.default,
            draggable = true,
            position = WPlace.Center.Center
        } = {}) {
            this.#view.titleText.textContent = title;
            this.#view.title.append(this.#view.titleIcon, this.#view.titleText, this.#view.titleBtn);

            this.setHeight(height);
            this.setWidth(width);
            this.seMinWidth(minWidth);
            this.setMinHeight(minHeight);
            this.setMaxWidth(maxWidth);
            this.setMaxHeight(maxHeight);
            this.setTitleIcon(iconSrc);
            this.setWindowOperation(windowOperation);

            this.#view.titleBtn.ClickEvent = (eventName) => {
                if (eventName === "close") {
                    elementAnimation(this.ui, "WebGUIPro-opacity 0.1s reverse forwards", () => { this.delete() });
                }
            }

            parent.appendFragment(this.ui);
            if (draggable) {
                this.#draggableClass = new AddDraggable({
                    element: this.#view.titleText,
                    effectElement: this.ui,
                    fn: _ => true
                });
            }
            this.#initPosition(position);
        }

        constructor(obj = {}) {
            if (Judge.isObject(obj)) {
                this.ui = createElement({
                    tagName: "dialog",
                    classList: ["w-dialog"],
                    child: [this.#view.title, this.#view.content, this.#view.bottom]
                });
            } else {
                throw UI_Error.ParameterMismatch(Element);
            }
            this.ui.Class = this;
            this.#init(obj);
        }
    }

    /**
     * 根据指定的规则替换包含在元素内部的文本内容
     * 元素必须具有属性 `w-value-entry`
     */
    function WValueEntry() {
        forEnd($("[w-value-entry]"), (e) => {
            const regex = /{{([^{}]+)}}/g;
            const str = e.innerText;
            e.innerText = str.replace(regex, (match, p1) => {
                const trimmedP1 = p1.trim();
                if (trimmedP1.endsWith('()')) {
                    // 如果是函数调用，则使用 Function 构造函数执行函数
                    const dynamicFunction = new Function(`return ${trimmedP1}`);
                    return dynamicFunction();
                } else {
                    // 否则获取全局变量的值
                    const globalValue = window[trimmedP1];
                    return globalValue !== undefined ? globalValue : ''; // 如果变量不存在则返回空字符串
                }
            });
        });
    }

    // 判断 ui 是否初始化
    function IsUiInit(uiClass, ui) {
        if (ui.attr("winit") !== `${uiClass.constructor.name}`) {
            ui.attr("winit", uiClass.constructor.name)
        } else return true;
    }

    const ControlDataList = [
        ["list", WList],
        ["button", WButton],
        ["edit", WEdit],
        ["text", WText],
        ["fieldset", WFieldset],
        ["stacked", WStacked],
        ["tab", WTab],
    ];

    function render(stylepath = null) {
        if (!Judge.isNull(stylepath)) {
            stylepath = stylepath + "/style/";
            includeCssFiles([
                [stylepath + "DefaultTheme.css", null, _WebUtilPro__STYLE_ELEMENT],
                [stylepath + "Ui.css", null, _WebUtilPro__STYLE_ELEMENT]
            ]);
        }
        anewRender();
    }

    function anewRender(element = MainWindow) {
        forEnd(ControlDataList, (arr) => {
            forEnd($(`.w-${arr[0]}`), (e) => {
                if (e.hasAttr("winit")) return;
                e.attr("winit", "");
                new arr[1](e);
            });
            if (element === `.w-${arr[0]}` && !element.hasAttr("winit")) {
                element.attr("winit", "");
                new arr[1](element);
            }
        });
    }

    // Object.preventExtensions(this);
    return {
        render,
        anewRender,
        WValueEntry,

        WItem,
        WindowFlags,

        WList,
        WButton,
        WEdit,
        WText,
        WFieldset,
        WStacked,
        WTab,

        Dialog
    };
})();

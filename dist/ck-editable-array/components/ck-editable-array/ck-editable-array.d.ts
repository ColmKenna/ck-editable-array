type EditableRow = Record<string, unknown> | string;
export declare class CkEditableArray extends HTMLElement {
    private _data;
    schema: unknown;
    newItemFactory: () => EditableRow;
    constructor();
    get data(): unknown[];
    set data(v: unknown[]);
    connectedCallback(): void;
    private render;
    private bindDataToNode;
    private appendRowFromTemplate;
    private cloneRow;
    private resolveBindingValue;
    private commitRowValue;
    /**
     * Update existing bound nodes in the shadow DOM for a specific row and key.
     * If a specific key is provided, only nodes with that data-bind are updated;
     * otherwise all bound nodes in the row are refreshed.
     */
    private updateBoundNodes;
    private dispatchDataChanged;
    private isRecord;
}
export default CkEditableArray;

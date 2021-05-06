"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleKernel = exports.SampleContentSerializer = void 0;
const vscode = require("vscode");
const util_1 = require("util");
class SampleContentSerializer {
    constructor() {
        this.label = 'My Sample Content Serializer';
    }
    /**
     * @inheritdoc
     */
    async deserializeNotebook(data, token) {
        var contents = new util_1.TextDecoder().decode(data); // convert to String to make JSON object
        // Read file contents
        let raw;
        try {
            raw = JSON.parse(contents);
        }
        catch {
            raw = { cells: [] };
        }
        // Create array of Notebook cells for the VS Code API from file contents
        const cells = raw.cells.map(item => new vscode.NotebookCellData(item.kind, item.value, item.language, item.outputs ? [new vscode.NotebookCellOutput(item.outputs.map(raw => new vscode.NotebookCellOutputItem(raw.mime, raw.value)))] : [], new vscode.NotebookCellMetadata()));
        // Pass read and formatted Notebook Data to VS Code to display Notebook with saved cells
        return new vscode.NotebookData(cells, new vscode.NotebookDocumentMetadata());
    }
    /**
     * @inheritdoc
     */
    async serializeNotebook(data, token) {
        // function to take output renderer data to a format to save to the file
        function asRawOutput(cell) {
            var _a;
            let result = [];
            for (let output of (_a = cell.outputs) !== null && _a !== void 0 ? _a : []) {
                for (let item of output.outputs) {
                    result.push({ mime: item.mime, value: item.value });
                }
            }
            return result;
        }
        // Map the Notebook data into the format we want to save the Notebook data as
        let contents = { cells: [] };
        for (const cell of data.cells) {
            contents.cells.push({
                kind: cell.kind,
                language: cell.language,
                value: cell.source,
                outputs: asRawOutput(cell)
            });
        }
        // Give a string of all the data to save and VS Code will handle the rest
        return new util_1.TextEncoder().encode(JSON.stringify(contents));
    }
}
exports.SampleContentSerializer = SampleContentSerializer;
class SampleKernel {
    constructor() {
        this.id = 'test-notebook-renderer-kernel';
        this.label = 'Sample Notebook Kernel';
        this.supportedLanguages = ['json'];
        this._executionOrder = 0;
        this._controller = vscode.notebook.createNotebookController(this.id, 'test-notebook-renderer', this.label);
        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.hasExecutionOrder = true;
        this._controller.executeHandler = this._executeAll.bind(this);
    }
    dispose() {
        this._controller.dispose();
    }
    _executeAll(cells, _notebook, _controller) {
        for (let cell of cells) {
            this._doExecution(cell);
        }
    }
    async _doExecution(cell) {
        const execution = this._controller.createNotebookCellExecutionTask(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start({ startTime: Date.now() });
        const metadata = {
            startTime: Date.now()
        };
        try {
            execution.replaceOutput([new vscode.NotebookCellOutput([
                    new vscode.NotebookCellOutputItem('application/json', JSON.parse(cell.document.getText())),
                ], metadata)]);
            execution.end({ success: true });
        }
        catch (err) {
            execution.replaceOutput([new vscode.NotebookCellOutput([
                    new vscode.NotebookCellOutputItem('application/x.notebook.error-traceback', {
                        ename: err instanceof Error && err.name || 'error',
                        evalue: err instanceof Error && err.message || JSON.stringify(err, undefined, 4),
                        traceback: []
                    })
                ])]);
            execution.end({ success: false });
        }
    }
}
exports.SampleKernel = SampleKernel;
//# sourceMappingURL=sampleProvider.js.map
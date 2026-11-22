// Borrowed from NativeScript/NativeScript PR #11089:
// packages/core/ui/dialogs/index.macos.ts (types stripped)
export const DialogStrings = {
    STRING: 'string',
    PROMPT: 'Prompt',
    CONFIRM: 'Confirm',
    ALERT: 'Alert',
    LOGIN: 'Login',
    OK: 'OK',
    CANCEL: 'Cancel',
};
export const inputType = {
    text: 'text', password: 'password', email: 'email',
    number: 'number', decimal: 'decimal', phone: 'phone',
};
export const capitalizationType = {
    none: 'none', all: 'all',
    sentences: 'sentences', words: 'words',
};
function normalizeDialogOptions(arg, defaults) {
    if (!arg || typeof arg !== 'object') {
        return { ...defaults, message: `${arg ?? ''}` };
    }
    return { ...defaults, ...arg };
}
function runModalAlert(title, message, buttons) {
    const alert = NSAlert.alloc().init();
    alert.messageText = title || '';
    alert.informativeText = message || '';
    for (const button of buttons) {
        alert.addButtonWithTitle(button);
    }
    return alert.runModal();
}
export function alert(arg) {
    const options = normalizeDialogOptions(arg, { title: DialogStrings.ALERT, okButtonText: DialogStrings.OK });
    runModalAlert(options.title, options.message, [options.okButtonText]);
    return Promise.resolve();
}
export function confirm(arg) {
    const options = normalizeDialogOptions(arg, { title: DialogStrings.CONFIRM, okButtonText: DialogStrings.OK, cancelButtonText: DialogStrings.CANCEL });
    const result = runModalAlert(options.title, options.message, [options.okButtonText, options.cancelButtonText]);
    return Promise.resolve(result === NSAlertFirstButtonReturn);
}
export function prompt(arg) {
    const options = normalizeDialogOptions(arg, { title: DialogStrings.PROMPT, okButtonText: DialogStrings.OK, cancelButtonText: DialogStrings.CANCEL, defaultText: '' });
    const alert = NSAlert.alloc().init();
    alert.messageText = options.title || '';
    alert.informativeText = options.message || '';
    alert.addButtonWithTitle(options.okButtonText);
    alert.addButtonWithTitle(options.cancelButtonText);
    const textField = NSTextField.alloc().initWithFrame(NSMakeRect(0, 0, 260, 24));
    textField.stringValue = options.defaultText || '';
    alert.accessoryView = textField;
    const result = alert.runModal() === NSAlertFirstButtonReturn;
    return Promise.resolve({ result, text: textField.stringValue });
}
export function login(arg) {
    const options = normalizeDialogOptions(arg, { title: DialogStrings.LOGIN, okButtonText: DialogStrings.OK, cancelButtonText: DialogStrings.CANCEL, userName: '', password: '' });
    const alert = NSAlert.alloc().init();
    alert.messageText = options.title || '';
    alert.informativeText = options.message || '';
    alert.addButtonWithTitle(options.okButtonText);
    alert.addButtonWithTitle(options.cancelButtonText);
    const container = NSStackView.alloc().initWithFrame(NSMakeRect(0, 0, 260, 52));
    container.orientation = 0; // NSUserInterfaceLayoutOrientationVertical
    container.spacing = 8;
    const userField = NSTextField.alloc().initWithFrame(NSMakeRect(0, 0, 260, 24));
    userField.placeholderString = options.userNameHint || '';
    userField.stringValue = options.userName || '';
    const passwordField = NSSecureTextField.alloc().initWithFrame(NSMakeRect(0, 0, 260, 24));
    passwordField.placeholderString = options.passwordHint || '';
    passwordField.stringValue = options.password || '';
    container.addArrangedSubview(userField);
    container.addArrangedSubview(passwordField);
    alert.accessoryView = container;
    const ok = alert.runModal() === NSAlertFirstButtonReturn;
    return Promise.resolve({ result: ok, userName: userField.stringValue, password: passwordField.stringValue });
}
export function action(arg) {
    const options = normalizeDialogOptions(arg, { title: '', message: '', cancelButtonText: DialogStrings.CANCEL, actions: [] });
    const actions = Array.isArray(options.actions) ? options.actions : [];
    const buttons = [...actions, options.cancelButtonText];
    const result = runModalAlert(options.title, options.message, buttons);
    const index = result - NSAlertFirstButtonReturn;
    return Promise.resolve(buttons[index] ?? options.cancelButtonText);
}
export function getCurrentPage() {
    return null;
}
export const Dialogs = { alert, confirm, prompt, login, action };
